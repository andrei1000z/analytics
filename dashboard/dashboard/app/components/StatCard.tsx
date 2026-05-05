import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  accent?: "blue" | "violet" | "emerald" | "amber";
};

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  blue: "bg-accent-soft text-accent",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
};

export default function StatCard({
  label,
  value,
  helper,
  delta,
  deltaLabel,
  icon: Icon,
  accent = "blue",
}: StatCardProps) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentMap[accent]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        {typeof delta === "number" && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="mt-7 text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      {(helper || deltaLabel) && (
        <p className="mt-3 text-xs leading-relaxed text-gray-500">
          {helper ?? deltaLabel}
        </p>
      )}
    </div>
  );
}
