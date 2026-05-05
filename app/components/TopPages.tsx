import { ArrowUpRight } from "lucide-react";

type Page = {
  path: string;
  title: string;
  views: number;
  share: number;
  delta: number;
};

const pages: Page[] = [
  {
    path: "/",
    title: "Pagina principală",
    views: 4218,
    share: 38,
    delta: 12.4,
  },
  {
    path: "/preturi",
    title: "Prețuri & planuri",
    views: 2104,
    share: 19,
    delta: 6.8,
  },
  {
    path: "/blog/gdpr-fara-cookie",
    title: "Cum măsori traficul fără cookie-uri",
    views: 1683,
    share: 15,
    delta: 22.1,
  },
  {
    path: "/integrari/nextjs",
    title: "Integrare Next.js în 2 minute",
    views: 1129,
    share: 10,
    delta: -3.2,
  },
  {
    path: "/docs",
    title: "Documentație",
    views: 942,
    share: 8,
    delta: 4.5,
  },
];

export default function TopPages() {
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

      <ul className="mt-6 divide-y divide-border">
        {pages.map((page) => {
          const isPositive = page.delta >= 0;
          return (
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
                    style={{ width: `${page.share * 2.4}%` }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold tracking-tight text-gray-900 tabular-nums">
                  {page.views.toLocaleString("ro-RO")}
                </span>
                <span
                  className={`text-xs font-medium tabular-nums ${
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {page.delta.toFixed(1)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
