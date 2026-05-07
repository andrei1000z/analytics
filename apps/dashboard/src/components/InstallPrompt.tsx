import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";

/**
 * Auto-show install prompt with non-annoying suppression:
 *
 *   • Already installed (display-mode: standalone)  → never show
 *   • "Mai târziu" / X / overlay click              → snooze 7 days
 *   • "Nu mai arăta"                                → snooze 1 year
 *   • iOS (no native prompt) shows on 2nd+ visit     → 4s after load
 *
 * Visit count + snooze deadline persist in localStorage. The toast pops
 * itself when `beforeinstallprompt` fires (Chrome / Edge / Samsung
 * Internet) — those browsers control their own engagement heuristic.
 */

const STORAGE_SNOOZE = "analytics:install-snooze-until";
const STORAGE_VISITS = "analytics:install-visits";
const SNOOZE_LATER = 7 * 24 * 60 * 60 * 1000;
const SNOOZE_DISMISS = 30 * 24 * 60 * 60 * 1000;
const SNOOZE_NEVER = 365 * 24 * 60 * 60 * 1000;
const IOS_DELAY_MS = 4000;
const IOS_MIN_VISITS = 2;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.platform) && !("MSStream" in window);
}

function isSnoozed(): boolean {
  const raw = window.localStorage.getItem(STORAGE_SNOOZE);
  if (!raw) return false;
  const until = Number(raw);
  if (!Number.isFinite(until)) return false;
  return until > Date.now();
}

function snooze(ms: number): void {
  window.localStorage.setItem(STORAGE_SNOOZE, String(Date.now() + ms));
}

/** Bumps the visit counter on every fresh page load and returns the new value. */
function bumpVisitCount(): number {
  const prev = Number(window.localStorage.getItem(STORAGE_VISITS) ?? "0");
  const next = (Number.isFinite(prev) ? prev : 0) + 1;
  window.localStorage.setItem(STORAGE_VISITS, String(next));
  return next;
}

export function InstallPrompt(): ReactNode {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    if (installed) return;
    if (isSnoozed()) return;

    const visits = bumpVisitCount();

    const onPrompt = (e: Event): void => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => {
      setInstalled(true);
      setEvent(null);
      setShowIos(false);
      // Once installed, snooze a long time so it never reappears even if the
      // user uninstalls and revisits within a year.
      snooze(SNOOZE_NEVER);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let iosTimer: number | null = null;
    if (isIOS() && visits >= IOS_MIN_VISITS) {
      iosTimer = window.setTimeout(() => setShowIos(true), IOS_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer !== null) window.clearTimeout(iosTimer);
    };
  }, [installed]);

  function later(): void {
    snooze(SNOOZE_LATER);
    setEvent(null);
    setShowIos(false);
  }

  function dismiss(): void {
    snooze(SNOOZE_DISMISS);
    setEvent(null);
    setShowIos(false);
  }

  function never(): void {
    snooze(SNOOZE_NEVER);
    setEvent(null);
    setShowIos(false);
  }

  async function install(): Promise<void> {
    if (!event) return;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        // appinstalled handler will fire, but snooze now in case it doesn't.
        snooze(SNOOZE_NEVER);
      } else {
        // User declined the native prompt → snooze 30 days
        snooze(SNOOZE_DISMISS);
      }
    } finally {
      setEvent(null);
    }
  }

  const visible = !installed && (event !== null || showIos);

  return (
    <AnimatePresence>
      {visible ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[55] flex justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className="glass-modal pointer-events-auto w-[min(24rem,92vw)] rounded-3xl p-4 shadow-glass dark:shadow-glass-dark"
            role="dialog"
            aria-label="Instalează Analytics"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
                {event ? (
                  <Download className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                ) : (
                  <Share2 className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold tracking-tight">Instalează Analytics</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
                  {event ? (
                    "Pornește instant ca aplicație nativă. Fără bară browser, offline-ready, cu icon pe home screen."
                  ) : (
                    <>
                      Pe iPhone: apasă{" "}
                      <span className="inline-flex items-center gap-0.5">
                        <Share2 className="inline h-3 w-3" aria-hidden /> Share
                      </span>{" "}
                      → <strong>Add to Home Screen</strong>.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-xl p-1 text-text-faint transition-colors hover:bg-soft-gray hover:text-text-main"
                aria-label="Închide (snooze 30 zile)"
                title="Închide"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {event ? (
                <>
                  <button
                    type="button"
                    onClick={later}
                    className="rounded-2xl border border-line bg-soft-elev px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:text-text-main"
                  >
                    Mai târziu
                  </button>
                  <button
                    type="button"
                    onClick={() => void install()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-eu-blue px-3 py-2 text-xs font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden /> Instalează acum
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={later}
                  className="flex-1 rounded-2xl border border-line bg-soft-elev px-3 py-2 text-xs font-medium text-text-main transition-colors hover:bg-soft-gray"
                >
                  Am înțeles
                </button>
              )}
              <button
                type="button"
                onClick={never}
                className="text-[10px] text-text-faint underline-offset-2 hover:text-text-muted hover:underline"
              >
                Nu mai arăta
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
