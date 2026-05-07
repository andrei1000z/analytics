import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { id } from "@/lib/format";
import type { Range } from "@/cache/types";

export type Site = {
  id: string;
  name: string;
  domain: string;
  collectionId: string | null;
  /** Hex-encoded 32-byte PBKDF2 derivative — public, what the server learns. */
  roomId: string;
  createdAt: number;
};

export type Collection = {
  id: string;
  name: string;
  expanded: boolean;
};

export type ConfirmIntent =
  | { kind: "delete-site"; siteId: string }
  | { kind: "delete-all" };

type StoreState = {
  sites: Record<string, Site>;
  collections: Record<string, Collection>;
  activeSiteId: string | null;
  range: Range;
  /** Global ingest server URL. Operators usually point at a single VPS. */
  ingestUrl: string;
  /** Where the embeddable tracker is served from. Defaults to ingestUrl when empty. */
  trackerUrl: string;
  paletteOpen: boolean;
  settingsOpen: boolean;
  createOpen: boolean;
  unlockSiteId: string | null;
  confirmIntent: ConfirmIntent | null;
};

type StoreActions = {
  selectSite: (siteId: string | null) => void;
  createSite: (input: {
    name: string;
    domain: string;
    roomId: string;
    collectionId?: string | null;
  }) => string;
  renameSite: (siteId: string, name: string) => void;
  deleteSite: (siteId: string) => void;
  createCollection: (name: string) => string;
  toggleCollection: (collectionId: string) => void;
  setRange: (range: Range) => void;
  setIngestUrl: (url: string) => void;
  setTrackerUrl: (url: string) => void;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCreateOpen: (open: boolean) => void;
  setUnlockSiteId: (siteId: string | null) => void;
  setConfirmIntent: (intent: ConfirmIntent | null) => void;
  deleteAll: () => void;
};

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set) => ({
      sites: {},
      collections: {},
      activeSiteId: null,
      range: "7d",
      ingestUrl: "",
      trackerUrl: "",
      paletteOpen: false,
      settingsOpen: false,
      createOpen: false,
      unlockSiteId: null,
      confirmIntent: null,

      selectSite: (siteId) => set({ activeSiteId: siteId }),

      createSite: (input) => {
        const newId = id("site");
        const site: Site = {
          id: newId,
          name: input.name,
          domain: input.domain,
          collectionId: input.collectionId ?? null,
          roomId: input.roomId,
          createdAt: Date.now(),
        };
        set((state) => ({
          sites: { ...state.sites, [newId]: site },
          activeSiteId: newId,
        }));
        return newId;
      },

      renameSite: (siteId, name) =>
        set((state) => {
          const site = state.sites[siteId];
          if (!site) return state;
          return { sites: { ...state.sites, [siteId]: { ...site, name } } };
        }),

      deleteSite: (siteId) =>
        set((state) => {
          if (!state.sites[siteId]) return state;
          const next = { ...state.sites };
          delete next[siteId];
          return {
            sites: next,
            activeSiteId: state.activeSiteId === siteId ? null : state.activeSiteId,
          };
        }),

      createCollection: (name) => {
        const newId = id("col");
        const collection: Collection = { id: newId, name, expanded: true };
        set((state) => ({
          collections: { ...state.collections, [newId]: collection },
        }));
        return newId;
      },

      toggleCollection: (collectionId) =>
        set((state) => {
          const c = state.collections[collectionId];
          if (!c) return state;
          return {
            collections: {
              ...state.collections,
              [collectionId]: { ...c, expanded: !c.expanded },
            },
          };
        }),

      setRange: (range) => set({ range }),
      setIngestUrl: (ingestUrl) => set({ ingestUrl }),
      setTrackerUrl: (trackerUrl) => set({ trackerUrl }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setCreateOpen: (createOpen) => set({ createOpen }),
      setUnlockSiteId: (unlockSiteId) => set({ unlockSiteId }),
      setConfirmIntent: (confirmIntent) => set({ confirmIntent }),

      deleteAll: () =>
        set({
          sites: {},
          collections: {},
          activeSiteId: null,
        }),
    }),
    {
      name: "analytics:v2",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        sites: state.sites,
        collections: state.collections,
        activeSiteId: state.activeSiteId,
        range: state.range,
        ingestUrl: state.ingestUrl,
        trackerUrl: state.trackerUrl,
      }),
      migrate: (persisted, version) => {
        const partial = persisted as Partial<StoreState> | null | undefined;
        // v1 → v2: sites schema added `roomId` (no longer derivable from old seeds).
        // Drop legacy seeds; user re-creates real sites with passphrases.
        if (version < 2) {
          return {
            sites: {},
            collections: partial?.collections ?? {},
            activeSiteId: null,
            range: partial?.range ?? "7d",
            ingestUrl: partial?.ingestUrl ?? "",
            trackerUrl: partial?.trackerUrl ?? "",
          } as Partial<StoreState> as never;
        }
        return {
          sites: partial?.sites ?? {},
          collections: partial?.collections ?? {},
          activeSiteId: partial?.activeSiteId ?? null,
          range: partial?.range ?? "7d",
          ingestUrl: partial?.ingestUrl ?? "",
          trackerUrl: partial?.trackerUrl ?? "",
        } as Partial<StoreState> as never;
      },
    },
  ),
);
