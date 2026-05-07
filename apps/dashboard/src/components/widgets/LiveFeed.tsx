import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Globe, Laptop2, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/cn";

type Event = { path: string; referrer: string; ts: number; viewport: [number, number] };

function deviceIcon(viewportWidth: number): typeof Laptop2 {
  if (viewportWidth >= 1024) return Laptop2;
  if (viewportWidth >= 600) return Tablet;
  return Smartphone;
}

function relativeShort(ms: number, now: number): string {
  const diff = Math.max(0, now - ms);
  if (diff < 1000) return "acum";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}z`;
}

export function LiveFeed({ events }: { events: ReadonlyArray<Event> }): ReactNode {
  // Re-render every 5s to refresh "acum/3s/12s" labels
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, []);
  void tick;
  const now = Date.now();

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Feed live
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-text-faint">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ping"
            />
          </span>
          {events.length} recente
        </span>
      </div>
      {events.length === 0 ? (
        <p className="mt-4 text-xs text-text-faint">
          Niciun eveniment recent. Așteptăm primul pageview.
        </p>
      ) : (
        <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {events.map((e) => {
              const Icon = deviceIcon(e.viewport[0]);
              return (
                <motion.li
                  key={`${e.ts}-${e.path}`}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors",
                    "hover:bg-soft-gray/60",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-none text-text-faint" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-main">
                    {e.path}
                  </span>
                  {e.referrer ? (
                    <span className="hidden items-center gap-1 truncate text-[11px] text-text-faint sm:inline-flex">
                      <Globe className="h-3 w-3" aria-hidden />
                      {e.referrer}
                    </span>
                  ) : null}
                  <span className="flex-none font-mono text-[10px] uppercase tracking-wider text-text-faint">
                    {relativeShort(e.ts, now)}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
