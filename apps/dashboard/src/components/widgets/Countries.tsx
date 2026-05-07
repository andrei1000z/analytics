import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { compact } from "@/lib/format";

export function Countries({
  countries,
}: {
  countries: ReadonlyArray<{ code: string; name: string; sessions: number }>;
}): ReactNode {
  let max = 0;
  for (const c of countries) if (c.sessions > max) max = c.sessions;
  if (max === 0) max = 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Țări · top 10
        </h3>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-text-faint">
        Aproximat din timezone-ul vizitatorilor (privacy-safe — fără IP geo).
      </p>
      {countries.length === 0 ? (
        <p className="mt-4 text-xs text-text-faint">Nicio țară detectată încă.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {countries.map((c) => {
            const ratio = c.sessions / max;
            return (
              <li key={c.code} className="relative">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-lg bg-eu-blue/10 dark:bg-eu-blue-light/15"
                  style={{ width: `${Math.max(ratio * 100, 4)}%` }}
                />
                <div className="relative flex items-center gap-3 px-2.5 py-1.5">
                  <span className="inline-flex h-4 w-7 flex-none items-center justify-center rounded-md border border-line bg-soft-elev font-mono text-[9px] uppercase tracking-wider text-text-muted">
                    {c.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text-main">{c.name}</span>
                  <span className="flex-none font-mono text-xs text-text-muted">
                    {compact(c.sessions)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
