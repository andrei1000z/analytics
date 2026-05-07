import type { ReactNode } from "react";
import { Compass, ExternalLink, MousePointerClick, Search, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReferrerCategory } from "@/cache/types";
import { compact } from "@/lib/format";

const META: Record<
  ReferrerCategory,
  { label: string; icon: LucideIcon; barClass: string; tone: string }
> = {
  direct: {
    label: "Direct",
    icon: MousePointerClick,
    barClass: "bg-eu-blue dark:bg-eu-blue-light",
    tone: "text-eu-blue dark:text-eu-blue-light",
  },
  search: {
    label: "Căutare",
    icon: Search,
    barClass: "bg-emerald-500",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  social: {
    label: "Social",
    icon: Share2,
    barClass: "bg-eu-yellow-deep dark:bg-eu-yellow",
    tone: "text-eu-yellow-deep dark:text-eu-yellow",
  },
  referral: {
    label: "Alt site",
    icon: ExternalLink,
    barClass: "bg-violet-500",
    tone: "text-violet-600 dark:text-violet-400",
  },
};

export function ReferrerBreakdown({
  categories,
}: {
  categories: ReadonlyArray<{ category: ReferrerCategory; views: number }>;
}): ReactNode {
  const total = categories.reduce((acc, c) => acc + c.views, 0) || 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Compass className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Sursa traficului
        </h3>
      </div>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full border border-line bg-soft-gray">
        {categories.map((c) => {
          const pct = (c.views / total) * 100;
          const meta = META[c.category];
          return (
            <span
              key={c.category}
              className={meta.barClass}
              style={{ width: `${pct}%` }}
              title={`${meta.label}: ${pct.toFixed(1)}%`}
              aria-hidden
            />
          );
        })}
      </div>
      <ul className="mt-4 space-y-1.5">
        {categories.map((c) => {
          const meta = META[c.category];
          const pct = (c.views / total) * 100;
          return (
            <li key={c.category} className="flex items-center gap-3 text-sm">
              <meta.icon className={`h-3.5 w-3.5 flex-none ${meta.tone}`} aria-hidden />
              <span className="flex-1 text-text-main">{meta.label}</span>
              <span className="font-mono text-xs text-text-muted">{compact(c.views)}</span>
              <span className="w-12 text-right font-mono text-xs text-text-faint">
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
