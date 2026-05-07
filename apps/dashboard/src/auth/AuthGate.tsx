import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Fingerprint, KeyRound, Lock, ShieldCheck, Unlock } from "lucide-react";
import {
  authenticatePasskey,
  clearPasskey,
  hasPasskey,
  isPasskeySupported,
  registerPasskey,
} from "./passkey";

const SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

type GateMode = "register" | "login" | "unsupported";

export function AuthGate({ children }: { children: ReactNode }): ReactNode {
  const [authenticated, setAuthenticated] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    void isPasskeySupported().then(setSupported);
  }, []);

  if (authenticated || bypass) return <>{children}</>;
  if (supported === null) return null; // brief moment before the capability check resolves

  const mode: GateMode = !supported ? "unsupported" : hasPasskey() ? "login" : "register";

  async function onRegister(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await registerPasskey();
      await authenticatePasskey();
      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare necunoscută");
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await authenticatePasskey();
      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare necunoscută");
    } finally {
      setBusy(false);
    }
  }

  function onResetCredential(): void {
    clearPasskey();
    setError(null);
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-soft-bg text-text-main">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-eu-blue/[0.05] blur-3xl dark:bg-eu-blue-light/[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[22rem] w-[22rem] rounded-full bg-eu-yellow/[0.04] blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        className="glass-card relative z-10 w-[min(28rem,92vw)] rounded-3xl p-7"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-eu-blue text-white shadow-eu-glow">
            {mode === "login" ? (
              <Lock className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            ) : mode === "register" ? (
              <Fingerprint className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            ) : (
              <KeyRound className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            )}
          </div>
          <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
            {mode === "login" ? "Sesiune nouă" : mode === "register" ? "Bun venit" : "Avertisment"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {mode === "login"
              ? "Unlock cu passkey"
              : mode === "register"
                ? "Înregistrează un passkey"
                : "Passkey nedisponibil"}
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
            {mode === "login"
              ? "Touch ID / Windows Hello / cheia ta de securitate vor confirma că ești tu — fără parolă, fără server."
              : mode === "register"
                ? "Înregistrează un passkey local pentru a unlock-a dashboard-ul de fiecare dată. Cheia rămâne pe dispozitivul tău."
                : "Browser-ul actual nu expune un autentificator platformă. Poți continua fără passkey, dar dashboard-ul nu va mai fi protejat la nivel de sesiune."}
          </p>
        </div>

        <div className="mt-7 space-y-2">
          {mode === "login" ? (
            <>
              <button
                type="button"
                onClick={() => void onUnlock()}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-eu-blue px-5 py-3 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Unlock className="h-4 w-4" aria-hidden />
                {busy ? "Se așteaptă autentificarea…" : "Unlock"}
              </button>
              <button
                type="button"
                onClick={onResetCredential}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-soft-elev px-5 py-2.5 text-xs font-medium text-text-muted shadow-soft-1 transition-all hover:-translate-y-px hover:text-text-main"
              >
                Resetează passkey-ul · înregistrează altul
              </button>
            </>
          ) : mode === "register" ? (
            <>
              <button
                type="button"
                onClick={() => void onRegister()}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-eu-blue px-5 py-3 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Fingerprint className="h-4 w-4" aria-hidden />
                {busy ? "Așteaptă autentificatorul…" : "Înregistrează passkey"}
              </button>
              <button
                type="button"
                onClick={() => setBypass(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-soft-elev px-5 py-2.5 text-xs font-medium text-text-muted shadow-soft-1 transition-all hover:-translate-y-px hover:text-text-main"
              >
                Continuă fără passkey (nerecomandat)
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBypass(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-eu-blue px-5 py-3 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
            >
              Continuă oricum
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div className="mt-6 inline-flex w-full items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-text-faint">
          <ShieldCheck className="h-3 w-3" aria-hidden /> WebAuthn local · zero server
        </div>
      </motion.div>
    </div>
  );
}
