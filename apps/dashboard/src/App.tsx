import type { ReactNode } from "react";
import { useStore } from "@/store/useStore";
import { useDesktop } from "@/hooks/useMediaQuery";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useTheme } from "@/hooks/useTheme";
import { useSync } from "@/hooks/useSync";
import { Sidebar } from "@/components/Sidebar";
import { MainPane } from "@/components/MainPane";
import { CommandPalette } from "@/components/CommandPalette";
import { SettingsModal } from "@/components/SettingsModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AuthGate } from "@/auth/AuthGate";
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
  // Mount the global E2E sync client (driven by ingestUrl + syncPassphrase).
  // Lives behind AuthGate so the WS only opens after the operator unlocks.
  useSync();

  const activeSiteId = useStore((s) => s.activeSiteId);
  const sitesMap = useStore((s) => s.sites);
  const paletteOpen = useStore((s) => s.paletteOpen);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const confirmIntent = useStore((s) => s.confirmIntent);
  const syncStatus = useStore((s) => s.syncStatus);

  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setConfirmIntent = useStore((s) => s.setConfirmIntent);
  const createSite = useStore((s) => s.createSite);
  const deleteSite = useStore((s) => s.deleteSite);
  const deleteAll = useStore((s) => s.deleteAll);

  const desktop = useDesktop();
  const showSidebar = desktop || !activeSiteId;
  const showMain = desktop || activeSiteId !== null;

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
      handler: () => {
        const n = Object.keys(sitesMap).length + 1;
        createSite({ name: `Site #${n}`, domain: `site-${n}.eu` });
      },
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
          <Sidebar syncStatus={syncStatus} />
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
          if (confirmIntent?.kind === "delete-all") deleteAll();
          else if (confirmIntent?.kind === "delete-site") deleteSite(confirmIntent.siteId);
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
