import Link from "next/link";
import {
  LayoutDashboard,
  Globe2,
  MousePointerClick,
  Compass,
  Users,
  Settings,
  LifeBuoy,
  Sparkles,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
};

const primaryNav: NavItem[] = [
  { label: "Panou principal", href: "/", icon: LayoutDashboard, active: true },
  { label: "Site-uri", href: "/sites", icon: Globe2 },
  { label: "Evenimente", href: "/events", icon: MousePointerClick },
  { label: "Surse de trafic", href: "/sources", icon: Compass },
  { label: "Audiență", href: "/audience", icon: Users },
];

const secondaryNav: NavItem[] = [
  { label: "Setări", href: "/settings", icon: Settings },
  { label: "Asistență", href: "/support", icon: LifeBuoy },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-72 shrink-0 flex-col gap-8 border-r border-border bg-white px-6 py-8">
      <Link href="/" className="flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-[var(--shadow-soft)]">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">
            EuroAnalytics
          </span>
          <span className="text-xs text-gray-500">Privacy-first · v0.1</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Navigare
        </p>
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Cont
        </p>
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="rounded-3xl border border-border bg-canvas p-5">
        <p className="text-sm font-semibold tracking-tight text-gray-900">
          GDPR ready
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Date stocate în UE. Fără cookie-uri, fără amprentare, fără urmărire
          între site-uri.
        </p>
        <Link
          href="/privacy"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          Vezi politica
        </Link>
      </div>
    </aside>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  const base =
    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors";
  if (item.active) {
    return (
      <Link
        href={item.href}
        className={`${base} bg-accent-soft text-accent`}
        aria-current="page"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
        <span className="tracking-tight">{item.label}</span>
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      className={`${base} text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
    >
      <Icon
        className="h-[18px] w-[18px] text-gray-400 group-hover:text-gray-700"
        strokeWidth={2}
      />
      <span className="tracking-tight">{item.label}</span>
    </Link>
  );
}
