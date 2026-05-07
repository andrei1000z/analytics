import type { ReactNode } from "react";
import { Laptop2, Smartphone, Tablet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeviceKind } from "@/cache/types";
import { compact } from "@/lib/format";

const KIND_META: Record<
  DeviceKind,
  { label: string; icon: LucideIcon; barClass: string; tone: string }
> = {
  desktop: {
    label: "Desktop",
    icon: Laptop2,
    barClass: "bg-eu-blue dark:bg-eu-blue-light",
    tone: "text-eu-blue dark:text-eu-blue-light",
  },
  mobile: {
    label: "Mobil",
    icon: Smartphone,
    barClass: "bg-eu-yellow-deep dark:bg-eu-yellow",
    tone: "text-eu-yellow-deep dark:text-eu-yellow",
  },
  tablet: {
    label: "Tabletă",
    icon: Tablet,
    barClass: "bg-emerald-500",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
};

export function DeviceBreakdown({
  devices,
}: {
  devices: ReadonlyArray<{ kind: DeviceKind; views: number }>;
}): ReactNode {
  const total = devices.reduce((acc, d) => acc + d.views, 0) || 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
        Dispozitive
      </h3>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full border border-line bg-soft-gray">
        {devices.map((d) => {
          const meta = KIND_META[d.kind];
          const pct = (d.views / total) * 100;
          return (
            <span
              key={d.kind}
              className={meta.barClass}
              style={{ width: `${pct}%` }}
              title={`${meta.label}: ${(pct).toFixed(1)}%`}
              aria-hidden
            />
          );
        })}
      </div>
      <ul className="mt-4 space-y-1.5">
        {devices.map((d) => {
          const meta = KIND_META[d.kind];
          const pct = (d.views / total) * 100;
          return (
            <li key={d.kind} className="flex items-center gap-3 text-sm">
              <meta.icon className={`h-3.5 w-3.5 flex-none ${meta.tone}`} aria-hidden />
              <span className="flex-1 text-text-main">{meta.label}</span>
              <span className="font-mono text-xs text-text-muted">{compact(d.views)}</span>
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
