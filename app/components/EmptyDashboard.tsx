import { Activity, Globe, ShieldCheck, Sparkles } from "lucide-react";
import CopySnippet from "./CopySnippet";

export default function EmptyDashboard({
  snippet,
  available,
}: {
  snippet: string;
  available: boolean;
}) {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-border bg-white p-10 shadow-[var(--shadow-card)] sm:p-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
              Aproape gata
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-4xl">
              Nu ai date încă.
              <br />
              <span className="text-accent">Instalează tracker-ul</span> și
              vezi prima vizită în câteva secunde.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
              Lipește snippet-ul de mai jos în <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">&lt;head&gt;</code>{" "}
              pe site-ul tău. Fără cookie-uri, fără localStorage, fără
              urmărire între domenii — datele apar live pe acest dashboard.
            </p>

            <div className="mt-8">
              <CopySnippet snippet={snippet} />
            </div>

            {!available && (
              <p className="mt-4 text-xs text-amber-700">
                Notă: conexiunea cu Supabase încă nu răspunde. Verifică că ai
                rulat <code className="font-mono">backend/schema.sql</code> și
                că variabilele de mediu sunt setate.
              </p>
            )}
          </div>

          <div className="relative hidden h-full min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-br from-accent-soft via-white to-canvas lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,85,255,0.18),transparent_55%)]" />
            <div className="relative flex h-full flex-col items-center justify-center gap-6 p-10">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-[var(--shadow-soft)]">
                <Activity className="h-8 w-8 text-accent" strokeWidth={2} />
              </span>
              <div className="grid w-full grid-cols-3 gap-3">
                {[40, 70, 55, 85, 60, 95, 75].slice(0, 6).map((h, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/70 p-3 text-center shadow-[var(--shadow-card)] backdrop-blur"
                  >
                    <div
                      className="mx-auto rounded-full bg-accent/80"
                      style={{ height: `${h}px`, width: "8px" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-[var(--shadow-card)]">
                <ShieldCheck
                  className="h-3.5 w-3.5 text-emerald-600"
                  strokeWidth={2.25}
                />
                GDPR · UE only · 0 cookies
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          {
            icon: Globe,
            title: "1. Pune snippet-ul",
            text: "În <head>, pe orice pagină. Fără build, fără config, fără SDK.",
          },
          {
            icon: Activity,
            title: "2. Trimite o vizită",
            text: "Deschide site-ul într-un alt tab. Tracker-ul trimite event la /api/collect.",
          },
          {
            icon: ShieldCheck,
            title: "3. Vezi datele aici",
            text: "Reîncarcă dashboard-ul. Vizualizările, dispozitivele și sursele apar instant.",
          },
        ].map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-3xl border border-border bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <p className="mt-4 text-sm font-semibold tracking-tight text-gray-900">
                {step.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {step.text}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
