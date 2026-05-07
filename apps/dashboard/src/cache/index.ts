import { generateAggregates } from "./mock";
import type { Bucket, Delta, Range, SiteAggregates, SiteSnapshot } from "./types";
import { RANGE_HOURS } from "./types";

const cache = new Map<string, SiteAggregates>();

export function ensureSeeded(siteId: string): SiteAggregates {
  let agg = cache.get(siteId);
  if (!agg) {
    agg = generateAggregates(siteId);
    cache.set(siteId, agg);
  }
  return agg;
}

export function clearCache(siteId?: string): void {
  if (siteId) cache.delete(siteId);
  else cache.clear();
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

function aggregateBuckets(buckets: Bucket[]): { visitors: number; pageviews: number } {
  let visitors = 0;
  let pageviews = 0;
  for (const b of buckets) {
    visitors += b.visitors;
    pageviews += b.pageviews;
  }
  return { visitors, pageviews };
}

export function snapshot(siteId: string, range: Range): SiteSnapshot {
  const agg = ensureSeeded(siteId);
  const window = RANGE_HOURS[range];
  const total = agg.buckets.length;
  const currentBuckets = agg.buckets.slice(total - window);
  const previousBuckets =
    total >= window * 2 ? agg.buckets.slice(total - window * 2, total - window) : [];

  const cur = aggregateBuckets(currentBuckets);
  const prev = aggregateBuckets(previousBuckets);

  // Bounce + duration are not modeled in mock; derive plausible values from visitors/pageviews.
  const curBounce = cur.visitors > 0 ? Math.min(0.85, 0.42 + (cur.pageviews / cur.visitors - 2) * -0.04) : 0;
  const prevBounce = prev.visitors > 0 ? Math.min(0.85, 0.42 + (prev.pageviews / prev.visitors - 2) * -0.04) : 0;
  const curDuration = cur.visitors > 0 ? 90 + (cur.pageviews / cur.visitors) * 30 : 0;
  const prevDuration = prev.visitors > 0 ? 90 + (prev.pageviews / prev.visitors) * 30 : 0;

  const seriesPoints = range === "24h" ? 24 : range === "7d" ? 84 : range === "30d" ? 120 : 180;
  const series = downsample(currentBuckets, seriesPoints);

  // Live visitors: take a noisy fraction of the most recent hour's visitors.
  const last = currentBuckets[currentBuckets.length - 1];
  const liveVisitors = last ? Math.max(0, Math.round((last.visitors * (0.05 + Math.random() * 0.08)))) : 0;

  return {
    range,
    visitors: delta(cur.visitors, prev.visitors),
    pageviews: delta(cur.pageviews, prev.pageviews),
    bounce: delta(curBounce, prevBounce),
    avgDurationSec: delta(curDuration, prevDuration),
    series,
    topPages: agg.topPages.slice(0, 6),
    topReferrers: agg.topReferrers.slice(0, 6),
    devices: agg.devices,
    regions: agg.regions.slice(0, 6),
    liveVisitors,
  };
}

export type { Bucket, Delta, Range, SiteSnapshot } from "./types";
