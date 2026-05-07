import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Fuse from "fuse.js";
import {
  ArrowUpDown,
  CornerDownLeft,
  Globe,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useTheme } from "@/hooks/useTheme";
import { Kbd } from "./Kbd";
import { isAppleDevice } from "@/hooks/useHotkeys";
import { cn } from "@/lib/cn";

type CommandItem = {
  id: string;
  section: "Comenzi" | "Site-uri";
  label: string;
  hint?: string;
  keywords: string;
  icon: LucideIcon;
  action: () => void;
};

const SPRING = {
  type: "spring" as const,
  stiffness: 360,
  damping: 30,
  mass: 0.85,
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactNode {
  const sitesMap = useStore((s) => s.sites);
  const selectSite = useStore((s) => s.selectSite);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setConfirmIntent = useStore((s) => s.setConfirmIntent);
  const setCreateOpen = useStore((s) => s.setCreateOpen);
  const setUnlockSiteId = useStore((s) => s.setUnlockSiteId);
  const { setting, setSetting } = useTheme();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    return;
  }, [open]);

  const allItems = useMemo<CommandItem[]>(() => {
    const next: CommandItem[] = [];

    next.push({
      id: "cmd:new-site",
      section: "Comenzi",
      label: "Site nou",
      hint: "Generează passphrase + embed snippet",
      keywords: "nou create site domain adăugare passphrase",
      icon: Plus,
      action: () => {
        setCreateOpen(true);
        onClose();
      },
    });
    next.push({
      id: "cmd:settings",
      section: "Comenzi",
      label: "Setări",
      hint: "Temă, optimizare, scurtături",
      keywords: "settings preferences temă optimizare",
      icon: SettingsIcon,
      action: () => {
        setSettingsOpen(true);
        onClose();
      },
    });
    next.push({
      id: "cmd:theme-toggle",
      section: "Comenzi",
      label: setting === "dark" ? "Comută la temă luminoasă" : "Comută la temă întunecată",
      hint: "Light · Dark · System",
      keywords: "theme dark light tema",
      icon: Sun,
      action: () => {
        setSetting(setting === "dark" ? "light" : "dark");
        onClose();
      },
    });
    next.push({
      id: "cmd:theme-system",
      section: "Comenzi",
      label: "Temă: urmează sistemul",
      keywords: "theme system auto sistem",
      icon: Sparkles,
      action: () => {
        setSetting("system");
        onClose();
      },
    });
    next.push({
      id: "cmd:delete-all",
      section: "Comenzi",
      label: "Șterge toate datele locale",
      hint: "Zonă periculoasă · ireversibil",
      keywords: "delete reset clear ștergere",
      icon: Trash2,
      action: () => {
        setConfirmIntent({ kind: "delete-all" });
        onClose();
      },
    });

    for (const site of Object.values(sitesMap)) {
      next.push({
        id: `site:${site.id}`,
        section: "Site-uri",
        label: site.name,
        hint: site.domain,
        keywords: `${site.name} ${site.domain}`,
        icon: Globe,
        action: () => {
          selectSite(site.id);
          onClose();
        },
      });
      next.push({
        id: `unlock:${site.id}`,
        section: "Site-uri",
        label: `Deblochează ${site.name}`,
        hint: "Introdu passphrase E2E",
        keywords: `unlock ${site.name} ${site.domain} deblocare passphrase`,
        icon: SettingsIcon,
        action: () => {
          selectSite(site.id);
          setUnlockSiteId(site.id);
          onClose();
        },
      });
    }
    return next;
  }, [sitesMap, setting, setSetting, setSettingsOpen, setConfirmIntent, setCreateOpen, setUnlockSiteId, selectSite, onClose]);

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: [
          { name: "label", weight: 0.7 },
          { name: "keywords", weight: 0.3 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [allItems],
  );

  const filtered = useMemo<CommandItem[]>(() => {
    if (!query.trim()) return allItems;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, allItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) item.action();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selectedIndex, onClose]);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, filtered]);

  const sections = useMemo<Array<{ name: CommandItem["section"]; items: Array<{ item: CommandItem; absoluteIndex: number }> }>>(() => {
    const map = new Map<CommandItem["section"], Array<{ item: CommandItem; absoluteIndex: number }>>();
    filtered.forEach((item, idx) => {
      const arr = map.get(item.section) ?? [];
      arr.push({ item, absoluteIndex: idx });
      map.set(item.section, arr);
    });
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [filtered]);

  const modLabel = isAppleDevice ? "⌘" : "Ctrl";

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="glass-overlay fixed inset-0 z-50"
            onClick={onClose}
          />
          <motion.div
            key="palette"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={SPRING}
            role="dialog"
            aria-modal="true"
            aria-label="Paletă de comenzi"
            className="glass-modal fixed left-1/2 top-[14vh] z-[55] flex w-[min(36rem,92vw)] -translate-x-1/2 flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center gap-3 border-b border-white/20 px-5 py-3.5 dark:border-white/10">
              <Search className="h-4 w-4 text-text-faint" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                placeholder="Caută o comandă sau un site…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-base text-text-main placeholder:text-text-faint focus:outline-none"
                aria-label="Caută"
              />
              <Kbd>esc</Kbd>
            </div>
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-text-muted">Nicio potrivire pentru „{query}".</p>
                </div>
              ) : (
                sections.map((sec) => (
                  <div key={sec.name} className="px-2 pb-2">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-faint">
                      {sec.name}
                    </p>
                    <ul className="space-y-0.5">
                      {sec.items.map(({ item, absoluteIndex }) => {
                        const active = absoluteIndex === selectedIndex;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              data-index={absoluteIndex}
                              onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                              onClick={() => item.action()}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                                active
                                  ? "bg-eu-blue/10 text-text-main dark:bg-eu-blue-light/15"
                                  : "text-text-main hover:bg-soft-gray/80",
                              )}
                            >
                              <item.icon
                                className={cn(
                                  "h-4 w-4 flex-none",
                                  active ? "text-eu-blue dark:text-eu-blue-light" : "text-text-muted",
                                )}
                                aria-hidden
                              />
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.hint ? (
                                <span className="hidden truncate text-xs text-text-faint sm:inline">
                                  {item.hint}
                                </span>
                              ) : null}
                              {active ? (
                                <CornerDownLeft
                                  className="h-3.5 w-3.5 text-eu-blue dark:text-eu-blue-light"
                                  aria-hidden
                                />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/20 px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-text-faint dark:border-white/10">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowUpDown className="h-3 w-3" aria-hidden /> navigare
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CornerDownLeft className="h-3 w-3" aria-hidden /> selectează
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                <span>analytics</span>
                <Kbd>{modLabel}</Kbd>
                <Kbd>K</Kbd>
              </span>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
