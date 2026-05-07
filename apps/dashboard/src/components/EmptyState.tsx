import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Kbd } from "./Kbd";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  hint?: ReactNode;
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
      className="flex h-full w-full items-center justify-center px-8"
    >
      <div className="max-w-sm text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-soft-gray/80 shadow-soft-1 backdrop-blur-md">
          <Icon className="h-6 w-6 text-eu-blue dark:text-eu-blue-light" strokeWidth={1.7} aria-hidden />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-5 py-3 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
          >
            {action.icon ? <action.icon className="h-4 w-4" aria-hidden /> : null}
            {action.label}
          </button>
        ) : null}
        {hint ? (
          <p className="mt-6 inline-flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
            {hint}
          </p>
        ) : (
          <p className="mt-6 inline-flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <span>· paletă comenzi</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
