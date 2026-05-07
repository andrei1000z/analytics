import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCcw, X } from "lucide-react";

/**
 * Service-worker update detector. When vite-plugin-pwa swaps in a new SW
 * (autoUpdate + skipWaiting), the bundle the user is viewing is already
 * stale. We surface a toast that lets them refresh on demand instead of
 * waiting for them to figure out Ctrl+Shift+R.
 */

type UpdateRegistration = ServiceWorkerRegistration & {
  waiting?: ServiceWorker | null;
  installing?: ServiceWorker | null;
};

export function ReloadPrompt(): ReactNode {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<UpdateRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (cancelled || !reg) return;
      const r = reg as UpdateRegistration;
      setRegistration(r);
      if (r.waiting) {
        setUpdateAvailable(true);
      }
      r.addEventListener("updatefound", () => {
        const next = r.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (
            next.state === "installed" &&
            navigator.serviceWorker.controller !== null
          ) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    const onControllerChange = (): void => {
      // New SW took control — full reload guarantees fresh HTML + assets.
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  function applyUpdate(): void {
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <AnimatePresence>
      {updateAvailable ? (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className="glass-modal pointer-events-auto inline-flex w-[min(28rem,94vw)] items-center gap-3 rounded-3xl px-4 py-3 shadow-glass dark:shadow-glass-dark"
            role="status"
          >
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
              <RefreshCcw className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold tracking-tight">Versiune nouă disponibilă</p>
              <p className="text-[11px] leading-relaxed text-text-muted">
                Reîncarcă pentru a aplica ultimele schimbări.
              </p>
            </div>
            <button
              type="button"
              onClick={applyUpdate}
              className="rounded-xl bg-eu-blue px-3 py-1.5 text-xs font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
            >
              Reîncarcă
            </button>
            <button
              type="button"
              onClick={() => setUpdateAvailable(false)}
              className="rounded-xl p-1 text-text-faint transition-colors hover:bg-soft-gray hover:text-text-main"
              aria-label="Mai târziu"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
