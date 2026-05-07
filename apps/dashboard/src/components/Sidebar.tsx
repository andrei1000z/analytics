import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Globe,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Collection, Site, SyncStatus } from "@/store/useStore";
import { Kbd } from "./Kbd";
import { StatusPill } from "./StatusPill";
import { isAppleDevice } from "@/hooks/useHotkeys";
import { cn } from "@/lib/cn";

export function Sidebar({ syncStatus }: { syncStatus: SyncStatus }): ReactNode {
  const sitesMap = useStore((s) => s.sites);
  const collectionsMap = useStore((s) => s.collections);
  const activeSiteId = useStore((s) => s.activeSiteId);
  const selectSite = useStore((s) => s.selectSite);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setConfirmIntent = useStore((s) => s.setConfirmIntent);
  const toggleCollection = useStore((s) => s.toggleCollection);
  const createSite = useStore((s) => s.createSite);

  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const collections: Collection[] = Object.values(collectionsMap).sort((a, b) =>
      a.name.localeCompare(b.name, "ro"),
    );
    const sitesByCollection = new Map<string, Site[]>();
    const orphans: Site[] = [];
    const lcQuery = query.trim().toLowerCase();

    for (const site of Object.values(sitesMap)) {
      if (lcQuery) {
        const hay = `${site.name} ${site.domain}`.toLowerCase();
        if (!hay.includes(lcQuery)) continue;
      }
      if (site.collectionId && collectionsMap[site.collectionId]) {
        const arr = sitesByCollection.get(site.collectionId) ?? [];
        arr.push(site);
        sitesByCollection.set(site.collectionId, arr);
      } else {
        orphans.push(site);
      }
    }

    const sortByName = (a: Site, b: Site): number => a.name.localeCompare(b.name, "ro");
    for (const [k, arr] of sitesByCollection) {
      arr.sort(sortByName);
      sitesByCollection.set(k, arr);
    }
    orphans.sort(sortByName);

    return { collections, sitesByCollection, orphans };
  }, [sitesMap, collectionsMap, query]);

  const modLabel = isAppleDevice ? "⌘" : "Ctrl";

  return (
    <aside
      className={cn(
        "glass-card relative z-10 flex h-full w-full flex-col rounded-none border-r border-line md:w-72 md:rounded-none",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-eu-blue text-white shadow-eu-glow">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-muted">
              EU · ZK
            </p>
            <h1 className="text-sm font-bold tracking-tight">Analytics</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const n = Object.keys(sitesMap).length + 1;
            createSite({ name: `Site #${n}`, domain: `site-${n}.eu` });
          }}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-soft-elev p-1.5 text-text-muted shadow-soft-1 transition-all hover:-translate-y-px hover:text-eu-blue hover:shadow-soft-2 dark:hover:text-eu-blue-light"
          aria-label="Site nou"
          title="Site nou"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-line bg-soft-gray/60 px-3 py-2 text-left text-xs text-text-muted shadow-soft-1 transition-all hover:-translate-y-px hover:bg-soft-gray hover:shadow-soft-2"
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          <span className="flex-1">Caută…</span>
          <span className="inline-flex items-center gap-1">
            <Kbd>{modLabel}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <div className="mt-2">
          <label className="sr-only" htmlFor="sidebar-filter">
            Filtrează site-urile
          </label>
          <input
            id="sidebar-filter"
            type="text"
            placeholder="Filtrează site-urile…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-line bg-soft-elev px-3 py-1.5 text-xs text-text-main placeholder:text-text-faint shadow-soft-1 transition-colors focus:border-eu-blue/40 focus:outline-none focus:ring-2 focus:ring-eu-blue/15"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-3 pb-3">
        {grouped.collections.map((col) => {
          const sites = grouped.sitesByCollection.get(col.id) ?? [];
          if (!sites.length && query.trim()) return null;
          return (
            <div key={col.id} className="mb-2">
              <button
                type="button"
                onClick={() => toggleCollection(col.id)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted transition-colors hover:bg-soft-gray/60"
              >
                {col.expanded ? (
                  <ChevronDown className="h-3 w-3" aria-hidden />
                ) : (
                  <ChevronRight className="h-3 w-3" aria-hidden />
                )}
                <FolderKanban className="h-3 w-3" aria-hidden />
                <span className="flex-1 truncate text-left">{col.name}</span>
                <span className="text-text-faint">{sites.length}</span>
              </button>
              {col.expanded ? (
                <ul className="mt-0.5 space-y-0.5">
                  {sites.map((site) => (
                    <SiteRow
                      key={site.id}
                      site={site}
                      active={site.id === activeSiteId}
                      onSelect={() => selectSite(site.id)}
                      onDelete={() => setConfirmIntent({ kind: "delete-site", siteId: site.id })}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}

        {grouped.orphans.length > 0 ? (
          <div className="mb-2">
            <p className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-text-faint">
              Site-uri
            </p>
            <ul className="space-y-0.5">
              {grouped.orphans.map((site) => (
                <SiteRow
                  key={site.id}
                  site={site}
                  active={site.id === activeSiteId}
                  onSelect={() => selectSite(site.id)}
                  onDelete={() => setConfirmIntent({ kind: "delete-site", siteId: site.id })}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {grouped.collections.length === 0 && grouped.orphans.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-text-muted">
              {query.trim() ? `Nimic pentru „${query}".` : "Niciun site încă."}
            </p>
          </div>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-line bg-soft-gray/40 px-3 py-2.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex items-center justify-center rounded-xl p-1.5 text-text-muted transition-colors hover:bg-soft-elev hover:text-text-main"
          aria-label="Deschide setările"
          title="Setări"
        >
          <SettingsIcon className="h-4 w-4" aria-hidden />
        </button>
        <StatusPill status={syncStatus} />
      </footer>
    </aside>
  );
}

function SiteRow({
  site,
  active,
  onSelect,
  onDelete,
}: {
  site: Site;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}): ReactNode {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition-all",
          active
            ? "bg-eu-blue/10 text-text-main dark:bg-eu-blue-light/15"
            : "text-text-main hover:bg-soft-gray/70 hover:shadow-soft-1",
        )}
      >
        {active ? (
          <span
            className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-eu-blue dark:bg-eu-blue-light"
            aria-hidden
          />
        ) : null}
        <Globe
          className={cn(
            "h-3.5 w-3.5 flex-none",
            active ? "text-eu-blue dark:text-eu-blue-light" : "text-text-muted",
          )}
          aria-hidden
        />
        <span className="flex-1 truncate">{site.name}</span>
        <span className="hidden truncate text-[11px] text-text-faint sm:inline">{site.domain}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded-lg p-1 text-text-faint transition-colors hover:bg-red-500/10 hover:text-red-500 group-hover:inline-flex"
        aria-label={`Șterge ${site.name}`}
        title="Șterge"
      >
        <Trash2 className="h-3 w-3" aria-hidden />
      </button>
    </li>
  );
}
