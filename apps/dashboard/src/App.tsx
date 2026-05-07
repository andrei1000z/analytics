import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "analytics:theme";

const SPRING_MODAL = {
  type: "spring" as const,
  stiffness: 360,
  damping: 30,
  mass: 0.85,
};

const SPRING_FAST = {
  type: "spring" as const,
  stiffness: 480,
  damping: 32,
  mass: 0.5,
};

function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setTheme];
}

export default function App(): ReactNode {
  const [theme, setTheme] = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  return (
    <div className="relative min-h-full overflow-hidden bg-soft-bg text-text-main">
      {/* Ambient depth blobs — picked up by glass surfaces above */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-eu-blue/[0.05] blur-3xl dark:bg-eu-blue-light/[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[22rem] w-[22rem] rounded-full bg-eu-yellow/[0.04] blur-3xl"
      />

      {/* Header */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-10 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-eu-blue text-white shadow-eu-glow">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
              EU · Zero-Knowledge
            </p>
            <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="inline-flex items-center gap-2 rounded-2xl border border-line bg-soft-elev px-3.5 py-2 text-sm font-medium text-text-main shadow-soft-1 transition-all hover:-translate-y-px hover:shadow-soft-2 md:px-4"
          aria-label={`Comută la tema ${theme === "light" ? "întunecată" : "luminoasă"}`}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" aria-hidden />
          ) : (
            <Sun className="h-4 w-4" aria-hidden />
          )}
          <span className="hidden md:inline">{theme === "light" ? "Dark" : "Light"}</span>
        </button>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-14 pb-10 md:px-8 md:pt-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_MODAL, delay: 0.05 }}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-eu-blue dark:text-eu-blue-light"
        >
          Phase 0 · Bootstrap
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_MODAL, delay: 0.1 }}
          className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          Liquid Glass 2026,
          <br />
          <span className="text-eu-blue dark:text-eu-blue-light">acordat la 120 Hz</span>.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_MODAL, delay: 0.15 }}
          className="mt-4 max-w-xl text-base leading-relaxed text-text-muted"
        >
          Tokeni de design + suprafețe de sticlă + tipografie Inter — toate verificate. Suveranitate
          europeană prin matematică, nu prin politică de confidențialitate.
        </motion.p>
      </section>

      {/* Token grid */}
      <section className="relative mx-auto grid max-w-6xl gap-5 px-6 pb-12 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        <PreviewCard delay={0.2} icon={Palette} title="Paletă" subtitle="Brand + tokeni semantici">
          <div className="mt-4 grid grid-cols-6 gap-2">
            <Swatch label="eu-blue" className="bg-eu-blue" />
            <Swatch label="600" className="bg-eu-blue-600" />
            <Swatch label="light" className="bg-eu-blue-light" />
            <Swatch label="dark" className="bg-eu-blue-dark" />
            <Swatch label="yellow" className="bg-eu-yellow" />
            <Swatch label="soft" className="bg-eu-yellow-soft" />
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            <Swatch label="bg" className="border border-line bg-soft-bg" />
            <Swatch label="gray" className="border border-line bg-soft-gray" />
            <Swatch label="elev" className="border border-line bg-soft-elev" />
            <Swatch label="line" className="bg-line" />
            <Swatch label="strong" className="bg-line-strong" />
            <Swatch label="good" className="bg-signal-good" />
          </div>
        </PreviewCard>

        <PreviewCard delay={0.25} icon={Type} title="Tipografie" subtitle="Inter, antialiased">
          <p className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight">
            120 Hz e regula casei.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Render compositor-only, fără reflow, fără spinners.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
            ctrl + k · paletă comenzi
          </p>
        </PreviewCard>

        <PreviewCard delay={0.3} icon={Layers} title="Suprafețe" subtitle="glass-card · shadow-glass">
          <div className="mt-4 grid gap-2">
            <div className="rounded-xl border border-line bg-soft-elev p-3 shadow-soft-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                soft-1
              </p>
              <p className="mt-1 text-sm">Card de listă</p>
            </div>
            <div className="rounded-xl border border-line bg-soft-elev p-3 shadow-soft-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                soft-2
              </p>
              <p className="mt-1 text-sm">Hover state</p>
            </div>
            <div className="rounded-xl bg-eu-blue/10 p-3 shadow-eu-glow dark:bg-eu-blue-light/10">
              <p className="text-[10px] font-medium uppercase tracking-wider text-eu-blue dark:text-eu-blue-light">
                eu-glow
              </p>
              <p className="mt-1 text-sm">Focus / activ</p>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          delay={0.35}
          icon={ShieldCheck}
          title="Privacy"
          subtitle="Zero-knowledge la nivel de bit"
        >
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text-muted">
            <PrivacyItem>Fără cookie-uri pe vizitator</PrivacyItem>
            <PrivacyItem>Fără IP la rest (24h max, hashed)</PrivacyItem>
            <PrivacyItem>AES-GCM 256 + PBKDF2 200k</PrivacyItem>
            <PrivacyItem>Hetzner DE / Scaleway FR / OVH</PrivacyItem>
          </ul>
        </PreviewCard>

        <PreviewCard delay={0.4} icon={Zap} title="Performanță" subtitle="120 Hz contract">
          <div className="mt-4 grid grid-cols-3 gap-2">
            <KPI label="paint" value="<8ms" />
            <KPI label="tracker" value="≤1KB" />
            <KPI label="motion" value="≤6/scr" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            Compositor-only animations. Fără layout thrash. Fără spinners pentru date cache-uite.
          </p>
        </PreviewCard>

        <PreviewCard
          delay={0.45}
          icon={Sparkles}
          title="Modal demo"
          subtitle="glass-modal · spring 360/30"
        >
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Apasă pentru a verifica suprafața de sticlă (backdrop-blur-3xl + bg-white/65) și
            tranziția spring. <kbd className="font-mono text-[11px] text-text-faint">Esc</kbd>{" "}
            închide.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
          >
            <Sparkles className="h-4 w-4" aria-hidden /> Deschide modal
          </button>
        </PreviewCard>
      </section>

      {/* Footer */}
      <footer className="relative mx-auto max-w-6xl px-6 pb-12 text-center md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
          Phase 0 · v0.1.0 · React 19 · Vite 7 · Tailwind 3.4 · framer-motion 12
        </p>
      </footer>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen ? (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="glass-overlay fixed inset-0 z-40"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={SPRING_FAST}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="glass-modal fixed left-1/2 top-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
                    <ShieldCheck className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                      Verificare
                    </p>
                    <h3 id="modal-title" className="text-lg font-semibold tracking-tight">
                      Glass-modal funcționează
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl p-1.5 text-text-muted transition-colors hover:bg-soft-gray hover:text-text-main"
                  aria-label="Închide"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-text-muted">
                Backdrop-blur-3xl peste blob-urile ambientale. Hairline border. Multi-layer shadow.
                Spring fast (480/32). <kbd className="font-mono text-[11px]">Esc</kbd> sau click pe
                fundal pentru închidere.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-2xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm font-medium text-text-main backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-2xl bg-eu-blue px-4 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:bg-eu-blue-light"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  subtitle,
  children,
  delay,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
  delay: number;
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING_MODAL, delay }}
      className="glass-card rounded-3xl p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
          <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
            {subtitle}
          </p>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Swatch({ label, className }: { label: string; className: string }): ReactNode {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-9 w-full rounded-lg ${className}`} />
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-faint">{label}</span>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-xl border border-line bg-soft-gray p-2.5 text-center">
      <p className="text-base font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-text-faint">{label}</p>
    </div>
  );
}

function PrivacyItem({ children }: { children: ReactNode }): ReactNode {
  return (
    <li className="flex items-center gap-2">
      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-signal-good" aria-hidden />
      {children}
    </li>
  );
}
