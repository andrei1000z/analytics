import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { id } from "@/lib/format";

export type Site = {
  id: string;
  name: string;
  domain: string;
  collectionId: string | null;
  createdAt: number;
};

export type Collection = {
  id: string;
  name: string;
  expanded: boolean;
};

export type SyncStatus = "idle" | "connecting" | "connected" | "offline" | "error";

type StoreState = {
  sites: Record<string, Site>;
  collections: Record<string, Collection>;
  activeSiteId: string | null;
  paletteOpen: boolean;
  settingsOpen: boolean;
  confirmIntent: ConfirmIntent | null;
  syncStatus: SyncStatus;
};

export type ConfirmIntent =
  | { kind: "delete-site"; siteId: string }
  | { kind: "delete-all" };

type StoreActions = {
  selectSite: (siteId: string | null) => void;
  createSite: (input: { name: string; domain: string; collectionId?: string | null }) => string;
  renameSite: (siteId: string, name: string) => void;
  deleteSite: (siteId: string) => void;
  createCollection: (name: string) => string;
  toggleCollection: (collectionId: string) => void;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setConfirmIntent: (intent: ConfirmIntent | null) => void;
  deleteAll: () => void;
  setSyncStatus: (status: SyncStatus) => void;
};

const SEED: Pick<StoreState, "sites" | "collections"> = (() => {
  const colId = "col_seed_acme";
  const now = Date.now();
  const s1 = "site_seed_public";
  const s2 = "site_seed_staging";
  const s3 = "site_seed_docs";
  return {
    collections: {
      [colId]: { id: colId, name: "Acme", expanded: true },
    },
    sites: {
      [s1]: {
        id: s1,
        name: "Acme Public",
        domain: "acme.eu",
        collectionId: null,
        createdAt: now - 86_400_000 * 12,
      },
      [s2]: {
        id: s2,
        name: "Acme Staging",
        domain: "staging.acme.eu",
        collectionId: colId,
        createdAt: now - 86_400_000 * 4,
      },
      [s3]: {
        id: s3,
        name: "Documentație",
        domain: "docs.acme.eu",
        collectionId: colId,
        createdAt: now - 86_400_000 * 2,
      },
    },
  };
})();

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set) => ({
      sites: SEED.sites,
      collections: SEED.collections,
      activeSiteId: null,
      paletteOpen: false,
      settingsOpen: false,
      confirmIntent: null,
      syncStatus: "idle",

      selectSite: (siteId) => set({ activeSiteId: siteId }),

      createSite: (input) => {
        const newId = id("site");
        const site: Site = {
          id: newId,
          name: input.name,
          domain: input.domain,
          collectionId: input.collectionId ?? null,
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

      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setConfirmIntent: (confirmIntent) => set({ confirmIntent }),

      deleteAll: () =>
        set({
          sites: {},
          collections: {},
          activeSiteId: null,
        }),

      setSyncStatus: (syncStatus) => set({ syncStatus }),
    }),
    {
      name: "analytics:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        sites: state.sites,
        collections: state.collections,
        activeSiteId: state.activeSiteId,
      }),
      migrate: (persisted, _version) => {
        const partial = persisted as Partial<StoreState> | null | undefined;
        return {
          sites: partial?.sites ?? SEED.sites,
          collections: partial?.collections ?? SEED.collections,
          activeSiteId: partial?.activeSiteId ?? null,
        } as Partial<StoreState> as never;
      },
    },
  ),
);
