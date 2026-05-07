/**
 * Supabase Realtime + REST sync client. Drop-in replacement for SyncClient
 * when the operator chooses managed Postgres over self-hosted ingest.
 *
 * Initial fetch: REST query for events with site_id matching the room.
 * Live: postgres_changes subscription on INSERTs filtered by site_id.
 *
 * Same SyncEvent + SyncStatus surface as SyncClient so useSync stays simple.
 */

import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { decryptEvent } from "./crypto";
import type { SyncStatus } from "@/store/useSessions";

export type SyncEvent = {
  ts: number;
  payload: unknown;
};

export type SupabaseSyncOptions = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** 64-char hex of the public PBKDF2-derived siteId. */
  roomId: string;
  siteKey: CryptoKey;
  onEvent: (event: SyncEvent) => void;
  onStatus: (status: SyncStatus, detail?: string) => void;
  /** Initial fetch window (ms). Default 30 days. */
  windowMs?: number | undefined;
};

const DEFAULT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export class SupabaseSyncClient {
  private readonly opts: SupabaseSyncOptions;
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private closed = false;

  constructor(opts: SupabaseSyncOptions) {
    this.opts = opts;
  }

  start(): void {
    this.closed = false;
    this.opts.onStatus("connecting");
    void this.connect();
  }

  stop(): void {
    this.closed = true;
    if (this.channel && this.client) {
      void this.client.removeChannel(this.channel);
    }
    this.channel = null;
    this.client = null;
    this.opts.onStatus("idle");
  }

  private async connect(): Promise<void> {
    try {
      this.client = createClient(this.opts.supabaseUrl, this.opts.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 50 } },
      });
    } catch (e) {
      this.opts.onStatus("error", e instanceof Error ? e.message : "client init failed");
      return;
    }
    if (this.closed) return;

    // Postgres bytea is sent as `\xHEXSTRING`. Match by the same pattern.
    const sitePg = `\\x${this.opts.roomId}`;
    const cutoff = Date.now() - (this.opts.windowMs ?? DEFAULT_WINDOW_MS);

    // 1. Backfill: pull recent events.
    try {
      const { data, error } = await this.client
        .from("events")
        .select("received_at, ciphertext")
        .eq("site_id", sitePg)
        .gte("time_bucket", cutoff)
        .order("received_at", { ascending: true })
        .limit(20000);
      if (error) throw error;
      if (data) {
        for (const row of data) {
          const bytes = decodeBytea(row.ciphertext);
          const payload = await this.tryDecrypt(bytes);
          if (payload !== null) {
            this.opts.onEvent({ ts: Number(row.received_at), payload });
          }
        }
      }
    } catch (e) {
      this.opts.onStatus("error", e instanceof Error ? e.message : "backfill failed");
      return;
    }
    if (this.closed) return;

    // 2. Realtime: subscribe to INSERTs for this site_id.
    const channel = this.client.channel(`events:${this.opts.roomId}`);
    type PgChange = "postgres_changes";
    type ChannelOn = (
      type: PgChange,
      config: { event: string; schema: string; table: string; filter: string },
      cb: (msg: { new: { received_at: number; ciphertext: unknown } }) => void,
    ) => RealtimeChannel;
    const onTyped = (channel as unknown as { on: ChannelOn }).on;
    this.channel = onTyped.call(
      channel,
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "events",
        filter: `site_id=eq.${sitePg}`,
      },
      (msg) => {
        const bytes = decodeBytea(msg.new.ciphertext);
        void this.tryDecrypt(bytes).then((payload) => {
          if (payload !== null) {
            this.opts.onEvent({ ts: Number(msg.new.received_at), payload });
          }
        });
      },
    );
    this.channel.subscribe((status: string) => {
      if (this.closed) return;
      if (status === "SUBSCRIBED") this.opts.onStatus("connected");
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        this.opts.onStatus("error", status);
      } else if (status === "CLOSED") this.opts.onStatus("offline");
    });
  }

  private async tryDecrypt(bytes: Uint8Array): Promise<unknown | null> {
    try {
      return await decryptEvent(this.opts.siteKey, bytes);
    } catch {
      return null;
    }
  }
}

/**
 * Postgres `bytea` is serialized as `\xHEXSTRING` over PostgREST. Older clients
 * may also surface it as base64. Handle both.
 */
function decodeBytea(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") {
    if (value.startsWith("\\x")) return hexToBytes(value.slice(2));
    // base64 fallback
    const bin = atob(value);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array();
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return out;
}
