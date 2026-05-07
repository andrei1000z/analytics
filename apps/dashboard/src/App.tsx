import { useEffect } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/store/useStore";
import { useSessions } from "@/store/useSessions";
import { useDesktop } from "@/hooks/useMediaQuery";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useTheme } from "@/hooks/useTheme";
import { useSync } from "@/hooks/useSync";
import { Sidebar } from "@/components/Sidebar";
import { MainPane } from "@/components/MainPane";
import { CommandPalette } from "@/components/CommandPalette";
import { SettingsModal } from "@/components/SettingsModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CreateSiteModal } from "@/components/CreateSiteModal";
import { UnlockSiteModal } from "@/components/UnlockSiteModal";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { AuthGate } from "@/auth/AuthGate";
import { clearSite } from "@/cache";
import { cn } from "@/lib/cn";

export default function App(): ReactNode {
  // Initialize theme + listen to system changes
  useTheme();

  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}

function Shell(): ReactNode {
  // Per-site sync clients keyed off the in-memory session map.
  useSync();

  const activeSiteId = useStore((s) => s.activeSiteId);
  const sitesMap = useStore((s) => s.sites);
  const paletteOpen = useStore((s) => s.paletteOpen);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const confirmIntent = useStore((s) => s.confirmIntent);

  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setCreateOpen = useStore((s) => s.setCreateOpen);
  const setConfirmIntent = useStore((s) => s.setConfirmIntent);
  const deleteSite = useStore((s) => s.deleteSite);
  const deleteAll = useStore((s) => s.deleteAll);
  const lockSession = useSessions((s) => s.lock);
  const lockAllSessions = useSessions((s) => s.lockAll);

  const desktop = useDesktop();
  const showSidebar = desktop || !activeSiteId;
  const showMain = desktop || activeSiteId !== null;

  // Lock all sessions on tab close so passphrase never lingers in memory.
  useEffect(() => {
    const onUnload = (): void => lockAllSessions();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [lockAllSessions]);

  useHotkeys([
    {
      combo: "mod+k",
      preventDefault: true,
      allowInInputs: true,
      handler: () => setPaletteOpen(!paletteOpen),
    },
    {
      combo: "mod+=",
      preventDefault: true,
      handler: () => setCreateOpen(true),
    },
    {
      combo: "mod+,",
      preventDefault: true,
      allowInInputs: true,
      handler: () => setSettingsOpen(!settingsOpen),
    },
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-soft-bg text-text-main">
      <AmbientBlobs />
      <div className="relative z-0 flex h-full w-full">
        <div className={cn(showSidebar ? "flex" : "hidden", "h-full md:flex md:flex-none")}>
          <Sidebar />
        </div>
        <div className={cn(showMain ? "flex" : "hidden", "h-full flex-1 md:flex")}>
          <MainPane />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRequestDeleteAll={() => {
          setSettingsOpen(false);
          setConfirmIntent({ kind: "delete-all" });
        }}
      />
      <CreateSiteModal />
      <UnlockSiteModal />
      <InstallPrompt />
      <ReloadPrompt />
      <ConfirmDialog
        open={confirmIntent !== null}
        tone={confirmIntent ? "danger" : "default"}
        title={
          confirmIntent?.kind === "delete-all"
            ? "Șterge toate datele locale"
            : confirmIntent?.kind === "delete-site"
              ? "Șterge site-ul"
              : ""
        }
        description={
          confirmIntent?.kind === "delete-all" ? (
            <>
              Toate site-urile, colecțiile și cache-ul local vor fi șterse. Datele criptate
              de pe ingest rămân — sunt indecodabile fără passphrase. Această operațiune
              este <strong>ireversibilă</strong>.
            </>
          ) : confirmIntent?.kind === "delete-site" ? (
            <>
              Site-ul „{sitesMap[confirmIntent.siteId]?.name ?? "—"}" și toate
              vizualizările cache-uite local vor fi șterse. Operațiune ireversibilă.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Șterge"
        onConfirm={() => {
          if (confirmIntent?.kind === "delete-all") {
            lockAllSessions();
            deleteAll();
          } else if (confirmIntent?.kind === "delete-site") {
            lockSession(confirmIntent.siteId);
            clearSite(confirmIntent.siteId);
            deleteSite(confirmIntent.siteId);
          }
          setConfirmIntent(null);
        }}
        onCancel={() => setConfirmIntent(null)}
      />
    </div>
  );
}

function AmbientBlobs(): ReactNode {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-eu-blue/[0.05] blur-3xl dark:bg-eu-blue-light/[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[22rem] w-[22rem] rounded-full bg-eu-yellow/[0.04] blur-3xl"
      />
    </>
  );
}
