import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSessions } from "@/store/useSessions";
import { deriveKeys } from "@/sync/crypto";
import { entropyBits, generatePassphrase } from "@/sync/passphrase";
import { EmbedSnippet } from "./EmbedSnippet";
import { cn } from "@/lib/cn";

const SPRING = {
  type: "spring" as const,
  stiffness: 360,
  damping: 30,
  mass: 0.85,
};

type Step = "form" | "embed";

export function CreateSiteModal(): ReactNode {
  const open = useStore((s) => s.createOpen);
  const setOpen = useStore((s) => s.setCreateOpen);
  const createSite = useStore((s) => s.createSite);
  const trackerUrl = useStore((s) => s.trackerUrl);
  const ingestUrl = useStore((s) => s.ingestUrl);
  const unlockSession = useSessions((s) => s.unlock);

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSnippet, setCreatedSnippet] = useState<{
    siteId: string;
    roomId: string;
    keyHex: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setName("");
    setDomain("");
    setPassphrase(generatePassphrase());
    setShow(false);
    setBusy(false);
    setError(null);
    setCreatedSnippet(null);
    setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const bits = useMemo(() => entropyBits(passphrase), [passphrase]);
  const trackerHost = trackerUrl.trim() || ingestUrl.trim();
  const valid = name.trim().length > 0 && domain.trim().length > 2 && passphrase.length >= 8;

  async function copyPass(): Promise<void> {
    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  async function onSubmit(): Promise<void> {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const { roomId, siteKey, keyHex } = await deriveKeys(passphrase);
      const siteId = createSite({
        name: name.trim(),
        domain: domain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""),
        roomId,
      });
      unlockSession(siteId, { passphrase, siteKey, keyHex, roomId });
      setCreatedSnippet({ siteId, roomId, keyHex });
      setStep("embed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Derivare eșuată");
    } finally {
      setBusy(false);
    }
  }

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
            className="glass-overlay fixed inset-0 z-[60]"
            onClick={() => setOpen(false)}
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
            aria-labelledby="create-site-title"
            className="glass-modal pointer-events-auto w-[min(36rem,94vw)] overflow-hidden rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/20 px-7 pt-6 pb-5 dark:border-white/10">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  {step === "form" ? "Site nou" : "Site creat"}
                </p>
                <h2 id="create-site-title" className="mt-1 text-xl font-bold tracking-tight">
                  {step === "form" ? "Adaugă un site" : "Embed snippet-ul pe site"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-1.5 text-text-muted transition-colors hover:bg-soft-gray hover:text-text-main"
                aria-label="Închide"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-7 py-6">
              {step === "form" ? (
                <div className="space-y-5">
                  <Field label="Nume" hint="Cum apare în sidebar.">
                    <input
                      type="text"
                      placeholder="ex. Acme Public"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Domeniu" hint="Fără https://">
                    <div className="relative">
                      <Globe
                        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint"
                        aria-hidden
                      />
                      <input
                        type="text"
                        placeholder="acme.eu"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        spellCheck={false}
                        autoCapitalize="none"
                        className={cn(INPUT_CLASS, "pl-9")}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Passphrase E2E"
                    hint={
                      <>
                        Derivă <span className="font-mono">roomId</span> + cheie AES-GCM 256
                        local. Niciodată trimisă pe server. Re-introdu după reload.
                      </>
                    }
                  >
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type={show ? "text" : "password"}
                          value={passphrase}
                          onChange={(e) => setPassphrase(e.target.value)}
                          spellCheck={false}
                          autoCapitalize="none"
                          autoCorrect="off"
                          className={cn(INPUT_CLASS, "flex-1 font-mono")}
                        />
                        <IconButton
                          onClick={() => setShow((s) => !s)}
                          label={show ? "Ascunde" : "Arată"}
                        >
                          {show ? (
                            <EyeOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden />
                          )}
                        </IconButton>
                        <IconButton
                          onClick={() => setPassphrase(generatePassphrase())}
                          label="Generează altul"
                        >
                          <RefreshCcw className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton onClick={() => void copyPass()} label="Copiază">
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-500" aria-hidden />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden />
                          )}
                        </IconButton>
                      </div>
                      <EntropyMeter bits={bits} />
                    </div>
                  </Field>

                  <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 flex-none"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    <p>
                      <strong>Salvează passphrase-ul acum.</strong> Pe reload se șterge din
                      memorie — fără el, datele criptate de pe server sunt indecodabile.
                      Pierderea passphrase-ului = pierderea datelor (e garanția zero-knowledge,
                      nu un bug).
                    </p>
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === "embed" && createdSnippet ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                    <p className="inline-flex items-center gap-1.5 font-semibold">
                      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Site creat
                      și deblocat
                    </p>
                    <p className="mt-1 text-text-muted">
                      Conexiunea către ingest pornește automat în fundal când
                      <span className="mx-1 font-mono">ingestUrl</span>e setat în Setări.
                      Embed snippet-ul mai jos pe site-ul tău și primele evenimente vor apărea
                      live.
                    </p>
                  </div>

                  <EmbedSnippet
                    trackerUrl={trackerHost}
                    ingestUrl={ingestUrl}
                    keyHex={createdSnippet.keyHex}
                    roomId={createdSnippet.roomId}
                  />

                  {!trackerHost ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠ Setează <span className="font-mono">trackerUrl</span> sau
                      <span className="font-mono">ingestUrl</span>
                      în Setări ca snippet-ul să fie complet.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/20 px-7 py-4 dark:border-white/10">
              {step === "form" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm font-medium text-text-main backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    Anulează
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSubmit()}
                    disabled={!valid || busy}
                    className="inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    {busy ? "Derivare PBKDF2…" : "Creează & deblochează"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
                >
                  Gata
                </button>
              )}
            </div>
          </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

const INPUT_CLASS =
  "block w-full rounded-xl border border-line bg-soft-elev px-3 py-2 text-sm text-text-main placeholder:text-text-faint shadow-soft-1 transition-colors focus:border-eu-blue/40 focus:outline-none focus:ring-2 focus:ring-eu-blue/15";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-text-faint">{hint}</p>
    </label>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-line bg-soft-elev px-3 text-text-muted transition-colors hover:text-text-main"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function EntropyMeter({ bits }: { bits: number }): ReactNode {
  const pct = Math.max(8, Math.min(100, (bits / 100) * 100));
  const tone =
    bits < 40
      ? "bg-red-500"
      : bits < 60
        ? "bg-amber-500"
        : bits < 80
          ? "bg-eu-blue dark:bg-eu-blue-light"
          : "bg-emerald-500";
  const label =
    bits < 40 ? "Slab" : bits < 60 ? "Acceptabil" : bits < 80 ? "Bun" : "Foarte bun";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-soft-gray">
        <div
          className={cn("h-full transition-all", tone)}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">
        {bits.toFixed(0)} biți · {label}
      </span>
    </div>
  );
}
