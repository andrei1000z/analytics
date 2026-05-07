import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ExternalLink,
  Eye,
  Globe,
  Lock,
  MousePointer2,
  Send,
  ShieldCheck,
  Timer,
  Unplug,
  Users,
} from "lucide-react";
import type { Site } from "@/store/useStore";
import { useStore } from "@/store/useStore";
import { useSession } from "@/store/useSessions";
import { useSessions } from "@/store/useSessions";
import { snapshot, subscribe, totalEvents } from "@/cache";
import type { SiteSnapshot } from "@/cache/types";
import { RangeSelector } from "./widgets/RangeSelector";
import { KpiCard } from "./widgets/KpiCard";
import { AreaChart } from "./widgets/AreaChart";
import { TopList } from "./widgets/TopList";
import { DeviceBreakdown } from "./widgets/DeviceBreakdown";
import { Heatmap } from "./widgets/Heatmap";
import { ReferrerBreakdown } from "./widgets/ReferrerBreakdown";
import { DurationHistogram } from "./widgets/DurationHistogram";
import { LiveFeed } from "./widgets/LiveFeed";
import { WeekdayBars } from "./widgets/WeekdayBars";
import { EmbedSnippet } from "./EmbedSnippet";
import { compact } from "@/lib/format";

const SECTION_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

const LIVE_TICK_MS = 4000;

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function SiteOverview({ site }: { site: Site }): ReactNode {
  const range = useStore((s) => s.range);
  const setRange = useStore((s) => s.setRange);
  const trackerUrl = useStore((s) => s.trackerUrl);
  const ingestUrl = useStore((s) => s.ingestUrl);
  const setUnlockSiteId = useStore((s) => s.setUnlockSiteId);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const session = useSession(site.id);
  const lockSession = useSessions((s) => s.lock);

  const [snap, setSnap] = useState<SiteSnapshot>(() => snapshot(site.id, range));

  useEffect(() => {
    setSnap(snapshot(site.id, range));
    const unsub = subscribe(site.id, () => setSnap(snapshot(site.id, range)));
    const tick = window.setInterval(() => setSnap(snapshot(site.id, range)), LIVE_TICK_MS);
    return () => {
      unsub();
      window.clearInterval(tick);
    };
  }, [site.id, range]);

  const sparkSeries = useMemo(() => snap.series, [snap.series]);
  const trackerHost = trackerUrl.trim() || ingestUrl.trim();
  const locked = !session;
  const events = totalEvents(site.id);

  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SECTION_SPRING}
        className="space-y-4"
      >
        <SectionHeader session={null} onUnlock={() => setUnlockSiteId(site.id)} />
        <LockedHero
          ingestConfigured={ingestUrl.trim().length > 0}
          onUnlock={() => setUnlockSiteId(site.id)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SECTION_SPRING}
      className="space-y-4"
    >
      <SectionHeader
        session={session}
        liveVisitors={snap.liveVisitors}
        onLock={() => lockSession(site.id)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={`https://${site.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-eu-blue dark:hover:text-eu-blue-light"
        >
          {site.domain}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {events === 0 ? (
        <AwaitingEvents
          trackerUrl={trackerHost}
          ingestUrl={ingestUrl}
          keyHex={session.keyHex}
          roomId={session.roomId}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Vizitatori"
              icon={Users}
              delta={snap.visitors}
              format={(n) => compact(Math.round(n))}
              series={sparkSeries}
              goodWhen="up"
            />
            <KpiCard
              label="Pagini vizualizate"
              icon={Eye}
              delta={snap.pageviews}
              format={(n) => compact(Math.round(n))}
              series={sparkSeries}
              goodWhen="up"
            />
            <KpiCard
              label="Bounce rate"
              icon={MousePointer2}
              delta={snap.bounce}
              format={(n) => `${(n * 100).toFixed(1)}%`}
              goodWhen="down"
            />
            <KpiCard
              label="Durată medie"
              icon={Timer}
              delta={snap.avgDurationSec}
              format={formatDuration}
              goodWhen="up"
            />
            <KpiCard
              label="Pagini / sesiune"
              icon={Activity}
              delta={snap.pagesPerSession}
              format={(n) => n.toFixed(2)}
              goodWhen="up"
            />
          </div>

          <div className="glass-card rounded-3xl p-5 text-eu-blue dark:text-eu-blue-light">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  Trafic
                </h3>
                <p className="mt-1 text-base font-semibold tracking-tight text-text-main">
                  Vizitatori per oră · {compact(snap.visitors.current)} total
                </p>
              </div>
              <Activity className="h-4 w-4 text-text-faint" aria-hidden />
            </div>
            <div className="mt-3">
              <AreaChart series={snap.series} range={snap.range} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TopList
              title="Top pagini"
              icon={MousePointer2}
              items={snap.topPages}
              labelOf={(p) => (
                <span className="font-mono text-[13px] tracking-tight text-text-main">
                  {p.path}
                </span>
              )}
            />
            <TopList
              title="Top referreri"
              icon={Globe}
              items={snap.topReferrers}
              labelOf={(r) => <span className="truncate">{r.host}</span>}
              emptyText="Niciun referrer (trafic direct)"
            />
            <DeviceBreakdown devices={snap.devices} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TopList
              title="Pagini de intrare"
              icon={Send}
              items={snap.topEntryPages.map((e) => ({ path: e.path, views: e.sessions }))}
              labelOf={(p) => (
                <span className="font-mono text-[13px] tracking-tight text-text-main">
                  {p.path}
                </span>
              )}
            />
            <TopList
              title="Pagini de ieșire"
              icon={ExternalLink}
              items={snap.topExitPages.map((e) => ({ path: e.path, views: e.sessions }))}
              labelOf={(p) => (
                <span className="font-mono text-[13px] tracking-tight text-text-main">
                  {p.path}
                </span>
              )}
            />
            <ReferrerBreakdown categories={snap.referrerCategories} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Heatmap data={snap.hourlyHeatmap} />
            <WeekdayBars data={snap.dayOfWeek} />
            <DurationHistogram buckets={snap.durationBuckets} />
          </div>

          <LiveFeed events={snap.recentEvents} />

          <details className="glass-card group rounded-3xl p-5 open:pb-6">
            <summary className="flex cursor-pointer items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                <ShieldCheck className="h-3 w-3" aria-hidden /> Snippet · embed
              </span>
              <span className="text-xs text-text-faint group-open:hidden">Arată</span>
              <span className="hidden text-xs text-text-faint group-open:inline">Ascunde</span>
            </summary>
            <div className="mt-4">
              <EmbedSnippet
                trackerUrl={trackerHost}
                ingestUrl={ingestUrl}
                keyHex={session.keyHex}
                roomId={session.roomId}
              />
            </div>
          </details>
        </>
      )}
    </motion.div>
  );
}

function SectionHeader({
  session,
  liveVisitors = 0,
  onUnlock,
  onLock,
}: {
  session: ReturnType<typeof useSession> | null;
  liveVisitors?: number;
  onUnlock?: () => void;
  onLock?: () => void;
}): ReactNode {
  const status = session?.status ?? "idle";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {status === "connected" && liveVisitors > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-500" />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ping"
              />
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {liveVisitors} live
            </span>
          </div>
        ) : status === "connected" ? (
          <ConnectionPill tone="connected" label="Sincronizat · în așteptare" />
        ) : status === "connecting" ? (
          <ConnectionPill tone="connecting" label="Conectare…" />
        ) : status === "offline" ? (
          <ConnectionPill tone="offline" label="Offline · reîncearcă" />
        ) : status === "error" ? (
          <ConnectionPill tone="error" label="Eroare · verifică ingest URL" />
        ) : (
          <ConnectionPill tone="idle" label="Blocat · introdu passphrase" />
        )}
      </div>
      <div className="flex items-center gap-2">
        {!session && onUnlock ? (
          <button
            type="button"
            onClick={onUnlock}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-eu-blue px-4 py-2 text-xs font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Deblochează
          </button>
        ) : null}
        {session && onLock ? (
          <button
            type="button"
            onClick={onLock}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-line bg-soft-elev px-3.5 py-2 text-xs font-medium text-text-muted shadow-soft-1 transition-all hover:-translate-y-px hover:text-text-main hover:shadow-soft-2"
          >
            <Unplug className="h-3.5 w-3.5" aria-hidden /> Blochează
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ConnectionPill({
  tone,
  label,
}: {
  tone: "idle" | "connecting" | "connected" | "offline" | "error";
  label: string;
}): ReactNode {
  const dot =
    tone === "connected"
      ? "bg-emerald-500"
      : tone === "connecting"
        ? "bg-eu-blue animate-pulse"
        : tone === "offline"
          ? "bg-amber-500"
          : tone === "error"
            ? "bg-red-500"
            : "bg-text-faint";
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-soft-elev/70 px-3 py-1.5 text-[11px] font-medium text-text-muted backdrop-blur-md">
      <span className={`inline-flex h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </div>
  );
}

function LockedHero({
  ingestConfigured,
  onUnlock,
  onOpenSettings,
}: {
  ingestConfigured: boolean;
  onUnlock: () => void;
  onOpenSettings: () => void;
}): ReactNode {
  return (
    <div className="glass-card flex flex-col items-center rounded-3xl p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
        <Lock className="h-6 w-6" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight">Site blocat</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
        Introdu passphrase-ul pentru a derivă cheia AES local. Datele de pe ingest rămân
        criptate până când passphrase-ul corect deschide sesiunea — server-ul nu poate citi.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onUnlock}
          className="inline-flex items-center gap-2 rounded-2xl bg-eu-blue px-5 py-2.5 text-sm font-medium text-white shadow-soft-1 transition-all hover:-translate-y-px hover:bg-eu-blue-light"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden /> Deblochează site-ul
        </button>
        {!ingestConfigured ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-2xl border border-line bg-soft-elev px-5 py-2.5 text-sm font-medium text-text-main shadow-soft-1 transition-all hover:-translate-y-px hover:shadow-soft-2"
          >
            Configurează ingest URL
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AwaitingEvents({
  trackerUrl,
  ingestUrl,
  keyHex,
  roomId,
}: {
  trackerUrl: string;
  ingestUrl: string;
  keyHex: string;
  roomId: string;
}): ReactNode {
  return (
    <div className="space-y-4">
      <div className="glass-card flex flex-col items-center rounded-3xl p-10 text-center">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-eu-blue/10 text-eu-blue dark:bg-eu-blue-light/15 dark:text-eu-blue-light">
            <Send className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <span
            aria-hidden
            className="absolute -right-1 -top-1 inline-flex h-3 w-3"
          >
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
          </span>
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight">Așteaptă primele evenimente</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
          Sincronizat cu nodul de ingest. Adaugă snippet-ul de mai jos pe pagina ta — primul
          pageview va sosi în câteva secunde, criptat AES-GCM 256.
        </p>
      </div>

      <EmbedSnippet
        trackerUrl={trackerUrl}
        ingestUrl={ingestUrl}
        keyHex={keyHex}
        roomId={roomId}
      />
    </div>
  );
}
