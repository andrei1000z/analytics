import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import type { SyncStatus } from "@/store/useSessions";
import { cn } from "@/lib/cn";

const LABELS: Record<SyncStatus, string> = {
  idle: "În așteptare",
  connecting: "Conectare…",
  connected: "Live",
  offline: "Offline",
  error: "Eroare",
};

const DOT: Record<SyncStatus, string> = {
  idle: "bg-text-faint",
  connecting: "bg-eu-blue animate-pulse",
  connected: "bg-emerald-500",
  offline: "bg-amber-500",
  error: "bg-red-500",
};

export function StatusPill({ status }: { status: SyncStatus }): ReactNode {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-line bg-soft-elev/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted backdrop-blur-md"
      role="status"
      aria-label={`Sincronizare: ${LABELS[status]}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className={cn("absolute inset-0 rounded-full", DOT[status])} />
        {status === "connected" ? (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ping"
          />
        ) : null}
      </span>
      <ShieldCheck className="h-3 w-3" aria-hidden strokeWidth={2.2} />
      <span>E2E · {LABELS[status]}</span>
    </div>
  );
}
