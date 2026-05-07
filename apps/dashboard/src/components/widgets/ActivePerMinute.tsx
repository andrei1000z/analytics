import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";

export function ActivePerMinute({
  data,
  liveCount,
}: {
  data: ReadonlyArray<number>;
  liveCount: number;
}): ReactNode {
  let max = 0;
  for (const v of data) if (v > max) max = v;
  if (max === 0) max = 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Activitate · ultimele 30 min
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ping"
            />
          </span>
          {liveCount} acum
        </span>
      </div>
      <div className="mt-4 flex h-20 items-end gap-1">
        {data.map((v, i) => {
          const h = (v / max) * 100;
          return (
            <motion.div
              key={i}
              initial={{ height: "4%" }}
              animate={{ height: `${Math.max(h, 4)}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 rounded-t-sm bg-eu-blue/70 dark:bg-eu-blue-light/70"
              title={`${v} evenimente acum ${30 - i}min`}
              aria-hidden
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-text-faint">
        <span>30m</span>
        <span>15m</span>
        <span>acum</span>
      </div>
    </div>
  );
}
