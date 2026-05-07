import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { compact } from "@/lib/format";

export function TopList<T extends { views: number }>({
  title,
  icon: Icon,
  items,
  labelOf,
  emptyText = "Niciun element încă",
}: {
  title: string;
  icon: LucideIcon;
  items: ReadonlyArray<T>;
  labelOf: (item: T) => ReactNode;
  emptyText?: string;
}): ReactNode {
  let max = 0;
  for (const it of items) if (it.views > max) max = it.views;
  if (max === 0) max = 1;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-xs text-text-faint">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.map((it, idx) => {
            const ratio = it.views / max;
            return (
              <li key={idx} className="relative">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-lg bg-eu-blue/10 dark:bg-eu-blue-light/15"
                  style={{ width: `${Math.max(ratio * 100, 4)}%` }}
                />
                <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-text-main">
                    {labelOf(it)}
                  </span>
                  <span className="flex-none font-mono text-xs text-text-muted">
                    {compact(it.views)}
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
