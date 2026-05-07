import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eye, EyeOff, Lock, ShieldCheck, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSessions } from "@/store/useSessions";
import { deriveKeys } from "@/sync/crypto";
import { cn } from "@/lib/cn";

const SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.8,
};

export function UnlockSiteModal(): ReactNode {
  const unlockSiteId = useStore((s) => s.unlockSiteId);
  const setUnlockSiteId = useStore((s) => s.setUnlockSiteId);
  const sites = useStore((s) => s.sites);
  const unlock = useSessions((s) => s.unlock);

  const [passphrase, setPassphrase] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const site = unlockSiteId ? sites[unlockSiteId] : undefined;
  const open = unlockSiteId !== null && site !== undefined;

  useEffect(() => {
    if (!open) return;
    setPassphrase("");
    setShow(false);
    setBusy(false);
    setError(null);
  }, [open, unlockSiteId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        setUnlockSiteId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setUnlockSiteId]);

  async function onSubmit(): Promise<void> {
    if (!site || passphrase.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const { roomId, siteKey, keyHex } = await deriveKeys(passphrase);
      if (roomId !== site.roomId) {
        setError("Passphrase greșit pentru acest site.");
        return;
      }
      unlock(site.id, { passphrase, siteKey, keyHex, roomId });
      setUnlockSiteId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Derivare eșuată");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && site ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="glass-overlay fixed inset-0 z-[60]"
            onClick={() => setUnlockSiteId(null)}
          />
          <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center p-4">
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={SPRING}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-title"
            className="glass-modal pointer-events-auto w-[min(28rem,92vw)] rounded-3xl p-7"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
                <Lock className="h-5 w-5" strokeWidth={2.2} aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  Deblochează
                </p>
                <h2 id="unlock-title" className="mt-1 text-lg font-semibold tracking-tight">
                  {site.name}
                </h2>
                <p className="mt-0.5 truncate text-xs text-text-faint">{site.domain}</p>
              </div>
              <button
                type="button"
                onClick={() => setUnlockSiteId(null)}
                className="rounded-xl p-1.5 text-text-muted transition-colors hover:bg-soft-gray hover:text-text-main"
                aria-label="Închide"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Introdu passphrase-ul pentru a derivă cheia AES local și pentru a porni stream-ul
              de evenimente live de pe ingest.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                type={show ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmit();
                }}
                placeholder="passphrase E2E…"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                className={cn(
                  "flex-1 rounded-xl border border-line bg-soft-elev px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-faint shadow-soft-1 transition-colors focus:border-eu-blue/40 focus:outline-none focus:ring-2 focus:ring-eu-blue/15",
                )}
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
            </div>

            {error ? (
              <div className="mt-3 inline-flex items-start gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 flex-none"
                  strokeWidth={2.2}
                  aria-hidden
                />
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setUnlockSiteId(null)}
                className="flex-1 rounded-2xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm font-medium text-text-main backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={passphrase.length < 4 || busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-eu-blue px-4 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {busy ? "Verificare…" : "Deblochează"}
              </button>
            </div>
          </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
