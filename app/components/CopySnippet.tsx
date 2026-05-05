"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Copy } from "lucide-react";

export default function CopySnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      } else {
        const el = document.createElement("textarea");
        el.value = snippet;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-canvas p-1.5">
      <div className="flex items-start gap-3 rounded-[20px] bg-gray-900 px-5 py-4">
        <Code2
          className="mt-1 h-4 w-4 shrink-0 text-gray-400"
          strokeWidth={2}
        />
        <pre className="flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-gray-100">
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          onClick={copy}
          className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors ${
            copied
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
          aria-label="Copiază snippet"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Copiat!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
              Copiază
            </>
          )}
        </button>
      </div>
    </div>
  );
}
