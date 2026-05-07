import { base64ToBytes, decryptEvent } from "./crypto";
import type { SyncStatus } from "@/store/useStore";

export type SyncEvent = {
  /** Bucket timestamp from server (ms). For live, equals receive time. */
  ts: number;
  payload: unknown;
};

type SubscribeMsg = { type: "subscribe"; from: number; to: number };
type PingMsg = { type: "ping" };
type SliceMsg = { type: "slice"; buckets: Array<{ t: number; ciphertext: string }> };
type LiveMsg = { type: "live"; ciphertext: string };
type PongMsg = { type: "pong" };
type IncomingMsg = SliceMsg | LiveMsg | PongMsg;

export type SyncOptions = {
  url: string;
  roomId: string;
  siteKey: CryptoKey;
  onEvent: (event: SyncEvent) => void;
  onStatus: (status: SyncStatus, detail?: string) => void;
  /** Initial subscribe window (ms), defaults to 30 days. */
  windowMs?: number | undefined;
};

const HEARTBEAT_MS = 25_000;
const BACKOFF_MIN = 1_000;
const BACKOFF_MAX = 30_000;
const DEFAULT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export class SyncClient {
  private readonly opts: SyncOptions;
  private readonly url: string;
  private ws: WebSocket | null = null;
  private backoff = BACKOFF_MIN;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private closed = false;

  constructor(opts: SyncOptions) {
    this.opts = opts;
    const u = new URL(opts.url);
    if (u.protocol === "http:") u.protocol = "ws:";
    if (u.protocol === "https:") u.protocol = "wss:";
    u.pathname = u.pathname.replace(/\/+$/, "") + "/sync";
    u.searchParams.set("room", opts.roomId);
    this.url = u.toString();
  }

  start(): void {
    this.closed = false;
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
      ws = new WebSocket(this.url);
    } catch (e) {
      this.scheduleReconnect(String(e));
      return;
    }
    this.ws = ws;

    ws.onopen = (): void => {
      this.backoff = BACKOFF_MIN;
      this.opts.onStatus("connected");
      const now = Date.now();
      const window = this.opts.windowMs ?? DEFAULT_WINDOW_MS;
      this.send({ type: "subscribe", from: now - window, to: now } satisfies SubscribeMsg);
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
      if (this.closed) return;
      this.scheduleReconnect("closed");
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
      this.send({ type: "ping" } satisfies PingMsg);
      this.scheduleHeartbeat();
    }, HEARTBEAT_MS);
  }

  private send(msg: unknown): void {
    const ws = this.ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private async handleMessage(raw: unknown): Promise<void> {
    if (typeof raw !== "string") return;
    let msg: IncomingMsg;
    try {
      msg = JSON.parse(raw) as IncomingMsg;
    } catch {
      return;
    }
    if (msg.type === "slice") {
      for (const b of msg.buckets) {
        const payload = await this.tryDecrypt(b.ciphertext);
        if (payload !== null) this.opts.onEvent({ ts: b.t, payload });
      }
    } else if (msg.type === "live") {
      const payload = await this.tryDecrypt(msg.ciphertext);
      if (payload !== null) this.opts.onEvent({ ts: Date.now(), payload });
    }
  }

  private async tryDecrypt(b64: string): Promise<unknown | null> {
    try {
      const bytes = base64ToBytes(b64);
      return await decryptEvent(this.opts.siteKey, bytes);
    } catch {
      return null;
    }
  }
}
