import { supabaseAdmin, type PageViewRow } from "./supabase";

export type RangeKey = "today" | "7d" | "30d";

export type RangeMeta = {
  key: RangeKey;
  label: string;
  shortLabel: string;
  days: number;
  bucket: "hour" | "day";
  buckets: number;
};

export const RANGES: Record<RangeKey, RangeMeta> = {
  today: {
    key: "today",
    label: "Astăzi",
    shortLabel: "Azi",
    days: 1,
    bucket: "hour",
    buckets: 24,
  },
  "7d": {
    key: "7d",
    label: "Ultimele 7 zile",
    shortLabel: "7 zile",
    days: 7,
    bucket: "day",
    buckets: 7,
  },
  "30d": {
    key: "30d",
    label: "Ultimele 30 zile",
    shortLabel: "30 zile",
    days: 30,
    bucket: "day",
    buckets: 30,
  },
};

export function parseRange(value: string | undefined): RangeKey {
  if (value === "today" || value === "7d" || value === "30d") return value;
  return "7d";
}

export type TrafficPoint = { day: string; views: number };
export type TopPage = { path: string; title: string; views: number; share: number };
export type DeviceSlice = { label: string; visitors: number };
export type DomainSlice = { domain: string; views: number; share: number };

export type DashboardData = {
  available: boolean;
  range: RangeMeta;
  newToday: number;
  totalViews: number;
  totalViewsDelta: number | null;
  mobileViews: number;
  desktopViews: number;
  mobileShare: number;
  desktopShare: number;
  topReferrer: string;
  topReferrerShare: number;
  traffic: TrafficPoint[];
  topPages: TopPage[];
  domains: DomainSlice[];
  devices: DeviceSlice[];
  liveTotal: number;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const RO_DAYS = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function emptyTraffic(meta: RangeMeta): TrafficPoint[] {
  const now = new Date();
  return Array.from({ length: meta.buckets }).map((_, i) => {
    const offset = meta.buckets - 1 - i;
    if (meta.bucket === "hour") {
      const d = new Date(now.getTime() - offset * HOUR_MS);
      return { day: `${String(d.getUTCHours()).padStart(2, "0")}:00`, views: 0 };
    }
    const d = new Date(now.getTime() - offset * DAY_MS);
    if (meta.days > 7) {
      return {
        day: `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        views: 0,
      };
    }
    return { day: RO_DAYS[d.getUTCDay()], views: 0 };
  });
}

function fallback(meta: RangeMeta): DashboardData {
  return {
    available: false,
    range: meta,
    newToday: 0,
    totalViews: 0,
    totalViewsDelta: null,
    mobileViews: 0,
    desktopViews: 0,
    mobileShare: 0,
    desktopShare: 0,
    topReferrer: "—",
    topReferrerShare: 0,
    traffic: emptyTraffic(meta),
    topPages: [],
    domains: [],
    devices: [],
    liveTotal: 0,
  };
}

function pathFromUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return u.pathname || "/";
  } catch {
    return raw;
  }
}

function titleFromPath(path: string): string {
  if (path === "/" || path === "") return "Pagina principală";
  return path
    .split("/")
    .filter(Boolean)
    .pop()!
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function hostFromReferrer(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

export async function getDashboardData(
  rangeKey: RangeKey = "7d"
): Promise<DashboardData> {
  const meta = RANGES[rangeKey];
  const now = new Date();
  const startCurrent = new Date(now.getTime() - meta.days * DAY_MS);
  const startPrev = new Date(now.getTime() - 2 * meta.days * DAY_MS);
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startLive = new Date(now.getTime() - 5 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from("page_views")
    .select("id, url, referrer, device_type, timestamp")
    .gte("timestamp", startPrev.toISOString())
    .order("timestamp", { ascending: false })
    .limit(50000);

  if (error || !data) {
    if (error) console.warn("[dashboard] supabase error:", error.message);
    return fallback(meta);
  }

  const rows = data as PageViewRow[];

  const current: PageViewRow[] = [];
  const prev: PageViewRow[] = [];
  const today: PageViewRow[] = [];
  const live: PageViewRow[] = [];

  for (const r of rows) {
    const t = new Date(r.timestamp);
    if (t >= startCurrent) current.push(r);
    else if (t >= startPrev) prev.push(r);
    if (t >= startToday) today.push(r);
    if (t >= startLive) live.push(r);
  }

  const trafficBuckets = new Map<string, number>();
  for (let i = meta.buckets - 1; i >= 0; i--) {
    if (meta.bucket === "hour") {
      const d = new Date(now.getTime() - i * HOUR_MS);
      trafficBuckets.set(d.toISOString().slice(0, 13), 0);
    } else {
      const d = new Date(now.getTime() - i * DAY_MS);
      trafficBuckets.set(d.toISOString().slice(0, 10), 0);
    }
  }
  for (const r of current) {
    const key =
      meta.bucket === "hour" ? r.timestamp.slice(0, 13) : r.timestamp.slice(0, 10);
    if (trafficBuckets.has(key)) {
      trafficBuckets.set(key, trafficBuckets.get(key)! + 1);
    }
  }
  const traffic: TrafficPoint[] = Array.from(trafficBuckets.entries()).map(
    ([key, views]) => {
      if (meta.bucket === "hour") {
        const d = new Date(key + ":00:00Z");
        return {
          day: `${String(d.getUTCHours()).padStart(2, "0")}:00`,
          views,
        };
      }
      const d = new Date(key + "T00:00:00Z");
      if (meta.days > 7) {
        return {
          day: `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
          views,
        };
      }
      return { day: RO_DAYS[d.getUTCDay()], views };
    }
  );

  const totalForShare = current.length || 1;

  const pageCounts = new Map<string, number>();
  for (const r of current) {
    const path = pathFromUrl(r.url);
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
  }
  const topPages: TopPage[] = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, views]) => ({
      path,
      title: titleFromPath(path),
      views,
      share: Math.round((views / totalForShare) * 100),
    }));

  const refCounts = new Map<string, number>();
  let directCount = 0;
  for (const r of current) {
    const host = hostFromReferrer(r.referrer);
    if (!host) {
      directCount++;
      continue;
    }
    refCounts.set(host, (refCounts.get(host) ?? 0) + 1);
  }
  const sortedRefs = [...refCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topReferrer =
    sortedRefs[0]?.[0] ?? (directCount > 0 ? "Direct" : "—");
  const topReferrerShare = sortedRefs[0]
    ? Math.round((sortedRefs[0][1] / totalForShare) * 100)
    : 0;

  const domainsAll: DomainSlice[] = [];
  if (directCount > 0) {
    domainsAll.push({
      domain: "Direct / fără referrer",
      views: directCount,
      share: Math.round((directCount / totalForShare) * 100),
    });
  }
  for (const [domain, views] of sortedRefs) {
    domainsAll.push({
      domain,
      views,
      share: Math.round((views / totalForShare) * 100),
    });
  }
  domainsAll.sort((a, b) => b.views - a.views);
  const domains = domainsAll.slice(0, 6);

  let mobileViews = 0;
  let desktopViews = 0;
  for (const r of current) {
    const d = (r.device_type ?? "").toLowerCase();
    if (d === "mobile" || d === "phone") mobileViews++;
    else if (d === "desktop" || d === "laptop") desktopViews++;
  }
  const knownDevices = mobileViews + desktopViews;
  const mobileShare =
    knownDevices === 0 ? 0 : Math.round((mobileViews / knownDevices) * 100);
  const desktopShare = knownDevices === 0 ? 0 : 100 - mobileShare;

  const deviceCounts = new Map<string, number>();
  for (const r of current) {
    const d = (r.device_type ?? "necunoscut").toLowerCase();
    deviceCounts.set(d, (deviceCounts.get(d) ?? 0) + 1);
  }
  const devices: DeviceSlice[] = [...deviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, visitors]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      visitors,
    }));

  return {
    available: true,
    range: meta,
    newToday: today.length,
    totalViews: current.length,
    totalViewsDelta: pct(current.length, prev.length),
    mobileViews,
    desktopViews,
    mobileShare,
    desktopShare,
    topReferrer,
    topReferrerShare,
    traffic,
    topPages,
    domains,
    devices,
    liveTotal: live.length,
  };
}
