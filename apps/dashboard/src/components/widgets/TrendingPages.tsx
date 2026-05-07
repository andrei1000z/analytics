import type { ReactNode } from "react";
import { ArrowUpRight, Flame } from "lucide-react";
import { compact } from "@/lib/format";

export function TrendingPages({
  pages,
}: {
  pages: ReadonlyArray<{ path: string; current: number; previous: number; ratio: number }>;
}): ReactNode {
  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <Flame className="h-3.5 w-3.5 text-eu-yellow-deep dark:text-eu-yellow" aria-hidden />
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Trending · cea mai mare creștere
        </h3>
      </div>
      {pages.length === 0 ? (
        <p className="mt-4 text-xs text-text-faint">Date insuficiente pentru tendințe.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {pages.map((p) => {
            const ratioLabel = !isFinite(p.ratio)
              ? "nou"
              : p.ratio === 0
                ? "—"
                : `${p.ratio >= 0 ? "+" : ""}${(p.ratio * 100).toFixed(0)}%`;
            return (
              <li
                key={p.path}
                className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-soft-gray/60"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                  {ratioLabel}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-main">
                  {p.path}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  {compact(p.previous)} → {compact(p.current)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
