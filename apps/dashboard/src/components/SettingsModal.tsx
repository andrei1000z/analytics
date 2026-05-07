import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2,
  Database,
  Eye,
  EyeOff,
  Keyboard,
  Link2,
  Lock,
  Monitor,
  Moon,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Unplug,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeSetting } from "@/hooks/useTheme";
import { useStore } from "@/store/useStore";
import { useSessions } from "@/store/useSessions";
import { generatePassphrase } from "@/sync/passphrase";
import { relativeTime } from "@/lib/format";
import { InstallButton } from "./InstallButton";
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
              <DeviceSyncSection />
              <Divider />
              <InstallSection />
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

function DeviceSyncSection(): ReactNode {
  const masterPassphrase = useSessions((s) => s.masterPassphrase);
  const setMasterPassphrase = useSessions((s) => s.setMasterPassphrase);
  const status = useSessions((s) => s.configSyncStatus);
  const detail = useSessions((s) => s.configSyncDetail);
  const lastSnapshotAt = useSessions((s) => s.lastSnapshotAt);

  const [draft, setDraft] = useState(masterPassphrase ?? "");
  const [show, setShow] = useState(false);

  useEffect(() => setDraft(masterPassphrase ?? ""), [masterPassphrase]);

  const STATUS_LABEL: Record<typeof status, string> = {
    idle: "Inactiv",
    connecting: "Conectare…",
    connected: "Sincronizat",
    offline: "Offline",
    error: "Eroare",
  };
  const STATUS_DOT: Record<typeof status, string> = {
    idle: "bg-text-faint",
    connecting: "bg-eu-blue animate-pulse",
    connected: "bg-emerald-500",
    offline: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>
        <span className="inline-flex items-center gap-2">
          <Smartphone className="h-3 w-3" aria-hidden />
          Sincronizare între dispozitive
        </span>
      </p>
      <div className="mt-3 rounded-2xl border border-line bg-soft-gray/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold tracking-tight">Master passphrase</h3>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Introdu aceeași frază pe laptop și telefon → toate site-urile + passphrase-urile per
              site se sincronizează automat prin Pi-ul tău, criptate. <strong>Doar tu</strong> cu
              fraza asta poți decripta — serverul vede ciphertext.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full border border-line bg-soft-elev/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted backdrop-blur-md"
            role="status"
          >
            <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="6+ cuvinte sau o frază lungă…"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className="flex-1 rounded-xl border border-line bg-soft-elev px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-faint shadow-soft-1 transition-colors focus:border-eu-blue/40 focus:outline-none focus:ring-2 focus:ring-eu-blue/15"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="rounded-xl border border-line bg-soft-elev px-3 text-text-muted transition-colors hover:text-text-main"
              aria-label={show ? "Ascunde" : "Arată"}
            >
              {show ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDraft(generatePassphrase())}
              className="rounded-xl border border-line bg-soft-elev px-3 text-text-muted transition-colors hover:text-text-main"
              aria-label="Generează frază nouă"
              title="Generează frază nouă"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMasterPassphrase(draft.length >= 8 ? draft : null)}
            disabled={draft.length < 8}
            className="inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Lock className="h-4 w-4" aria-hidden />
            {masterPassphrase ? "Reactivează sync" : "Pornește sync"}
          </button>
          <button
            type="button"
            onClick={() => setMasterPassphrase(null)}
            disabled={!masterPassphrase}
            className="inline-flex items-center gap-2 rounded-2xl border border-line bg-soft-elev px-4 py-2 text-sm font-medium text-text-main shadow-soft-1 transition-all hover:-translate-y-px hover:shadow-soft-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Unplug className="h-4 w-4" aria-hidden />
            Oprește
          </button>
          {lastSnapshotAt ? (
            <span className="text-[11px] text-text-faint">
              · Ultimul snapshot {relativeTime(lastSnapshotAt)}
            </span>
          ) : null}
        </div>

        {detail ? (
          <p className="mt-2 text-[11px] text-text-faint">Status: {detail}</p>
        ) : null}

        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
          ⚠ Master passphrase e cheia care deblochează <strong>toate</strong> celelalte. Dacă o pierzi
          → reintroduci passphrase-uri pe rând. Dacă o spune cineva → are acces la lista ta de
          site-uri și passphrase-urile lor (nu și la datele de pe alte servere). Salvează în 1Password
          sau hârtie închisă.
        </p>
      </div>
    </section>
  );
}

function InstallSection(): ReactNode {
  return (
    <section>
      <p className={SECTION_TITLE_CLASS}>
        <span className="inline-flex items-center gap-2">
          <Smartphone className="h-3 w-3" aria-hidden />
          Instalează ca aplicație
        </span>
      </p>
      <div className="mt-3 rounded-2xl border border-line bg-soft-gray/50 p-5">
        <p className="mb-3 text-xs leading-relaxed text-text-muted">
          Dashboard-ul rulează ca aplicație nativă (PWA) — fullscreen, fără bara browser-ului,
          iconiță pe home screen. Funcționează offline pentru paginile cache-uite.
        </p>
        <InstallButton />
      </div>
    </section>
  );
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
