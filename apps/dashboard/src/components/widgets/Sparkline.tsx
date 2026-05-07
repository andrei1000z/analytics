import type { ReactNode } from "react";
import type { Bucket } from "@/cache/types";
import { cn } from "@/lib/cn";

const W = 80;
const H = 24;
const PAD = 2;

export function Sparkline({
  series,
  className,
}: {
  series: ReadonlyArray<Bucket>;
  className?: string | undefined;
}): ReactNode {
  if (series.length < 2) {
    return <div className={cn("h-6 w-20", className)} aria-hidden />;
  }

  let max = 0;
  for (const b of series) if (b.visitors > max) max = b.visitors;
  if (max === 0) max = 1;

  const stepX = (W - PAD * 2) / (series.length - 1);
  const path = series
    .map((b, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - ((b.visitors / max) * (H - PAD * 2));
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-eu-blue dark:stroke-eu-blue-light"
      />
    </svg>
  );
}
