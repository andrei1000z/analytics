import {
  Activity,
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

const NEW_VISITORS_TODAY = 1284;

export default function Home() {
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
              {NEW_VISITORS_TODAY.toLocaleString("ro-RO")} vizitatori
            </span>{" "}
            noi azi.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
            Trafic constant, fără anomalii. Pagina <span className="font-medium text-gray-700">/preturi</span> a urcat cu 22% față de săptămâna trecută — pare un moment bun să rulezi un nou test.
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
          value="48.219"
          delta={12.4}
          deltaLabel="+12.4% față de săptămâna trecută"
          icon={Eye}
          accent="blue"
        />
        <StatCard
          label="Dispozitive unice"
          value="12.847"
          delta={8.2}
          deltaLabel="+8.2% față de săptămâna trecută"
          icon={MonitorSmartphone}
          accent="violet"
        />
        <StatCard
          label="Sursă principală"
          value="google.com"
          helper="42% din traficul total a venit prin căutare organică"
          icon={Globe}
          accent="emerald"
        />
        <StatCard
          label="Rată de conversie"
          value="3,84%"
          delta={-1.6}
          deltaLabel="-1.6% față de săptămâna trecută"
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
                Vizualizări vs. vizitatori unici, agregat zilnic în UTC+2.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Vizualizări
              </span>
              <span className="inline-flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
                Vizitatori unici
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
            <TrafficChart />
          </div>
        </div>

        <LiveVisitors />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopPages />
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
