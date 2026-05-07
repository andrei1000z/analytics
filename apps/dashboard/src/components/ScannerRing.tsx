import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type ScannerState = "idle" | "running" | "done";

const SIZE = 96;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function ScannerRing({
  state,
  label,
  className,
}: {
  state: ScannerState;
  label?: string | undefined;
  className?: string | undefined;
}): ReactNode {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          className={cn(
            "absolute inset-0",
            state === "running" ? "animate-[spin_1.2s_linear_infinite]" : "",
          )}
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-line"
          />
          {state !== "done" ? (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${CIRC * 0.28} ${CIRC}`}
              className="stroke-eu-blue dark:stroke-eu-blue-light"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ) : null}
          {state === "done" ? (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              className="stroke-emerald-500"
            />
          ) : null}
        </svg>
        {state === "done" ? (
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-emerald-500"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 24, mass: 0.6 }}
          >
            <Check className="h-8 w-8" strokeWidth={3} aria-hidden />
          </motion.div>
        ) : null}
      </div>
      <AnimatePresence mode="wait">
        {label ? (
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-xs font-medium text-text-muted"
          >
            {label}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
