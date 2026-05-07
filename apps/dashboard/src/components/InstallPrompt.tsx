import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";

const STORAGE_KEY = "analytics:install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ("standalone" in navigator) {
    const nav = navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
  }
  return false;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.platform) && !("MSStream" in window);
}

export function InstallPrompt(): ReactNode {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(() => {
    if (isStandalone()) return true;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (hidden) return;
    const onPrompt = (e: Event): void => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (isIOS() && !isStandalone()) {
      const t = window.setTimeout(() => setShowIos(true), 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.clearTimeout(t);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [hidden]);

  function dismiss(): void {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setEvent(null);
    setShowIos(false);
    setHidden(true);
  }

  async function install(): Promise<void> {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") dismiss();
    setEvent(null);
  }

  const visible = !hidden && (event !== null || showIos);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
          className="glass-modal fixed bottom-4 left-1/2 z-[55] w-[min(22rem,92vw)] -translate-x-1/2 rounded-3xl p-4 shadow-glass dark:shadow-glass-dark"
          role="dialog"
          aria-label="Instalează Analytics"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
              {event ? (
                <Download className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              ) : (
                <Share2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold tracking-tight">Instalează Analytics</p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                {event ? (
                  "Adaugă PWA-ul pe ecranul principal — pornește offline-first, fără filă de browser."
                ) : (
                  <>
                    Apasă <span className="inline-flex items-center gap-0.5"><Share2 className="inline h-3 w-3" aria-hidden /> Share</span> apoi „Adaugă pe ecran".
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl p-1 text-text-faint transition-colors hover:bg-soft-gray hover:text-text-main"
              aria-label="Ascunde"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {event ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 rounded-2xl border border-line bg-soft-elev px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:text-text-main"
              >
                Mai târziu
              </button>
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-eu-blue px-3 py-2 text-xs font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> Instalează
              </button>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
