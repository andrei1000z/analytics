"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full border border-border bg-white py-1.5 pl-1.5 pr-3 text-left hover:bg-gray-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-semibold text-white">
          AM
        </span>
        <span className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm font-medium tracking-tight text-gray-900">
            Andrei M.
          </span>
          <span className="text-xs text-gray-500">Plan Pro</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-3xl border border-border bg-white p-2 shadow-[var(--shadow-soft)]">
          <div className="rounded-2xl bg-canvas px-4 py-3">
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              Andrei M.
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              andrei@euroanalytics.ro
            </p>
          </div>
          <div className="mt-1 flex flex-col">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-canvas"
            >
              <Settings className="h-4 w-4 text-gray-400" strokeWidth={2} />
              Setări
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-canvas"
            >
              <User className="h-4 w-4 text-gray-400" strokeWidth={2} />
              Profil
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Deconectare
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
