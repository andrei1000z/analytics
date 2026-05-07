import type { ReactNode } from "react";
import { Map } from "lucide-react";
import { TopList } from "./TopList";

export function RegionBreakdown({
  regions,
}: {
  regions: ReadonlyArray<{ code: string; name: string; views: number }>;
}): ReactNode {
  return (
    <TopList
      title="Regiuni · Top EU"
      icon={Map}
      items={regions}
      labelOf={(r) => (
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-4 w-6 items-center justify-center rounded-md border border-line bg-soft-elev font-mono text-[9px] uppercase tracking-wider text-text-muted">
            {r.code}
          </span>
          <span className="truncate">{r.name}</span>
        </span>
      )}
      emptyText="Nicio regiune detectată"
    />
  );
}
