import {
  Activity,
  AlertCircle,
  Calendar,
  Eye,
  Globe,
  MonitorSmartphone,
  TrendingUp,
} from "lucide-react";
import StatCard from "./components/StatCard";
import TrafficChart from "./components/TrafficChart";
import TopPages from "./components/TopPages";
import LiveVisitors from "./components/LiveVisitors";
import { getDashboardData } from "./lib/dashboardData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-10">
      {!data.available && (
        <div className="flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertCircle className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-amber-900">
              Conexiunea cu Supabase nu este completă încă.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Rulează scriptul{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                backend/schema.sql
              </code>{" "}
              în Supabase SQL Editor, apoi reîncarcă această pagină. Până atunci
              datele afișate sunt zero.
            </p>
          </div>
        </div>
      )}

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
            {data.totalViews > 0
              ? `${data.totalViews.toLocaleString("ro-RO")} vizualizări totale în ultimele 7 zile · ${data.mobileShare}% mobile / ${data.desktopShare}% desktop · sursă principală: ${data.topReferrer}.`
              : "Fără trafic încă. Instalează tracker-ul pe site-ul tău și datele vor curge automat aici, fără cookie-uri."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-[var(--shadow-card)] hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4 text-gray-400" strokeWidth={2} />
            Ultimele 7 zile
          </button>
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
          deltaLabel="Față de săptămâna trecută"
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
              : `${data.topReferrerShare}% din traficul ultimelor 7 zile`
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
                Trafic în ultimele 7 zile
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Vizualizări agregate zilnic, în UTC.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Vizualizări
              </span>
              <div className="ml-auto flex rounded-full border border-border bg-white p-1 sm:ml-0">
                {(["7z", "30z", "90z"] as const).map((range, i) => (
                  <button
                    key={range}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      i === 0
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
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

        <div className="rounded-3xl border border-border bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 text-white shadow-[var(--shadow-soft)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            Plan Pro
          </span>
          <h3 className="mt-5 text-2xl font-bold leading-tight tracking-tight">
            Mai multe site-uri, aceleași standarde de privacy.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Conectează până la 25 de site-uri și păstrează datele 24 de luni.
            Toate hostate în Frankfurt, fără terți.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold tracking-tight text-gray-900 hover:bg-gray-100"
            >
              Adaugă site
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Vezi facturarea
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
