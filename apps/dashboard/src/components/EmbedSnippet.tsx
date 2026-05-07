import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmbedSnippet({
  trackerUrl,
  keyHex,
  roomId,
  className,
}: {
  trackerUrl: string;
  keyHex: string;
  roomId: string;
  className?: string | undefined;
}): ReactNode {
  const [copied, setCopied] = useState(false);
  const ready = trackerUrl.trim().length > 0 && keyHex.length > 0 && roomId.length === 64;

  const snippet = ready
    ? `<script\n  src="${trackerUrl.replace(/\/+$/, "")}/t.js#${keyHex}"\n  data-site="${roomId}"\n  defer\n></script>`
    : `<!-- Configurează trackerUrl în Setări sau deblochează site-ul cu passphrase. -->`;

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  return (
    <div
      className={cn(
        "glass-card relative rounded-3xl p-5",
        !ready ? "border-dashed" : "",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-3.5 w-3.5 text-eu-blue dark:text-eu-blue-light"
            aria-hidden
          />
          <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Snippet · embed pe site
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!ready}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-line bg-soft-elev px-2.5 py-1.5 text-xs font-medium shadow-soft-1 transition-all",
            ready
              ? "text-text-main hover:-translate-y-px hover:shadow-soft-2"
              : "cursor-not-allowed opacity-60",
            copied ? "text-emerald-600 dark:text-emerald-400" : "",
          )}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copiat" : "Copiază"}
        </button>
      </div>

      <pre className="mt-3 overflow-x-auto rounded-2xl border border-line bg-soft-gray/60 px-4 py-3 font-mono text-[11px] leading-relaxed text-text-main">
        <code>{snippet}</code>
      </pre>

      <p className="mt-3 text-[11px] leading-relaxed text-text-faint">
        Cheia AES-GCM 256 trăiește doar în <span className="font-mono">#fragment</span> — niciun
        request nu o trimite către server. Server-ul stochează doar ciphertext + bucket orar.
        Adaugă <span className="font-mono">integrity="sha384-…"</span> + <span className="font-mono">crossorigin="anonymous"</span> pentru SRI după primul deploy de tracker.
      </p>
    </div>
  );
}
