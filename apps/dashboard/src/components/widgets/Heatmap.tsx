import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

export function Heatmap({ data }: { data: number[][] }): ReactNode {
  let max = 0;
  for (const row of data) for (const v of row) if (v > max) max = v;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Heatmap · oră × zi
        </h3>
      </div>
      <p className="mt-1 text-xs text-text-faint">
        Când vin vizitatorii. Mai întunecat = mai multe sesiuni.
      </p>
      <div className="mt-4 flex items-start gap-2">
        <div className="flex flex-col gap-[3px] pt-5">
          {DAYS.map((d, i) => (
            <div
              key={i}
              className="flex h-4 w-3 items-center justify-end text-[9px] font-mono text-text-faint"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-24 gap-[3px]">
            {data.flatMap((row, dIdx) =>
              row.map((v, hIdx) => {
                const ratio = max > 0 ? v / max : 0;
                const opacity = ratio === 0 ? 0.05 : 0.15 + ratio * 0.85;
                return (
                  <div
                    key={`${dIdx}-${hIdx}`}
                    className={cn(
                      "h-4 rounded-[3px] transition-colors",
                      ratio === 0 ? "bg-soft-gray" : "bg-eu-blue dark:bg-eu-blue-light",
                    )}
                    style={ratio === 0 ? undefined : { opacity }}
                    title={`${DAYS[dIdx]} ${String(hIdx).padStart(2, "0")}:00 · ${v}`}
                  />
                );
              }),
            )}
          </div>
          <div className="mt-1.5 grid grid-cols-8 text-[9px] font-mono text-text-faint">
            {HOURS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
