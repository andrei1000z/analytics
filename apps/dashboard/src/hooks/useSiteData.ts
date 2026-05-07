import { useEffect, useRef, useState } from "react";
import { snapshot } from "@/cache";
import type { Range, SiteSnapshot } from "@/cache/types";

const LIVE_TICK_MS = 4500;

/**
 * Returns a snapshot for the given site + range. Re-pulls live visitors on a
 * setTimeout chain so the live KPI drifts plausibly. The wider snapshot is
 * recomputed only when site/range change, since the underlying mock cache
 * is deterministic.
 */
export function useSiteData(siteId: string | null, range: Range): SiteSnapshot | null {
  const [snap, setSnap] = useState<SiteSnapshot | null>(() =>
    siteId ? snapshot(siteId, range) : null,
  );
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!siteId) {
      setSnap(null);
      return;
    }
    setSnap(snapshot(siteId, range));
    return;
  }, [siteId, range]);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    const schedule = (): void => {
      tickRef.current = window.setTimeout(() => {
        if (cancelled) return;
        const next = snapshot(siteId, range);
        setSnap((prev) => (prev ? { ...prev, liveVisitors: next.liveVisitors } : next));
        schedule();
      }, LIVE_TICK_MS);
    };
    schedule();
    return () => {
      cancelled = true;
      if (tickRef.current !== null) window.clearTimeout(tickRef.current);
    };
  }, [siteId, range]);

  return snap;
}
