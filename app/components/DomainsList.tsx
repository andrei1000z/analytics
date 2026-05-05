import { Globe2, Link as LinkIcon } from "lucide-react";
import type { DomainSlice } from "../lib/dashboardData";

export default function DomainsList({ domains }: { domains: DomainSlice[] }) {
  const max = Math.max(1, ...domains.map((d) => d.views));
  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">
            Domenii de top
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            De unde vine traficul. Domeniile sunt grupate după host-ul referrer-ului.
          </p>
        </div>
        <span className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Globe2 className="h-5 w-5" strokeWidth={2.25} />
        </span>
      </div>

      {domains.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <LinkIcon className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="mt-3 text-sm font-medium tracking-tight text-gray-900">
            Niciun referrer încă.
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
            Imediat ce primești prima vizită cu referrer, domeniul apare aici.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {domains.map((d) => (
            <li
              key={d.domain}
              className="flex items-center gap-4 py-4 first:pt-2 last:pb-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-canvas text-gray-500">
                <Globe2 className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-gray-900">
                  {d.domain}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.max(4, (d.views / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="text-sm font-semibold tracking-tight text-gray-900 tabular-nums">
                  {d.views.toLocaleString("ro-RO")}
                </span>
                <span className="text-xs font-medium text-gray-500 tabular-nums">
                  {d.share}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
