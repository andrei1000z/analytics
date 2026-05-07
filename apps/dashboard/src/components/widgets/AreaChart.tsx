import { useId, useMemo } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Bucket, Range } from "@/cache/types";
import { compact } from "@/lib/format";

const PAD = { top: 16, right: 4, bottom: 24, left: 36 };
const VBOX = { w: 800, h: 240 };

export function AreaChart({
  series,
  range,
}: {
  series: ReadonlyArray<Bucket>;
  range: Range;
}): ReactNode {
  const gradId = useId().replace(/:/g, "");
  const { path, areaPath, max, ticksX, ticksY } = useMemo(() => buildPaths(series, range), [series, range]);

  if (series.length < 2) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-line bg-soft-gray/40">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
          Date insuficiente
        </p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VBOX.w} ${VBOX.h}`}
      preserveAspectRatio="none"
      className="h-60 w-full"
      role="img"
      aria-label="Trafic în timp"
    >
      <defs>
        <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticksY.map((tick) => (
        <g key={tick.y}>
          <line
            x1={PAD.left}
            x2={VBOX.w - PAD.right}
            y1={tick.y}
            y2={tick.y}
            className="stroke-line"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <text
            x={PAD.left - 6}
            y={tick.y + 3}
            textAnchor="end"
            className="fill-text-faint font-mono"
            style={{ fontSize: 10 }}
          >
            {compact(tick.value)}
          </text>
        </g>
      ))}

      {ticksX.map((tick) => (
        <text
          key={`${tick.x}-${tick.label}`}
          x={tick.x}
          y={VBOX.h - 6}
          textAnchor="middle"
          className="fill-text-faint font-mono"
          style={{ fontSize: 10 }}
        >
          {tick.label}
        </text>
      ))}

      <path d={areaPath} fill={`url(#area-${gradId})`} className="text-eu-blue dark:text-eu-blue-light" />
      <motion.path
        d={path}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-eu-blue dark:stroke-eu-blue-light"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <title>Trafic ({max} max/oră)</title>
    </svg>
  );
}

function buildPaths(series: ReadonlyArray<Bucket>, range: Range): {
  path: string;
  areaPath: string;
  max: number;
  ticksY: Array<{ y: number; value: number }>;
  ticksX: Array<{ x: number; label: string }>;
} {
  const innerW = VBOX.w - PAD.left - PAD.right;
  const innerH = VBOX.h - PAD.top - PAD.bottom;
  let max = 0;
  for (const b of series) if (b.visitors > max) max = b.visitors;
  if (max === 0) max = 1;

  const stepX = innerW / (series.length - 1);
  const points = series.map((b, i) => {
    const x = PAD.left + i * stepX;
    const y = PAD.top + innerH - (b.visitors / max) * innerH;
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = first && last
    ? `${path} L${last[0].toFixed(2)},${(VBOX.h - PAD.bottom).toFixed(2)} L${first[0].toFixed(2)},${(VBOX.h - PAD.bottom).toFixed(2)} Z`
    : "";

  const ticksY = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: PAD.top + innerH - p * innerH,
    value: Math.round(max * p),
  }));

  const labelCount = range === "24h" ? 4 : range === "7d" ? 4 : 5;
  const ticksX: Array<{ x: number; label: string }> = [];
  const fmtHour = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const fmtDay = new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "short" });
  for (let i = 0; i < labelCount; i++) {
    const t = i / (labelCount - 1);
    const idx = Math.round(t * (series.length - 1));
    const point = points[idx];
    const bucket = series[idx];
    if (!point || !bucket) continue;
    const label = range === "24h" ? fmtHour.format(bucket.ts) : fmtDay.format(bucket.ts);
    ticksX.push({ x: point[0], label });
  }

  return { path, areaPath, max, ticksY, ticksX };
}
