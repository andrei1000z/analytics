import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Range } from "@/cache/types";
import { cn } from "@/lib/cn";

const OPTIONS: ReadonlyArray<{ value: Range; label: string }> = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 zile" },
  { value: "30d", label: "30 zile" },
  { value: "90d", label: "90 zile" },
];

export function RangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (next: Range) => void;
}): ReactNode {
  return (
    <div
      className="inline-flex gap-1 rounded-2xl border border-line bg-soft-gray p-1"
      role="tablist"
      aria-label="Interval de timp"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="relative inline-flex items-center justify-center rounded-xl px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:text-text-main"
          >
            {active ? (
              <motion.span
                layoutId="range-pill"
                className="absolute inset-0 rounded-xl bg-soft-elev shadow-soft-1"
                transition={{ type: "spring", stiffness: 480, damping: 32, mass: 0.5 }}
              />
            ) : null}
            <span className={cn("relative z-10", active ? "text-text-main" : "")}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
