export type Range = "24h" | "7d" | "30d" | "90d";

export const RANGE_HOURS: Record<Range, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  "90d": 24 * 90,
};

export type Bucket = {
  /** Hour-aligned ms timestamp. */
  ts: number;
  visitors: number;
  pageviews: number;
};

export type DeviceKind = "desktop" | "mobile" | "tablet";

export type SiteAggregates = {
  /** Always 90 * 24 hourly buckets, ending at the most recent hour boundary. */
  buckets: Bucket[];
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ host: string; views: number }>;
  devices: Array<{ kind: DeviceKind; views: number }>;
  regions: Array<{ code: string; name: string; views: number }>;
};

export type Delta = {
  current: number;
  previous: number;
  /** Ratio change vs. previous window. `null` if previous window is 0. */
  ratio: number | null;
};

export type SiteSnapshot = {
  range: Range;
  visitors: Delta;
  pageviews: Delta;
  bounce: Delta;
  avgDurationSec: Delta;
  /** Down-sampled to ≤180 points for chart smoothness. */
  series: Bucket[];
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ host: string; views: number }>;
  devices: Array<{ kind: DeviceKind; views: number }>;
  regions: Array<{ code: string; name: string; views: number }>;
  liveVisitors: number;
};
