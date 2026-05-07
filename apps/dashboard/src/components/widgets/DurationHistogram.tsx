import type { ReactNode } from "react";
import { Timer } from "lucide-react";
import type { DurationBucket } from "@/cache/types";
import { compact } from "@/lib/format";

export function DurationHistogram({
  buckets,
}: {
  buckets: ReadonlyArray<{ bucket: DurationBucket; sessions: number }>;
}): ReactNode {
  let max = 0;
  for (const b of buckets) if (b.sessions > max) max = b.sessions;
  if (max === 0) max = 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Timer className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Durată sesiune
        </h3>
      </div>
      <div className="mt-4 grid grid-cols-6 items-end gap-2 h-32">
        {buckets.map((b) => {
          const h = max > 0 ? (b.sessions / max) * 100 : 0;
          return (
            <div key={b.bucket} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[9px] text-text-muted">
                {compact(b.sessions)}
              </span>
              <div
                className="w-full rounded-t-md bg-eu-blue/80 dark:bg-eu-blue-light/80"
                style={{ height: `${Math.max(h, 4)}%` }}
                aria-hidden
                title={`${b.bucket}: ${b.sessions}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2 text-center font-mono text-[9px] tracking-wider text-text-faint">
        {buckets.map((b) => (
          <span key={b.bucket}>{b.bucket}</span>
        ))}
      </div>
    </div>
  );
}
