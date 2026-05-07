import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Download, Smartphone } from "lucide-react";

type Choice = { outcome: "accepted" | "dismissed"; platform: string };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<Choice>;
};

const IOS = /iPhone|iPad|iPod/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");

/**
 * Manual install button — Chrome's automatic toast doesn't always fire on
 * Android (engagement heuristics). This gives the operator a deterministic
 * way to install the dashboard as a PWA. iOS has no programmatic install
 * API, so we surface the native "Share → Add to Home Screen" hint instead.
 */
export function InstallButton(): ReactNode {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPrompt = (e: Event): void => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => {
      setInstalled(true);
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function trigger(): Promise<void> {
    if (IOS) {
      setShowIosHint((s) => !s);
      return;
    }
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setEvent(null);
  }

  if (installed) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
        <Smartphone className="h-3.5 w-3.5" aria-hidden /> Aplicația e deja instalată
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void trigger()}
        disabled={!IOS && !event}
        className="inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-4 py-2 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        <Download className="h-4 w-4" aria-hidden />
        {IOS ? "Cum instalez pe iPhone" : "Instalează aplicația"}
      </button>
      {!IOS && !event ? (
        <p className="text-[11px] leading-relaxed text-text-faint">
          Browser-ul tău nu a oferit încă invitația de instalare. Pe Chrome
          Android: meniul ⋮ → "Install app". Pe Edge desktop: bara de adresă →
          icon „+" pe partea dreaptă.
        </p>
      ) : null}
      {showIosHint ? (
        <div className="rounded-2xl border border-line bg-soft-gray/50 p-3 text-[11px] leading-relaxed text-text-muted">
          Pe iPhone, în <strong>Safari</strong> (NU Chrome): apasă butonul{" "}
          <strong>Share</strong> (📤 jos) → scroll → <strong>Add to Home Screen</strong>.
        </div>
      ) : null}
    </div>
  );
}
