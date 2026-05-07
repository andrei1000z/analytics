import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export type ConfirmTone = "default" | "danger";

const SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.8,
};

export function ConfirmDialog({
  open,
  tone = "default",
  title,
  description,
  confirmLabel,
  cancelLabel = "Anulează",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  tone?: ConfirmTone;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}): ReactNode {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

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
            onClick={onCancel}
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={SPRING}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="glass-modal fixed left-1/2 top-1/2 z-[70] w-[min(26rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-7"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 flex-none items-center justify-center rounded-2xl",
                  tone === "danger"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light",
                )}
              >
                {tone === "danger" ? (
                  <AlertTriangle className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                ) : (
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                )}
              </div>
              <div className="flex-1">
                <h3 id="confirm-title" className="text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <div className="mt-2 text-sm leading-relaxed text-text-muted">{description}</div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-2xl border border-white/30 bg-white/50 px-4 py-2.5 text-sm font-medium text-text-main backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  "flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px",
                  tone === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-eu-blue hover:bg-eu-blue-light",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
