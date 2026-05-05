"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { RANGES, type RangeKey } from "../lib/dashboardData";

const ORDER: RangeKey[] = ["today", "7d", "30d"];

export default function RangeSelector({ active }: { active: RangeKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pick(key: RangeKey) {
    const next = new URLSearchParams(params.toString());
    if (key === "7d") next.delete("range");
    else next.set("range", key);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border bg-white p-1 shadow-[var(--shadow-card)] ${
        pending ? "opacity-70" : ""
      }`}
    >
      <span className="hidden md:flex items-center gap-1.5 pl-3 pr-2 text-xs font-medium text-gray-500">
        <Calendar className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
        Interval
      </span>
      {ORDER.map((key) => {
        const meta = RANGES[key];
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => pick(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium tracking-tight transition-colors ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {meta.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
