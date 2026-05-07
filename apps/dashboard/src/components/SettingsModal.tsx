import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2,
  Database,
  Keyboard,
  Link2,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeSetting } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import { ScannerRing } from "./ScannerRing";
import type { ScannerState } from "./ScannerRing";
import { Kbd } from "./Kbd";
import { isAppleDevice } from "@/hooks/useHotkeys";
import { cn } from "@/lib/cn";

const SPRING = {
  type: "spring" as const,
  stiffness: 360,
  damping: 30,
  mass: 0.85,
};

const SECTION_TITLE_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted";

export function SettingsModal({
  open,
  onClose,
  onRequestDeleteAll,
}: {
  open: boolean;
  onClose: () => void;
  onRequestDeleteAll: () => void;
}): ReactNode {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="glass-overlay fixed inset-0 z-50"
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center p-4">
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={SPRING}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="glass-modal pointer-events-auto w-[min(34rem,92vw)] overflow-hidden rounded-3xl"
          >
            <div className="flex items-start justify-between border-b border-white/20 px-7 pt-6 pb-5 dark:border-white/10">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  Setări
                </p>
                <h2 id="settings-title" className="mt-1 text-xl font-bold tracking-tight">
                  Preferințe
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-text-muted transition-colors hover:bg-soft-gray hover:text-text-main"
                aria-label="Închide setările"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-7 py-6">
              <EndpointsSection />
              <Divider />
              <ThemeSection />
              <Divider />
              <OptimizeSection />
              <Divider />
              <DataSection onRequestDeleteAll={onRequestDeleteAll} />
              <Divider />
              <ShortcutsSection />
            </div>
          </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function Divider(): ReactNode {
  return <div className="my-6 h-px bg-line" aria-hidden />;
}

function EndpointsSection(): ReactNode {
  const ingestUrl = useStore((s) => s.ingestUrl);
  const setIngestUrl = useStore((s) => s.setIngestUrl);
  const trackerUrl = useStore((s) => s.trackerUrl);
  const setTrackerUrl = useStore((s) => s.setTrackerUrl);

  const [draftIngest, setDraftIngest] = useState(ingestUrl);
  const [draftTracker, setDraftTracker] = useState(trackerUrl);

  useEffect(() => setDraftIngest(ingestUrl), [ingestUrl]);
  useEffect(() => setDraftTracker(trackerUrl), [trackerUrl]);

  const dirty = draftIngest.trim() !== ingestUrl.trim() || draftTracker.trim() !== trackerUrl.trim();

  function save(): void {
    setIngestUrl(draftIngest.trim());
    setTrackerUrl(draftTracker.trim());
  }

  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Endpoint-uri
        </span>
      </p>
      <div className="mt-3 rounded-2xl border border-line bg-soft-gray/50 p-5">
        <h3 className="text-sm font-semibold tracking-tight">Ingest + tracker CDN</h3>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          Ingest-ul e nodul Rust pe Hetzner / Scaleway / Pi (vezi DEPLOYMENT.md). Tracker-ul e
          fișierul JS ≤ 1 KB pe care site-urile tale îl vor încărca prin <span className="font-mono">{`<script>`}</span>.
          Lasă tracker-ul gol pentru a folosi același host ca ingest-ul.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
              <Link2 className="h-3 w-3" aria-hidden />
              Ingest URL
            </span>
            <input
              type="url"
              placeholder="https://ingest.exemplu.eu"
              value={draftIngest}
              onChange={(e) => setDraftIngest(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 block w-full rounded-xl border border-line bg-soft-elev px-3 py-2 text-sm text-text-main placeholder:text-text-faint shadow-soft-1 transition-colors focus:border-eu-blue/40 focus:outline-none focus:ring-2 focus:ring-eu-blue/15"
            />
          </label>

          <label className="block">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
              <Code2 className="h-3 w-3" aria-hidden />
              Tracker CDN URL <span className="text-text-faint normal-case tracking-normal">(opțional)</span>
            </span>
            <input
              type="url"
              placeholder="https://cdn.exemplu.eu"
              value={draftTracker}
              onChange={(e) => setDraftTracker(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 block w-full rounded-xl border border-line bg-soft-elev px-3 py-2 text-sm text-text-main placeholder:text-text-faint shadow-soft-1 transition-colors focus:border-eu-blue/40 focus:outline-none focus:ring-2 focus:ring-eu-blue/15"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Salvează
          </button>
          <span className="text-[11px] text-text-faint">
            Passphrase-ul per site se introduce când deblochezi un site.
          </span>
        </div>
      </div>
    </section>
  );
}

function ThemeSection(): ReactNode {
  const { setting, setSetting } = useTheme();
  const options: Array<{ value: ThemeSetting; label: string; icon: LucideIcon }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>Temă</p>
      <div className="mt-3 inline-flex gap-1 rounded-2xl border border-line bg-soft-gray p-1">
        {options.map((opt) => {
          const active = setting === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSetting(opt.value)}
              className="relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-main"
              aria-pressed={active}
            >
              {active ? (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-xl bg-soft-elev shadow-soft-1"
                  transition={{ type: "spring", stiffness: 480, damping: 32, mass: 0.5 }}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 inline-flex items-center gap-1.5",
                  active ? "text-text-main" : "",
                )}
              >
                <opt.icon className="h-3.5 w-3.5" aria-hidden />
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const OPTIMIZE_STAGES: ReadonlyArray<{ delay: number; label: string }> = [
  { delay: 0, label: "Pregătire" },
  { delay: 700, label: "Curăț cache local" },
  { delay: 1500, label: "Reindexez vizualizări" },
  { delay: 2300, label: "Compactez snapshot" },
];

function OptimizeSection(): ReactNode {
  const [state, setState] = useState<ScannerState>("idle");
  const [label, setLabel] = useState<string | undefined>(undefined);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    };
  }, []);

  function run(): void {
    if (state === "running") return;
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    setState("running");
    for (const stage of OPTIMIZE_STAGES) {
      const t = window.setTimeout(() => setLabel(stage.label), stage.delay);
      timersRef.current.push(t);
    }
    const tDone = window.setTimeout(() => {
      setState("done");
      setLabel("Optimizat");
    }, 3100);
    timersRef.current.push(tDone);
    const tReset = window.setTimeout(() => {
      setState("idle");
      setLabel(undefined);
    }, 5400);
    timersRef.current.push(tReset);
  }

  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>Optimizare</p>
      <div className="mt-3 flex items-center gap-5 rounded-2xl border border-line bg-soft-gray/50 p-5">
        <ScannerRing state={state} label={label} className="flex-none" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold tracking-tight">Cache local + index</h3>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Compactează snapshot-ul SQLite local și reindexează vizualizările frecvente.
            Recomandat lunar sau după ștergeri masive.
          </p>
          <button
            type="button"
            onClick={run}
            disabled={state === "running"}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Zap className="h-4 w-4" aria-hidden />
            {state === "done" ? "Rulează din nou" : state === "running" ? "Se rulează…" : "Rulează"}
          </button>
        </div>
      </div>
    </section>
  );
}

function DataSection({
  onRequestDeleteAll,
}: {
  onRequestDeleteAll: () => void;
}): ReactNode {
  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>Date</p>
      <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <Database className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold tracking-tight">Zonă periculoasă</h3>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Șterge toate site-urile, colecțiile și cache-ul local. Datele criptate de pe
              ingest rămân (sunt indecodabile fără passphrase).
            </p>
            <button
              type="button"
              onClick={onRequestDeleteAll}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-white/40 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:-translate-y-px hover:bg-red-500/10 hover:text-red-700 dark:bg-white/5 dark:text-red-400 dark:hover:bg-red-500/15"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Șterge toate datele
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const SHORTCUTS: ReadonlyArray<{ keys: ReadonlyArray<string>; label: string }> = [
  { keys: ["mod", "K"], label: "Paletă comenzi" },
  { keys: ["mod", "+"], label: "Site nou" },
  { keys: ["Esc"], label: "Închide modal / popup" },
  { keys: ["↑", "↓"], label: "Navighează în paletă" },
  { keys: ["↵"], label: "Execută selecția" },
  { keys: [","], label: "Deschide setări (din paletă)" },
];

function ShortcutsSection(): ReactNode {
  const modLabel = isAppleDevice ? "⌘" : "Ctrl";
  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>
        <span className="inline-flex items-center gap-2">
          <Keyboard className="h-3 w-3" aria-hidden />
          Scurtături
        </span>
      </p>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-soft-gray/50">
        {SHORTCUTS.map((sc) => (
          <li
            key={sc.label}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <span className="text-text-main">{sc.label}</span>
            <span className="inline-flex items-center gap-1">
              {sc.keys.map((k, idx) => (
                <span key={`${k}-${idx}`} className="inline-flex items-center gap-1">
                  <Kbd>{k === "mod" ? modLabel : k}</Kbd>
                  {idx < sc.keys.length - 1 ? (
                    <span className="text-[10px] text-text-faint">+</span>
                  ) : null}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 inline-flex items-center gap-2 text-[10px] text-text-faint">
        <ShieldCheck className="h-3 w-3" aria-hidden /> Multi-device sync via Sync E2E ·
        Phase 7.
      </p>
    </section>
  );
}
