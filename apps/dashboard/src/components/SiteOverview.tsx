import { useMemo } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ExternalLink,
  Eye,
  Globe,
  MousePointer2,
  Timer,
  Users,
} from "lucide-react";
import type { Site } from "@/store/useStore";
import { useStore } from "@/store/useStore";
import { useSiteData } from "@/hooks/useSiteData";
import { RangeSelector } from "./widgets/RangeSelector";
import { KpiCard } from "./widgets/KpiCard";
import { AreaChart } from "./widgets/AreaChart";
import { TopList } from "./widgets/TopList";
import { DeviceBreakdown } from "./widgets/DeviceBreakdown";
import { RegionBreakdown } from "./widgets/RegionBreakdown";
import { compact } from "@/lib/format";

const SECTION_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function SiteOverview({ site }: { site: Site }): ReactNode {
  const range = useStore((s) => s.range);
  const setRange = useStore((s) => s.setRange);
  const snap = useSiteData(site.id, range);

  const sparkSeries = useMemo(() => snap?.series ?? [], [snap?.series]);

  if (!snap) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SECTION_SPRING}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-500" />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ping"
              />
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {compact(snap.liveVisitors)} live
            </span>
          </div>
          <a
            href={`https://${site.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-eu-blue dark:hover:text-eu-blue-light"
          >
            {site.domain}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Vizitatori unici"
          icon={Users}
          delta={snap.visitors}
          format={(n) => compact(Math.round(n))}
          series={sparkSeries}
          goodWhen="up"
        />
        <KpiCard
          label="Pagini vizualizate"
          icon={Eye}
          delta={snap.pageviews}
          format={(n) => compact(Math.round(n))}
          series={sparkSeries}
          goodWhen="up"
        />
        <KpiCard
          label="Bounce rate"
          icon={MousePointer2}
          delta={snap.bounce}
          format={(n) => `${(n * 100).toFixed(1)}%`}
          goodWhen="down"
        />
        <KpiCard
          label="Durată medie"
          icon={Timer}
          delta={snap.avgDurationSec}
          format={formatDuration}
          goodWhen="up"
        />
      </div>

      <div className="glass-card rounded-3xl p-5 text-eu-blue dark:text-eu-blue-light">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Trafic
            </h3>
            <p className="mt-1 text-base font-semibold tracking-tight text-text-main">
              Vizitatori per oră · {compact(snap.visitors.current)} total
            </p>
          </div>
          <Activity className="h-4 w-4 text-text-faint" aria-hidden />
        </div>
        <div className="mt-3">
          <AreaChart series={snap.series} range={snap.range} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TopList
          title="Top pagini"
          icon={MousePointer2}
          items={snap.topPages}
          labelOf={(p) => (
            <span className="font-mono text-[13px] tracking-tight text-text-main">{p.path}</span>
          )}
        />
        <TopList
          title="Top referreri"
          icon={Globe}
          items={snap.topReferrers}
          labelOf={(r) => <span className="truncate">{r.host}</span>}
        />
        <RegionBreakdown regions={snap.regions} />
      </div>

      <DeviceBreakdown devices={snap.devices} />
    </motion.div>
  );
}
