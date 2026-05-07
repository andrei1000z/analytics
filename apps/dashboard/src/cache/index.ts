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
  Range,
  SiteSnapshot,
} from "./types";
import { RANGE_HOURS } from "./types";

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
};

type WindowAggregate = {
  pageviews: number;
  sessions: number;
  bouncedSessions: number;
  totalDurationMs: number;
  durationSamples: number;
  byPath: Map<string, number>;
  byReferrer: Map<string, number>;
  byDevice: { desktop: number; mobile: number; tablet: number };
  hourly: Map<number, { sessions: Set<string>; pageviews: number }>;
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
    hourly: new Map(),
  };
}

function aggregate(slice: DecryptedEvent[]): WindowAggregate {
  const w = emptyWindow();
  if (slice.length === 0) return w;
  const sessions = new Map<string, SessionStats>();

  for (const ev of slice) {
    w.pageviews += 1;

    const path = typeof ev.p === "string" ? ev.p : "/";
    w.byPath.set(path, (w.byPath.get(path) ?? 0) + 1);

    if (typeof ev.r === "string" && ev.r.length > 0) {
      w.byReferrer.set(ev.r, (w.byReferrer.get(ev.r) ?? 0) + 1);
    }

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
      s = { count: 0, firstTs: ev.ts, lastTs: ev.ts };
      sessions.set(nonce, s);
    }
    s.count += 1;
    if (ev.ts < s.firstTs) s.firstTs = ev.ts;
    if (ev.ts > s.lastTs) s.lastTs = ev.ts;
  }

  w.sessions = sessions.size;
  for (const s of sessions.values()) {
    if (s.count <= 1) {
      w.bouncedSessions += 1;
    } else {
      w.totalDurationMs += s.lastTs - s.firstTs;
      w.durationSamples += 1;
    }
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

  const liveSessions = new Set<string>();
  const liveStart = now - LIVE_WINDOW_MS;
  // Walk back from the end since recent events cluster there.
  for (let i = all.length - 1; i >= 0; i--) {
    const ev = all[i];
    if (!ev || ev.ts < liveStart) break;
    if (typeof ev.n === "string") liveSessions.add(ev.n);
  }

  return {
    range,
    totalEvents: total,
    visitors: visitorsDelta,
    pageviews: pageviewsDelta,
    bounce: delta(bounceCur, bouncePrev),
    avgDurationSec: delta(durCurMs / 1000, durPrevMs / 1000),
    series,
    topPages,
    topReferrers,
    devices,
    liveVisitors: liveSessions.size,
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
