export type Range = "24h" | "7d" | "30d" | "90d";

export const RANGE_HOURS: Record<Range, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  "90d": 24 * 90,
};

export type DeviceKind = "desktop" | "mobile" | "tablet";

/** Decrypted tracker payload — wire-compatible with `packages/tracker/src/index.ts`. */
export type DecryptedEvent = {
  /** Path */
  p: string;
  /** Referrer hostname only */
  r: string;
  /** [viewport_w, viewport_h] */
  v: [number, number];
  /** Tracker-side timestamp (ms) */
  ts: number;
  /** Per-tab session nonce (4 hex bytes) — same for every event from one tab session */
  n: string;
};

export type Bucket = {
  /** Hour-aligned ms timestamp. */
  ts: number;
  visitors: number;
  pageviews: number;
};

export type Delta = {
  current: number;
  previous: number;
  /** Ratio change vs. previous window. `null` if previous window is 0. */
  ratio: number | null;
};

export type SiteSnapshot = {
  range: Range;
  /** Total events ever recorded for this site (used to detect "no data yet"). */
  totalEvents: number;
  visitors: Delta;
  pageviews: Delta;
  bounce: Delta;
  avgDurationSec: Delta;
  /** Down-sampled to ≤180 hourly buckets for chart smoothness. */
  series: Bucket[];
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ host: string; views: number }>;
  devices: Array<{ kind: DeviceKind; views: number }>;
  /** Distinct sessions seen in the last 60 seconds. */
  liveVisitors: number;
};
