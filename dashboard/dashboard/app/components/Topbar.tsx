import { Bell, ChevronDown, Search, Menu } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b border-border bg-white/80 px-6 backdrop-blur-xl sm:px-10 lg:px-12">
      <button
        type="button"
        className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-gray-600 hover:bg-gray-50"
        aria-label="Deschide meniul"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
            E
          </span>
          <span className="tracking-tight">euroanalytics.ro</span>
          <ChevronDown className="h-4 w-4 text-gray-400" strokeWidth={2} />
        </button>
        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-gray-500 w-72">
          <Search className="h-4 w-4 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            placeholder="Caută pagini, evenimente, surse…"
            className="flex-1 bg-transparent placeholder:text-gray-400 focus:outline-none"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-gray-600 hover:bg-gray-50"
          aria-label="Notificări"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
        </button>

        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-border bg-white py-1.5 pl-1.5 pr-4 text-left hover:bg-gray-50"
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
        </button>
      </div>
    </header>
  );
}
