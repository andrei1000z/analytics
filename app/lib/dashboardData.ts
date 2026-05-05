import { supabaseAdmin, type PageViewRow } from "./supabase";

export type TrafficPoint = { day: string; views: number };
export type TopPage = { path: string; title: string; views: number; share: number };
export type DeviceSlice = { label: string; visitors: number };

export type DashboardData = {
  available: boolean;
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
  devices: DeviceSlice[];
  liveTotal: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RO_DAYS = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function emptyTraffic(): TrafficPoint[] {
  const now = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getTime() - (6 - i) * DAY_MS);
    return { day: RO_DAYS[d.getUTCDay()], views: 0 };
  });
}

function fallback(): DashboardData {
  return {
    available: false,
    newToday: 0,
    totalViews: 0,
    totalViewsDelta: null,
    mobileViews: 0,
    desktopViews: 0,
    mobileShare: 0,
    desktopShare: 0,
    topReferrer: "—",
    topReferrerShare: 0,
    traffic: emptyTraffic(),
    topPages: [],
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

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const start7 = new Date(now.getTime() - 7 * DAY_MS);
  const start14 = new Date(now.getTime() - 14 * DAY_MS);
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startLive = new Date(now.getTime() - 5 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from("page_views")
    .select("id, url, referrer, device_type, timestamp")
    .gte("timestamp", start14.toISOString())
    .order("timestamp", { ascending: false })
    .limit(50000);

  if (error || !data) {
    if (error) console.warn("[dashboard] supabase error:", error.message);
    return fallback();
  }

  const rows = data as PageViewRow[];

  const last7: PageViewRow[] = [];
  const prev7: PageViewRow[] = [];
  const today: PageViewRow[] = [];
  const live: PageViewRow[] = [];

  for (const r of rows) {
    const t = new Date(r.timestamp);
    if (t >= start7) last7.push(r);
    else if (t >= start14) prev7.push(r);
    if (t >= startToday) today.push(r);
    if (t >= startLive) live.push(r);
  }

  const trafficBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    trafficBuckets.set(key, 0);
  }
  for (const r of last7) {
    const key = r.timestamp.slice(0, 10);
    if (trafficBuckets.has(key)) {
      trafficBuckets.set(key, trafficBuckets.get(key)! + 1);
    }
  }
  const traffic: TrafficPoint[] = Array.from(trafficBuckets.entries()).map(
    ([key, views]) => ({
      day: RO_DAYS[new Date(key + "T00:00:00Z").getUTCDay()],
      views,
    })
  );

  const pageCounts = new Map<string, number>();
  for (const r of last7) {
    const path = pathFromUrl(r.url);
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
  }
  const sortedPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]);
  const totalForShare = last7.length || 1;
  const topPages: TopPage[] = sortedPages.slice(0, 5).map(([path, views]) => ({
    path,
    title: titleFromPath(path),
    views,
    share: Math.round((views / totalForShare) * 100),
  }));

  const refCounts = new Map<string, number>();
  for (const r of last7) {
    const host = hostFromReferrer(r.referrer);
    if (!host) continue;
    refCounts.set(host, (refCounts.get(host) ?? 0) + 1);
  }
  const sortedRefs = [...refCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topReferrer = sortedRefs[0]?.[0] ?? "Direct";
  const topReferrerShare = sortedRefs[0]
    ? Math.round((sortedRefs[0][1] / totalForShare) * 100)
    : 0;

  let mobileViews = 0;
  let desktopViews = 0;
  for (const r of last7) {
    const d = (r.device_type ?? "").toLowerCase();
    if (d === "mobile" || d === "phone") mobileViews++;
    else if (d === "desktop" || d === "laptop") desktopViews++;
  }
  const knownDevices = mobileViews + desktopViews || 1;
  const mobileShare = Math.round((mobileViews / knownDevices) * 100);
  const desktopShare = 100 - mobileShare;

  const deviceCounts = new Map<string, number>();
  for (const r of last7) {
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
    newToday: today.length,
    totalViews: last7.length,
    totalViewsDelta: pct(last7.length, prev7.length),
    mobileViews,
    desktopViews,
    mobileShare: mobileViews + desktopViews === 0 ? 0 : mobileShare,
    desktopShare: mobileViews + desktopViews === 0 ? 0 : desktopShare,
    topReferrer,
    topReferrerShare,
    traffic,
    topPages,
    devices,
    liveTotal: live.length,
  };
}
