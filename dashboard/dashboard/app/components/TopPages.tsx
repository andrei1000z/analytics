import { ArrowUpRight } from "lucide-react";
import type { TopPage } from "../lib/dashboardData";

export default function TopPages({ pages }: { pages: TopPage[] }) {
  const maxShare = Math.max(1, ...pages.map((p) => p.share));
  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">
            Pagini de top
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Cele mai vizitate pagini din ultimele 7 zile.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
        >
          Vezi toate
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm font-medium tracking-tight text-gray-900">
            Nicio vizualizare încă.
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
            Instalează tracker-ul pe site-ul tău și paginile vor apărea aici în
            câteva minute.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {pages.map((page) => (
            <li
              key={page.path}
              className="group flex items-center gap-4 py-4 first:pt-2 last:pb-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-gray-900">
                  {page.title}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-gray-500">
                  {page.path}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.max(4, (page.share / maxShare) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold tracking-tight text-gray-900 tabular-nums">
                  {page.views.toLocaleString("ro-RO")}
                </span>
                <span className="text-xs font-medium tabular-nums text-gray-500">
                  {page.share}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
