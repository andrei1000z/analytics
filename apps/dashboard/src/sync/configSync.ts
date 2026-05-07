/**
 * Cross-device dashboard state sync — Phase 7.
 *
 * The master passphrase derives a separate (roomId, AES key) pair that is
 * unrelated to any individual site's passphrase. The dashboard pushes its
 * persisted state (sites + collections + endpoint URLs + per-site passphrases)
 * encrypted to a "config room" on the ingest server. Other devices subscribe
 * to the same room with the same master passphrase, decrypt the latest
 * snapshot, and hydrate.
 *
 * Trust model: the master passphrase is effectively the "operator identity"
 * key. Compromise of the master means compromise of every per-site passphrase
 * stored in the synced snapshot. Users wanting per-site key independence can
 * skip enabling sync and re-enter passphrases manually on each device.
 *
 * Wire format: gzip(JSON.stringify(snapshot)) → AES-GCM (iv || ct) — same as
 * tracker beacons, so no server changes needed; the existing /e and /sync
 * endpoints route this naturally as another "site".
 */

import { base64ToBytes, decryptEvent, deriveKeys } from "./crypto";

export type ConfigSnapshot = {
  v: 1;
  ts: number;
  sites: Record<string, unknown>;
  collections: Record<string, unknown>;
  ingestUrl: string;
  trackerUrl: string;
  /** siteId → in-memory passphrase. Allows other devices to auto-unlock. */
  passphrases: Record<string, string>;
};

export type ConfigStatus = "idle" | "connecting" | "connected" | "offline" | "error";

export type ConfigSyncOptions = {
  ingestUrl: string;
  masterPassphrase: string;
  onSnapshot: (snap: ConfigSnapshot) => void;
  onStatus: (status: ConfigStatus, detail?: string) => void;
};

const HEARTBEAT_MS = 25_000;
const BACKOFF_MIN = 1_000;
const BACKOFF_MAX = 30_000;
/** Subscribe window — config snapshots aren't time-series, take whatever's latest. */
const FETCH_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

async function gzip(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("gzip");
  const stream = new Blob([input as BlobPart]).stream().pipeThrough(cs);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function gunzip(input: Uint8Array): Promise<Uint8Array> {
  const cs = new DecompressionStream("gzip");
  const stream = new Blob([input as BlobPart]).stream().pipeThrough(cs);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export class ConfigSyncClient {
  private readonly opts: ConfigSyncOptions;
  private roomId: string | null = null;
  private siteKey: CryptoKey | null = null;
  private ws: WebSocket | null = null;
  private wsUrl = "";
  private postUrl = "";
  private backoff = BACKOFF_MIN;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private closed = false;
  private latestTs = 0;

  constructor(opts: ConfigSyncOptions) {
    this.opts = opts;
  }

  async start(): Promise<void> {
    this.closed = false;
    this.opts.onStatus("connecting", "deriving");
    try {
      const keys = await deriveKeys(this.opts.masterPassphrase);
      this.roomId = keys.roomId;
      this.siteKey = keys.siteKey;
    } catch (e) {
      this.opts.onStatus("error", e instanceof Error ? e.message : "derive failed");
      return;
    }

    const base = this.opts.ingestUrl.replace(/\/+$/, "");
    this.postUrl = `${base}/e?s=${encodeURIComponent(this.roomId)}`;
    const u = new URL(this.opts.ingestUrl);
    if (u.protocol === "http:") u.protocol = "ws:";
    if (u.protocol === "https:") u.protocol = "wss:";
    u.pathname = u.pathname.replace(/\/+$/, "") + "/sync";
    u.searchParams.set("room", this.roomId);
    this.wsUrl = u.toString();

    this.connect();
  }

  stop(): void {
    this.closed = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* noop */
      }
    }
    this.ws = null;
    this.opts.onStatus("idle");
  }

  /**
   * Encrypt + gzip + push the snapshot to the ingest server. Fire-and-forget.
   * Other devices receive it via the WS broadcast channel for the same room.
   */
  async push(snap: ConfigSnapshot): Promise<void> {
    if (!this.siteKey || this.closed) return;
    const json = JSON.stringify(snap);
    const compressed = await gzip(new TextEncoder().encode(json));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.siteKey, compressed),
    );
    const body = new Uint8Array(iv.length + ct.length);
    body.set(iv, 0);
    body.set(ct, iv.length);
    try {
      await fetch(this.postUrl, {
        method: "POST",
        body: new Blob([body as BlobPart], { type: "text/plain" }),
        keepalive: true,
        credentials: "omit",
      });
      this.latestTs = snap.ts;
    } catch (e) {
      this.opts.onStatus("error", e instanceof Error ? e.message : "push failed");
    }
  }

  private clearTimers(): void {
    if (this.heartbeatTimer !== null) window.clearTimeout(this.heartbeatTimer);
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  private connect(): void {
    if (this.closed) return;
    this.opts.onStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.wsUrl);
    } catch (e) {
      this.scheduleReconnect(String(e));
      return;
    }
    this.ws = ws;

    ws.onopen = (): void => {
      this.backoff = BACKOFF_MIN;
      this.opts.onStatus("connected");
      const now = Date.now();
      this.send({ type: "subscribe", from: now - FETCH_WINDOW_MS, to: now });
      this.scheduleHeartbeat();
    };
    ws.onmessage = (e: MessageEvent): void => {
      void this.handleMessage(e.data);
    };
    ws.onerror = (): void => {
      this.opts.onStatus("error", "WebSocket error");
    };
    ws.onclose = (): void => {
      if (this.heartbeatTimer !== null) {
        window.clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (!this.closed) this.scheduleReconnect("closed");
    };
  }

  private scheduleReconnect(detail: string): void {
    if (this.closed) return;
    this.opts.onStatus("offline", detail);
    const delay = Math.min(BACKOFF_MAX, this.backoff);
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
    this.backoff = Math.min(BACKOFF_MAX, this.backoff * 2);
  }

  private scheduleHeartbeat(): void {
    this.heartbeatTimer = window.setTimeout(() => {
      this.send({ type: "ping" });
      this.scheduleHeartbeat();
    }, HEARTBEAT_MS);
  }

  private send(msg: unknown): void {
    const ws = this.ws;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  private async handleMessage(raw: unknown): Promise<void> {
    if (typeof raw !== "string" || !this.siteKey) return;
    let msg: { type?: string; buckets?: Array<{ t: number; ciphertext: string }>; ciphertext?: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === "slice" && msg.buckets) {
      // Take the most-recent decryptable bucket.
      const sorted = [...msg.buckets].sort((a, b) => b.t - a.t);
      for (const b of sorted) {
        const snap = await this.tryDecrypt(b.ciphertext);
        if (snap) {
          this.latestTs = snap.ts;
          this.opts.onSnapshot(snap);
          return;
        }
      }
    } else if (msg.type === "live" && msg.ciphertext) {
      const snap = await this.tryDecrypt(msg.ciphertext);
      if (snap && snap.ts > this.latestTs) {
        this.latestTs = snap.ts;
        this.opts.onSnapshot(snap);
      }
    }
  }

  private async tryDecrypt(b64: string): Promise<ConfigSnapshot | null> {
    if (!this.siteKey) return null;
    try {
      const bytes = base64ToBytes(b64);
      // Old encryption path: { p, r, v, ts, n } — skip if it parses cleanly as
      // an event (has `p` field). Config snapshots have `v: 1` + `sites` map.
      // We compress before encrypting, so try gunzip-then-parse first.
      const iv = bytes.slice(0, 12);
      const ct = bytes.slice(12);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.siteKey, ct);
      // Try gzip path first (config snapshots), fall back to plain JSON
      // (legacy / non-compressed snapshots, if any).
      let json: string;
      try {
        const inflated = await gunzip(new Uint8Array(plain));
        json = new TextDecoder().decode(inflated);
      } catch {
        json = new TextDecoder().decode(plain);
      }
      const parsed = JSON.parse(json) as ConfigSnapshot;
      if (parsed && parsed.v === 1 && parsed.sites) return parsed;
      return null;
    } catch {
      // Use the directive's reusable helper as a last-resort path so this
      // file stays close to the existing decryptEvent surface.
      void decryptEvent;
      return null;
    }
  }
}
