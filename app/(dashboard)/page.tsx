import { headers } from "next/headers";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Globe,
  MonitorSmartphone,
  TrendingUp,
} from "lucide-react";
import StatCard from "../components/StatCard";
import TrafficChart from "../components/TrafficChart";
import TopPages from "../components/TopPages";
import LiveVisitors from "../components/LiveVisitors";
import RangeSelector from "../components/RangeSelector";
import DomainsList from "../components/DomainsList";
import EmptyDashboard from "../components/EmptyDashboard";
import { getDashboardData, parseRange } from "../lib/dashboardData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function trackerSnippet() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "your-domain";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host.startsWith("localhost") || host.startsWith("127.")
    ? `http://${host}`
    : `${proto}://${host}`;
  return `<script defer src="${origin}/script.js"></script>`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rangeParam = typeof sp.range === "string" ? sp.range : undefined;
  const range = parseRange(rangeParam);
  const data = await getDashboardData(range);
  const snippet = await trackerSnippet();

  if (data.totalViews === 0) {
    return <EmptyDashboard snippet={snippet} available={data.available} />;
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <Activity className="h-3.5 w-3.5" strokeWidth={2.5} />
            Date în timp real · GDPR · fără cookie-uri
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
            Salut, ai{" "}
            <span className="text-accent">
              {data.newToday.toLocaleString("ro-RO")} vizitatori
            </span>{" "}
            noi azi.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
            {data.totalViews.toLocaleString("ro-RO")} vizualizări în {data.range.label.toLowerCase()} ·{" "}
            {data.mobileShare}% mobile / {data.desktopShare}% desktop · sursă principală: {data.topReferrer}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RangeSelector active={range} />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] hover:bg-gray-700"
          >
            Exportă raport
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vizualizări totale"
          value={data.totalViews.toLocaleString("ro-RO")}
          delta={data.totalViewsDelta ?? undefined}
          deltaLabel={`Față de ${data.range.label.toLowerCase()} anterioare`}
          icon={Eye}
          accent="blue"
        />
        <StatCard
          label="Mobile vs Desktop"
          value={
            data.mobileViews + data.desktopViews === 0
              ? "—"
              : `${data.mobileShare}% / ${data.desktopShare}%`
          }
          helper={
            data.mobileViews + data.desktopViews === 0
              ? "Nicio vizualizare cu device_type încă"
              : `${data.mobileViews.toLocaleString("ro-RO")} mobile · ${data.desktopViews.toLocaleString("ro-RO")} desktop`
          }
          icon={MonitorSmartphone}
          accent="violet"
        />
        <StatCard
          label="Sursă principală"
          value={data.topReferrer}
          helper={
            data.topReferrer === "—" || data.topReferrer === "Direct"
              ? "Majoritatea traficului e direct (fără referrer)"
              : `${data.topReferrerShare}% din trafic`
          }
          icon={Globe}
          accent="emerald"
        />
        <StatCard
          label="Vizualizări azi"
          value={data.newToday.toLocaleString("ro-RO")}
          helper="Numărul de vizualizări înregistrate astăzi"
          icon={TrendingUp}
          accent="amber"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)] xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                Trafic în {data.range.label.toLowerCase()}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Vizualizări agregate pe {data.range.bucket === "hour" ? "ore" : "zile"}, în UTC.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Vizualizări
              </span>
              {typeof data.totalViewsDelta === "number" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${
                    data.totalViewsDelta >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {data.totalViewsDelta >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />
                  )}
                  {Math.abs(data.totalViewsDelta).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="mt-6">
            <TrafficChart data={data.traffic} />
          </div>
        </div>

        <LiveVisitors devices={data.devices} liveTotal={data.liveTotal} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopPages pages={data.topPages} />
        </div>
        <DomainsList domains={data.domains} />
      </section>
    </div>
  );
}
