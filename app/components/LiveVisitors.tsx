import { Smartphone, Monitor, Tablet, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeviceSlice } from "../lib/dashboardData";

const ICONS: Record<string, LucideIcon> = {
  mobile: Smartphone,
  phone: Smartphone,
  desktop: Monitor,
  laptop: Monitor,
  tablet: Tablet,
};

function iconFor(label: string): LucideIcon {
  return ICONS[label.toLowerCase()] ?? HelpCircle;
}

export default function LiveVisitors({
  devices,
  liveTotal,
}: {
  devices: DeviceSlice[];
  liveTotal: number;
}) {
  const max = Math.max(1, ...devices.map((d) => d.visitors));
  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">
            Vizitatori activi
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Distribuție pe dispozitive — ultimele 7 zile.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
            {liveTotal}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            online acum
          </span>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm font-medium tracking-tight text-gray-900">
            Niciun dispozitiv detectat.
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
            Datele apar aici de îndată ce primul vizitator încarcă pagina.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {devices.map((device) => {
            const Icon = iconFor(device.label);
            return (
              <li key={device.label} className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium tracking-tight text-gray-900">
                      {device.label}
                    </span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {device.visitors.toLocaleString("ro-RO")}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-500"
                      style={{ width: `${(device.visitors / max) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
