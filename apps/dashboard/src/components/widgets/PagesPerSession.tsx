import type { ReactNode } from "react";
import { Layers } from "lucide-react";

export function PagesPerSession({
  histogram,
}: {
  histogram: ReadonlyArray<{ bucket: string; sessions: number }>;
}): ReactNode {
  let max = 0;
  for (const b of histogram) if (b.sessions > max) max = b.sessions;
  if (max === 0) max = 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Adâncime · pagini per sesiune
        </h3>
      </div>
      <div className="mt-4 grid grid-cols-5 items-end gap-2 h-28">
        {histogram.map((b) => {
          const h = (b.sessions / max) * 100;
          return (
            <div key={b.bucket} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[9px] text-text-muted">{b.sessions}</span>
              <div
                className="w-full rounded-t-md bg-emerald-500/80"
                style={{ height: `${Math.max(h, 4)}%` }}
                aria-hidden
                title={`${b.bucket} pagini: ${b.sessions} sesiuni`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2 text-center font-mono text-[9px] tracking-wider text-text-faint">
        {histogram.map((b) => (
          <span key={b.bucket}>{b.bucket}</span>
        ))}
      </div>
    </div>
  );
}
