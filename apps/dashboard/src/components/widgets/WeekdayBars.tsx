import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { compact } from "@/lib/format";

const LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

export function WeekdayBars({ data }: { data: ReadonlyArray<number> }): ReactNode {
  let max = 0;
  for (const v of data) if (v > max) max = v;
  if (max === 0) max = 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Zi din săptămână
        </h3>
      </div>
      <div className="mt-4 grid grid-cols-7 items-end gap-2 h-28">
        {data.map((v, i) => {
          const h = (v / max) * 100;
          return (
            <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[9px] text-text-muted">{compact(v)}</span>
              <div
                className="w-full rounded-t-md bg-eu-yellow-deep/80 dark:bg-eu-yellow/80"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={`${LABELS[i]}: ${v}`}
                aria-hidden
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-center font-mono text-[9px] tracking-wider text-text-faint">
        {LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
