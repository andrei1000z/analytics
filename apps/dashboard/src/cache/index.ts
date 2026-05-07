/**
 * In-memory event cache for the dashboard. Real events ONLY — no mock data
 * synthesis. Events are pushed by `useSync` after WebCrypto decrypts each
 * incoming WS frame; snapshots are computed on demand for the active site +
 * range.
 *
 * Capacity: events are bounded per-site to MAX_EVENTS_PER_SITE so the tab
 * stays responsive even with multi-million-event histories. The oldest
 * events are evicted when the limit is hit.
 */

import type {
  Bucket,
  DecryptedEvent,
  Delta,
  DeviceKind,
  DurationBucket,
  Range,
  ReferrerCategory,
  SiteSnapshot,
} from "./types";
import { RANGE_HOURS } from "./types";
import { tzToCountry } from "@/lib/tzCountry";

const HOUR_MS = 60 * 60 * 1000;
const MAX_EVENTS_PER_SITE = 200_000;
const LIVE_WINDOW_MS = 60_000;

type Listener = () => void;

const events = new Map<string, DecryptedEvent[]>();
const listeners = new Map<string, Set<Listener>>();

function notify(siteId: string): void {
  const subs = listeners.get(siteId);
  if (!subs) return;
  for (const fn of subs) fn();
}

export function subscribe(siteId: string, fn: Listener): () => void {
  let subs = listeners.get(siteId);
  if (!subs) {
    subs = new Set();
    listeners.set(siteId, subs);
  }
  subs.add(fn);
  return () => {
    subs.delete(fn);
    if (subs.size === 0) listeners.delete(siteId);
  };
}

export function recordEvent(siteId: string, event: DecryptedEvent): void {
  let arr = events.get(siteId);
  if (!arr) {
    arr = [];
    events.set(siteId, arr);
  }
  arr.push(event);
  if (arr.length > MAX_EVENTS_PER_SITE) {
    arr.splice(0, arr.length - MAX_EVENTS_PER_SITE);
  }
  notify(siteId);
}

export function recordEvents(siteId: string, batch: DecryptedEvent[]): void {
  if (batch.length === 0) return;
  let arr = events.get(siteId);
  if (!arr) {
    arr = [];
    events.set(siteId, arr);
  }
  for (const ev of batch) arr.push(ev);
  if (arr.length > MAX_EVENTS_PER_SITE) {
    arr.splice(0, arr.length - MAX_EVENTS_PER_SITE);
  }
  notify(siteId);
}

export function clearSite(siteId: string): void {
  events.delete(siteId);
  notify(siteId);
}

export function clearAll(): void {
  const ids = Array.from(events.keys());
  events.clear();
  for (const id of ids) notify(id);
}

export function totalEvents(siteId: string): number {
  return events.get(siteId)?.length ?? 0;
}

function deviceKindFor(viewportWidth: number): DeviceKind {
  if (viewportWidth >= 1024) return "desktop";
  if (viewportWidth >= 600) return "tablet";
  return "mobile";
}

function delta(current: number, previous: number): Delta {
  const ratio = previous > 0 ? (current - previous) / previous : null;
  return { current, previous, ratio };
}

function downsample<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = items.length / maxPoints;
  const out: T[] = new Array(maxPoints);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.floor(i * step);
    out[i] = items[idx] as T;
  }
  return out;
}

type SessionStats = {
  count: number;
  firstTs: number;
  lastTs: number;
  firstPath: string;
  lastPath: string;
};

const SEARCH_HOSTS = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yahoo.",
  "baidu.",
  "yandex.",
  "ecosia.",
  "qwant.",
  "startpage.",
  "kagi.",
  "brave.",
];

const SOCIAL_HOSTS = [
  "twitter.com",
  "x.com",
  "facebook.com",
  "fb.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
  "reddit.com",
  "ycombinator.com",
  "lobste.rs",
  "mastodon.",
  "bsky.app",
  "threads.net",
  "youtube.com",
  "youtu.be",
  "pinterest.com",
  "telegram.",
  "t.me",
  "whatsapp.com",
];

function categorizeReferrer(host: string): ReferrerCategory {
  if (!host) return "direct";
  const h = host.toLowerCase();
  for (const s of SEARCH_HOSTS) if (h.includes(s)) return "search";
  for (const s of SOCIAL_HOSTS) if (h === s || h.endsWith("." + s) || h.includes(s)) return "social";
  return "referral";
}

const DURATION_BUCKET_LABELS: DurationBucket[] = [
  "<10s",
  "10s-30s",
  "30s-1m",
  "1m-3m",
  "3m-10m",
  "10m+",
];

function durationBucketFor(ms: number): DurationBucket {
  const s = ms / 1000;
  if (s < 10) return "<10s";
  if (s < 30) return "10s-30s";
  if (s < 60) return "30s-1m";
  if (s < 180) return "1m-3m";
  if (s < 600) return "3m-10m";
  return "10m+";
}

type WindowAggregate = {
  pageviews: number;
  sessions: number;
  bouncedSessions: number;
  totalDurationMs: number;
  durationSamples: number;
  byPath: Map<string, number>;
  byReferrer: Map<string, number>;
  byDevice: { desktop: number; mobile: number; tablet: number };
  byCategory: { direct: number; search: number; social: number; referral: number };
  byEntryPath: Map<string, number>;
  byExitPath: Map<string, number>;
  byDuration: Map<DurationBucket, number>;
  hourly: Map<number, { sessions: Set<string>; pageviews: number }>;
  /** 7 (Mon..Sun) × 24 (hours) sessions matrix */
  heatmap: number[][];
};

function emptyWindow(): WindowAggregate {
  return {
    pageviews: 0,
    sessions: 0,
    bouncedSessions: 0,
    totalDurationMs: 0,
    durationSamples: 0,
    byPath: new Map(),
    byReferrer: new Map(),
    byDevice: { desktop: 0, mobile: 0, tablet: 0 },
    byCategory: { direct: 0, search: 0, social: 0, referral: 0 },
    byEntryPath: new Map(),
    byExitPath: new Map(),
    byDuration: new Map(),
    hourly: new Map(),
    heatmap: Array.from({ length: 7 }, () => Array(24).fill(0)),
  };
}

function aggregate(slice: DecryptedEvent[]): WindowAggregate {
  const w = emptyWindow();
  if (slice.length === 0) return w;
  const sessions = new Map<string, SessionStats>();
  // Convert "Sunday=0" weekday → "Monday=0" so EU readers see Mon at index 0.
  const dayIndex = (date: Date): number => (date.getDay() + 6) % 7;

  for (const ev of slice) {
    w.pageviews += 1;

    const path = typeof ev.p === "string" ? ev.p : "/";
    w.byPath.set(path, (w.byPath.get(path) ?? 0) + 1);

    const refHost = typeof ev.r === "string" ? ev.r : "";
    if (refHost.length > 0) {
      w.byReferrer.set(refHost, (w.byReferrer.get(refHost) ?? 0) + 1);
    }
    w.byCategory[categorizeReferrer(refHost)] += 1;

    const vw = Array.isArray(ev.v) && typeof ev.v[0] === "number" ? ev.v[0] : 0;
    w.byDevice[deviceKindFor(vw)] += 1;

    const bucket = ev.ts - (ev.ts % HOUR_MS);
    let h = w.hourly.get(bucket);
    if (!h) {
      h = { sessions: new Set(), pageviews: 0 };
      w.hourly.set(bucket, h);
    }
    h.pageviews += 1;
    if (typeof ev.n === "string") h.sessions.add(ev.n);

    const nonce = typeof ev.n === "string" ? ev.n : `_${ev.ts}`;
    let s = sessions.get(nonce);
    if (!s) {
      s = { count: 0, firstTs: ev.ts, lastTs: ev.ts, firstPath: path, lastPath: path };
      sessions.set(nonce, s);
    }
    s.count += 1;
    if (ev.ts < s.firstTs) {
      s.firstTs = ev.ts;
      s.firstPath = path;
    }
    if (ev.ts > s.lastTs) {
      s.lastTs = ev.ts;
      s.lastPath = path;
    }
  }

  w.sessions = sessions.size;
  for (const s of sessions.values()) {
    if (s.count <= 1) {
      w.bouncedSessions += 1;
    } else {
      w.totalDurationMs += s.lastTs - s.firstTs;
      w.durationSamples += 1;
    }
    // Entry / exit paths
    w.byEntryPath.set(s.firstPath, (w.byEntryPath.get(s.firstPath) ?? 0) + 1);
    w.byExitPath.set(s.lastPath, (w.byExitPath.get(s.lastPath) ?? 0) + 1);
    // Duration bucket
    const dur = s.count <= 1 ? 0 : s.lastTs - s.firstTs;
    const db = durationBucketFor(dur);
    w.byDuration.set(db, (w.byDuration.get(db) ?? 0) + 1);
    // Heatmap by session start
    const start = new Date(s.firstTs);
    const di = dayIndex(start);
    const hi = start.getHours();
    if (w.heatmap[di]) w.heatmap[di]![hi] = (w.heatmap[di]![hi] ?? 0) + 1;
  }
  return w;
}

export function snapshot(siteId: string, range: Range): SiteSnapshot {
  const all = events.get(siteId) ?? [];
  const total = all.length;
  const now = Date.now();
  const windowMs = RANGE_HOURS[range] * HOUR_MS;
  const curStart = now - windowMs;
  const prevStart = curStart - windowMs;

  const cur: DecryptedEvent[] = [];
  const prev: DecryptedEvent[] = [];
  for (const ev of all) {
    if (ev.ts >= curStart && ev.ts <= now) cur.push(ev);
    else if (ev.ts >= prevStart && ev.ts < curStart) prev.push(ev);
  }

  const a = aggregate(cur);
  const b = aggregate(prev);

  const visitorsDelta = delta(a.sessions, b.sessions);
  const pageviewsDelta = delta(a.pageviews, b.pageviews);
  const bounceCur = a.sessions > 0 ? a.bouncedSessions / a.sessions : 0;
  const bouncePrev = b.sessions > 0 ? b.bouncedSessions / b.sessions : 0;
  const durCurMs = a.durationSamples > 0 ? a.totalDurationMs / a.durationSamples : 0;
  const durPrevMs = b.durationSamples > 0 ? b.totalDurationMs / b.durationSamples : 0;
  const ppsCur = a.sessions > 0 ? a.pageviews / a.sessions : 0;
  const ppsPrev = b.sessions > 0 ? b.pageviews / b.sessions : 0;

  // Build hourly buckets aligned to whole hours within the range.
  const startHour = curStart - (curStart % HOUR_MS);
  const endHour = now - (now % HOUR_MS);
  const buckets: Bucket[] = [];
  for (let t = startHour; t <= endHour; t += HOUR_MS) {
    const h = a.hourly.get(t);
    buckets.push({
      ts: t,
      visitors: h ? h.sessions.size : 0,
      pageviews: h ? h.pageviews : 0,
    });
  }
  const seriesPoints = range === "24h" ? 24 : range === "7d" ? 84 : range === "30d" ? 120 : 180;
  const series = downsample(buckets, seriesPoints);

  const topPages = Array.from(a.byPath, ([path, views]) => ({ path, views }))
    .sort((x, y) => y.views - x.views)
    .slice(0, 8);
  const topReferrers = Array.from(a.byReferrer, ([host, views]) => ({ host, views }))
    .sort((x, y) => y.views - x.views)
    .slice(0, 8);

  const devices: Array<{ kind: DeviceKind; views: number }> = [
    { kind: "desktop", views: a.byDevice.desktop },
    { kind: "mobile", views: a.byDevice.mobile },
    { kind: "tablet", views: a.byDevice.tablet },
  ];

  const topEntryPages = Array.from(a.byEntryPath, ([path, sessions]) => ({ path, sessions }))
    .sort((x, y) => y.sessions - x.sessions)
    .slice(0, 6);

  const topExitPages = Array.from(a.byExitPath, ([path, sessions]) => ({ path, sessions }))
    .sort((x, y) => y.sessions - x.sessions)
    .slice(0, 6);

  const referrerCategories: Array<{ category: ReferrerCategory; views: number }> = [
    { category: "direct", views: a.byCategory.direct },
    { category: "search", views: a.byCategory.search },
    { category: "social", views: a.byCategory.social },
    { category: "referral", views: a.byCategory.referral },
  ];

  const durationBuckets = DURATION_BUCKET_LABELS.map((bucket) => ({
    bucket,
    sessions: a.byDuration.get(bucket) ?? 0,
  }));

  const dayOfWeek: number[] = Array(7).fill(0);
  const hourOfDay: number[] = Array(24).fill(0);
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = a.heatmap[d]?.[h] ?? 0;
      dayOfWeek[d] = (dayOfWeek[d] ?? 0) + v;
      hourOfDay[h] = (hourOfDay[h] ?? 0) + v;
    }
  }

  // Recent live feed: last 20 events by ts
  const recentEvents: SiteSnapshot["recentEvents"] = [];
  const startSlice = Math.max(0, all.length - 20);
  for (let i = all.length - 1; i >= startSlice; i--) {
    const ev = all[i];
    if (!ev) continue;
    const w0 = Array.isArray(ev.v) && typeof ev.v[0] === "number" ? ev.v[0] : 0;
    const w1 = Array.isArray(ev.v) && typeof ev.v[1] === "number" ? ev.v[1] : 0;
    recentEvents.push({
      path: ev.p,
      referrer: ev.r,
      ts: ev.ts,
      viewport: [w0, w1],
    });
  }

  const liveSessions = new Set<string>();
  const liveStart = now - LIVE_WINDOW_MS;
  // Walk back from the end since recent events cluster there.
  for (let i = all.length - 1; i >= 0; i--) {
    const ev = all[i];
    if (!ev || ev.ts < liveStart) break;
    if (typeof ev.n === "string") liveSessions.add(ev.n);
  }

  // Countries from timezones (current window only).
  const countryMap = new Map<string, { name: string; sessions: number }>();
  const tzSeen = new Map<string, Set<string>>();
  for (const ev of cur) {
    if (typeof ev.tz !== "string" || ev.tz.length === 0) continue;
    if (typeof ev.n !== "string") continue;
    let s = tzSeen.get(ev.tz);
    if (!s) {
      s = new Set();
      tzSeen.set(ev.tz, s);
    }
    s.add(ev.n);
  }
  for (const [tz, sessionSet] of tzSeen) {
    const meta = tzToCountry(tz);
    const entry = countryMap.get(meta.code);
    if (entry) entry.sessions += sessionSet.size;
    else countryMap.set(meta.code, { name: meta.name, sessions: sessionSet.size });
  }
  const countries = Array.from(countryMap, ([code, v]) => ({
    code,
    name: v.name,
    sessions: v.sessions,
  }))
    .sort((x, y) => y.sessions - x.sessions)
    .slice(0, 10);

  // Active per minute over the last 30 minutes
  const activePerMinute: number[] = new Array(30).fill(0);
  const minuteStart = now - 30 * 60 * 1000;
  for (let i = all.length - 1; i >= 0; i--) {
    const ev = all[i];
    if (!ev || ev.ts < minuteStart) break;
    const idx = Math.floor((ev.ts - minuteStart) / 60_000);
    if (idx >= 0 && idx < 30) activePerMinute[idx] = (activePerMinute[idx] ?? 0) + 1;
  }

  // Pages-per-session histogram (current window only)
  const ppsHist = { b1: 0, b2: 0, b35: 0, b610: 0, b11: 0 };
  const sessCounts = new Map<string, number>();
  for (const ev of cur) {
    if (typeof ev.n !== "string") continue;
    sessCounts.set(ev.n, (sessCounts.get(ev.n) ?? 0) + 1);
  }
  for (const c of sessCounts.values()) {
    if (c <= 1) ppsHist.b1 += 1;
    else if (c === 2) ppsHist.b2 += 1;
    else if (c <= 5) ppsHist.b35 += 1;
    else if (c <= 10) ppsHist.b610 += 1;
    else ppsHist.b11 += 1;
  }
  const pagesPerSessionHistogram = [
    { bucket: "1", sessions: ppsHist.b1 },
    { bucket: "2", sessions: ppsHist.b2 },
    { bucket: "3-5", sessions: ppsHist.b35 },
    { bucket: "6-10", sessions: ppsHist.b610 },
    { bucket: "11+", sessions: ppsHist.b11 },
  ];

  // Trending pages: biggest growth ratio current vs previous window
  const trending: Array<{ path: string; current: number; previous: number; ratio: number }> = [];
  for (const [path, currentViews] of a.byPath) {
    const previousViews = b.byPath.get(path) ?? 0;
    const ratio =
      previousViews > 0
        ? (currentViews - previousViews) / previousViews
        : currentViews > 0
          ? Number.POSITIVE_INFINITY
          : 0;
    trending.push({ path, current: currentViews, previous: previousViews, ratio });
  }
  trending.sort((x, y) => {
    const xi = !Number.isFinite(x.ratio);
    const yi = !Number.isFinite(y.ratio);
    if (xi && yi) return y.current - x.current;
    if (xi) return -1;
    if (yi) return 1;
    return y.ratio - x.ratio;
  });
  const trendingPages = trending.filter((p) => p.current > 0).slice(0, 6);

  // Viewport buckets
  const vpMap = new Map<string, number>();
  for (const ev of cur) {
    const w = Array.isArray(ev.v) && typeof ev.v[0] === "number" ? ev.v[0] : 0;
    const label = w === 0 ? "?" : w < 640 ? "<640" : w < 1024 ? "640-1024" : w < 1440 ? "1024-1440" : w < 1920 ? "1440-1920" : "1920+";
    vpMap.set(label, (vpMap.get(label) ?? 0) + 1);
  }
  const viewportBuckets = Array.from(vpMap, ([label, views]) => ({ label, views })).sort(
    (x, y) => y.views - x.views,
  );

  return {
    range,
    totalEvents: total,
    visitors: visitorsDelta,
    pageviews: pageviewsDelta,
    bounce: delta(bounceCur, bouncePrev),
    avgDurationSec: delta(durCurMs / 1000, durPrevMs / 1000),
    pagesPerSession: delta(ppsCur, ppsPrev),
    series,
    topPages,
    topReferrers,
    topEntryPages,
    topExitPages,
    devices,
    referrerCategories,
    durationBuckets,
    hourlyHeatmap: a.heatmap,
    dayOfWeek,
    hourOfDay,
    recentEvents,
    liveVisitors: liveSessions.size,
    countries,
    activePerMinute,
    pagesPerSessionHistogram,
    trendingPages,
    viewportBuckets,
  };
}

export type {
  Bucket,
  DecryptedEvent,
  Delta,
  DeviceKind,
  Range,
  SiteSnapshot,
} from "./types";
