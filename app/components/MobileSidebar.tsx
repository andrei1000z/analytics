"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MousePointerClick,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };

const PRIMARY: NavItem[] = [
  { label: "Panou principal", href: "/", icon: LayoutDashboard },
  { label: "Site-uri", href: "/sites", icon: Globe2 },
  { label: "Evenimente", href: "/events", icon: MousePointerClick },
  { label: "Surse de trafic", href: "/sources", icon: Compass },
  { label: "Audiență", href: "/audience", icon: Users },
];

const SECONDARY: NavItem[] = [
  { label: "Setări", href: "/settings", icon: Settings },
  { label: "Asistență", href: "/support", icon: LifeBuoy },
];

const OPEN_EVENT = "ea:open-mobile-sidebar";

export function openMobileSidebar() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-6 bg-white p-6 shadow-[var(--shadow-soft)] transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white">
              <Sparkles className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                EuroAnalytics
              </span>
              <span className="text-xs text-gray-500">Privacy-first</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 hover:bg-gray-50"
            aria-label="Închide meniul"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Navigare
          </p>
          {PRIMARY.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onNavigate={() => setOpen(false)}
            />
          ))}
          <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Cont
          </p>
          {SECONDARY.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Deconectare
        </button>
      </aside>
    </div>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium tracking-tight text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    >
      <Icon
        className="h-[18px] w-[18px] text-gray-400 group-hover:text-gray-700"
        strokeWidth={2}
      />
      {item.label}
    </Link>
  );
}
