import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Bucket, Delta } from "@/cache/types";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  icon: Icon,
  delta,
  format,
  series,
  goodWhen = "up",
}: {
  label: string;
  icon?: LucideIcon | undefined;
  delta: Delta;
  format: (n: number) => string;
  series?: ReadonlyArray<Bucket> | undefined;
  goodWhen?: "up" | "down";
}): ReactNode {
  const ratio = delta.ratio;
  const directionUp = ratio !== null && ratio >= 0;
  const isGood =
    ratio === null
      ? null
      : goodWhen === "up"
        ? directionUp && ratio !== 0
        : !directionUp && ratio !== 0;
  const tone = isGood === null ? "neutral" : isGood ? "good" : "bad";

  return (
    <div className="glass-card relative rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          {label}
        </p>
        {Icon ? (
          <Icon className="h-4 w-4 text-text-faint" aria-hidden strokeWidth={2} />
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight">{format(delta.current)}</p>
        {ratio !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              tone === "good"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : tone === "bad"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-soft-gray text-text-faint",
            )}
          >
            {ratio === 0 ? (
              <Minus className="h-3 w-3" aria-hidden />
            ) : directionUp ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3 w-3" aria-hidden />
            )}
            {Math.abs(ratio * 100).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-[11px] text-text-faint">
          față de {periodLabelForDelta(delta)}
        </p>
        {series && series.length > 1 ? <Sparkline series={series} /> : null}
      </div>
    </div>
  );
}

function periodLabelForDelta(delta: Delta): string {
  return delta.previous > 0 ? formatNumber(delta.previous) : "—";
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("ro-RO").format(Math.round(n));
}
