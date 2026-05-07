import type { Bucket, DeviceKind, SiteAggregates } from "./types";

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAGE_CATALOG: ReadonlyArray<string> = [
  "/",
  "/blog",
  "/pricing",
  "/docs",
  "/docs/getting-started",
  "/docs/api",
  "/changelog",
  "/about",
  "/privacy",
  "/contact",
  "/blog/launch",
  "/blog/privacy-by-design",
  "/blog/eu-sovereignty",
];

const REFERRER_CATALOG: ReadonlyArray<string> = [
  "google.com",
  "duckduckgo.com",
  "news.ycombinator.com",
  "lobste.rs",
  "x.com",
  "mastodon.social",
  "reddit.com",
  "github.com",
  "lemmy.world",
];

const REGION_CATALOG: ReadonlyArray<{ code: string; name: string }> = [
  { code: "RO", name: "România" },
  { code: "DE", name: "Germania" },
  { code: "FR", name: "Franța" },
  { code: "NL", name: "Țările de Jos" },
  { code: "ES", name: "Spania" },
  { code: "IT", name: "Italia" },
  { code: "PL", name: "Polonia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgia" },
  { code: "SE", name: "Suedia" },
  { code: "FI", name: "Finlanda" },
  { code: "PT", name: "Portugalia" },
];

const HOUR = 60 * 60 * 1000;
const DAYS = 90;
const HOURS = DAYS * 24;

function hourBoundary(ms: number): number {
  return Math.floor(ms / HOUR) * HOUR;
}

/** Deterministically generates 90 days of hourly buckets ending at the current hour boundary. */
export function generateAggregates(siteId: string, now: number = Date.now()): SiteAggregates {
  const seed = hashString(siteId);
  const rand = mulberry32(seed);
  const baseline = 50 + Math.floor(rand() * 600);
  const trend = (rand() - 0.5) * 0.6;
  const noise = 0.18 + rand() * 0.18;

  const endHour = hourBoundary(now);
  const buckets: Bucket[] = new Array(HOURS);

  for (let i = 0; i < HOURS; i++) {
    const ts = endHour - (HOURS - 1 - i) * HOUR;
    const date = new Date(ts);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    const dayCurve = 0.42 + 0.58 * Math.sin(((hour - 4) * Math.PI) / 12);
    const weekCurve = dayOfWeek === 0 || dayOfWeek === 6 ? 0.65 : 1;
    const trendCurve = 1 + (trend * i) / HOURS;
    const jitter = 1 + (rand() - 0.5) * noise;

    const visitors = Math.max(0, Math.round(baseline * dayCurve * weekCurve * trendCurve * jitter));
    const pvPerVisitor = 1.4 + rand() * 1.6;
    const pageviews = Math.max(visitors, Math.round(visitors * pvPerVisitor));
    buckets[i] = { ts, visitors, pageviews };
  }

  const total = buckets.reduce((acc, b) => acc + b.pageviews, 0);

  const pickFraction = (i: number, count: number): number => {
    return Math.pow(0.62, i) * (1 + (rand() - 0.5) * 0.2) /
      (1 - Math.pow(0.62, count));
  };

  const pickedPages: Array<{ path: string; views: number }> = [];
  const shuffledPages = [...PAGE_CATALOG].sort(() => rand() - 0.5).slice(0, 8);
  let allocatedPages = 0;
  for (let i = 0; i < shuffledPages.length; i++) {
    const path = shuffledPages[i];
    if (!path) continue;
    const f = pickFraction(i, shuffledPages.length);
    const views = Math.round(total * f);
    pickedPages.push({ path, views });
    allocatedPages += views;
  }
  pickedPages.sort((a, b) => b.views - a.views);
  if (pickedPages[0]) pickedPages[0].views += Math.max(0, total - allocatedPages);

  const pickedReferrers: Array<{ host: string; views: number }> = [];
  const shuffledRefs = [...REFERRER_CATALOG].sort(() => rand() - 0.5).slice(0, 6);
  for (let i = 0; i < shuffledRefs.length; i++) {
    const host = shuffledRefs[i];
    if (!host) continue;
    const f = pickFraction(i, shuffledRefs.length) * 0.7;
    pickedReferrers.push({ host, views: Math.round(total * f) });
  }
  pickedReferrers.sort((a, b) => b.views - a.views);

  const desktopViews = Math.round(total * (0.46 + rand() * 0.14));
  const mobileViews = Math.round(total * (0.34 + rand() * 0.14));
  const tabletViews = Math.max(0, total - desktopViews - mobileViews);
  const devicesSorted: Array<{ kind: DeviceKind; views: number }> = [
    { kind: "desktop", views: desktopViews },
    { kind: "mobile", views: mobileViews },
    { kind: "tablet", views: tabletViews },
  ];

  const pickedRegions: Array<{ code: string; name: string; views: number }> = [];
  const shuffledRegions = [...REGION_CATALOG].sort(() => rand() - 0.5).slice(0, 9);
  for (let i = 0; i < shuffledRegions.length; i++) {
    const reg = shuffledRegions[i];
    if (!reg) continue;
    const f = pickFraction(i, shuffledRegions.length);
    pickedRegions.push({ code: reg.code, name: reg.name, views: Math.round(total * f) });
  }
  pickedRegions.sort((a, b) => b.views - a.views);

  return {
    buckets,
    topPages: pickedPages,
    topReferrers: pickedReferrers,
    devices: devicesSorted,
    regions: pickedRegions,
  };
}
