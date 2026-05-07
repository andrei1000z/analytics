import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Globe, Plus, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { EmptyState } from "./EmptyState";
import { Kbd } from "./Kbd";
import { isAppleDevice } from "@/hooks/useHotkeys";
import { relativeTime } from "@/lib/format";

const SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

export function MainPane(): ReactNode {
  const sitesMap = useStore((s) => s.sites);
  const activeSiteId = useStore((s) => s.activeSiteId);
  const selectSite = useStore((s) => s.selectSite);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const createSite = useStore((s) => s.createSite);

  const activeSite = activeSiteId ? sitesMap[activeSiteId] : undefined;
  const modLabel = isAppleDevice ? "⌘" : "Ctrl";

  if (!activeSite) {
    const hasAnySite = Object.keys(sitesMap).length > 0;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <EmptyState
          icon={hasAnySite ? Globe : ShieldCheck}
          title={hasAnySite ? "Selectează un site" : "Bun venit la Analytics"}
          description={
            hasAnySite
              ? "Alege un site din panoul lateral sau deschide paleta de comenzi pentru navigare rapidă."
              : "Suveranitate europeană prin matematică. Adaugă primul tău site și începe colectarea anonimă."
          }
          action={
            hasAnySite
              ? { label: "Paletă comenzi", onClick: () => setPaletteOpen(true), icon: Plus }
              : {
                  label: "Site nou",
                  onClick: () => createSite({ name: "Primul site", domain: "exemplu.eu" }),
                  icon: Plus,
                }
          }
          hint={
            <>
              <Kbd>{modLabel}</Kbd>
              <Kbd>K</Kbd>
              <span>· paletă comenzi</span>
            </>
          }
        />
      </div>
    );
  }

  return (
    <motion.section
      key={activeSite.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex h-full w-full flex-col overflow-hidden"
    >
      <header className="flex items-center gap-3 border-b border-line bg-soft-bg/70 px-5 py-4 backdrop-blur-xl md:px-8 md:py-5">
        <button
          type="button"
          onClick={() => selectSite(null)}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-soft-elev p-1.5 text-text-muted shadow-soft-1 transition-colors hover:text-text-main md:hidden"
          aria-label="Înapoi la lista de site-uri"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex flex-1 items-center gap-3">
          <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue md:inline-flex dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
            <Globe className="h-5 w-5" strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Site · {relativeTime(activeSite.createdAt)}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
              {activeSite.name}
            </h1>
            <p className="mt-0.5 truncate text-xs text-text-faint">{activeSite.domain}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
        <Phase1Placeholder />
      </div>
    </motion.section>
  );
}

function Phase1Placeholder(): ReactNode {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Vizitatori (24h)", value: "—", hint: "Phase 2" },
        { label: "Pagini vizualizate", value: "—", hint: "Phase 2" },
        { label: "Live", value: "—", hint: "Phase 5" },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="glass-card rounded-3xl p-5"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
            {kpi.label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-text-faint">{kpi.value}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-text-faint">
            <span className="inline-flex h-1 w-1 rounded-full bg-text-faint" aria-hidden />
            {kpi.hint}
          </p>
        </div>
      ))}
      <div className="glass-card md:col-span-3 rounded-3xl p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Trafic
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">Grafic agregat</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          Charts SVG cu motion paths sosesc în Phase 2 (cache local IndexedDB + agregare client-side).
          Snippet-ul tracker (≤1 KB) intră în Phase 3, ingest-ul Rust în Phase 4, decriptarea live
          WebCrypto în Phase 5.
        </p>
        <div className="mt-5 flex h-40 items-center justify-center rounded-2xl border border-dashed border-line bg-soft-gray/40">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
            Spațiu rezervat · Phase 2
          </p>
        </div>
      </div>
    </div>
  );
}
