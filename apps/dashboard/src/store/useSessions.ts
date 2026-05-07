/**
 * Per-site sync sessions — IN-MEMORY ONLY. The passphrase, derived AES key,
 * SyncClient handle, and live status all live here and never reach localStorage.
 * On page reload everything is gone; the operator re-unlocks each site.
 *
 * This is a deliberate split from `useStore`: persisting passphrase-derived
 * material would break the zero-knowledge invariant.
 */

import { create } from "zustand";
import type { SyncClient } from "@/sync/client";

export type SyncStatus = "idle" | "connecting" | "connected" | "offline" | "error";

export type Session = {
  /** In-memory passphrase. Cleared on page reload. */
  passphrase: string;
  /** AES-GCM key derived from passphrase. */
  siteKey: CryptoKey;
  /** Hex/base64url of the AES-GCM key bytes — used in the embed URL fragment. */
  keyHex: string;
  /** Hex of the public room derivative — same one persisted on Site.roomId. */
  roomId: string;
  /** Live transport status. */
  status: SyncStatus;
  /** Last successful "connected" wall-clock time (ms). */
  connectedAt: number | null;
  /** Active client handle so the hook can `.stop()` on tear-down. */
  client: SyncClient | null;
};

type SessionsState = {
  sessions: Record<string, Session>;
};

type SessionsActions = {
  unlock: (
    siteId: string,
    partial: Pick<Session, "passphrase" | "siteKey" | "keyHex" | "roomId">,
  ) => void;
  attachClient: (siteId: string, client: SyncClient) => void;
  setStatus: (siteId: string, status: SyncStatus) => void;
  lock: (siteId: string) => void;
  lockAll: () => void;
};

export const useSessions = create<SessionsState & SessionsActions>((set, get) => ({
  sessions: {},

  unlock: (siteId, partial) =>
    set((state) => {
      const existing = state.sessions[siteId];
      if (existing?.client) existing.client.stop();
      return {
        sessions: {
          ...state.sessions,
          [siteId]: {
            ...partial,
            status: "connecting",
            connectedAt: null,
            client: null,
          },
        },
      };
    }),

  attachClient: (siteId, client) =>
    set((state) => {
      const s = state.sessions[siteId];
      if (!s) return state;
      return { sessions: { ...state.sessions, [siteId]: { ...s, client } } };
    }),

  setStatus: (siteId, status) =>
    set((state) => {
      const s = state.sessions[siteId];
      if (!s) return state;
      return {
        sessions: {
          ...state.sessions,
          [siteId]: {
            ...s,
            status,
            connectedAt: status === "connected" ? Date.now() : s.connectedAt,
          },
        },
      };
    }),

  lock: (siteId) =>
    set((state) => {
      const s = state.sessions[siteId];
      if (!s) return state;
      s.client?.stop();
      const next = { ...state.sessions };
      delete next[siteId];
      return { sessions: next };
    }),

  lockAll: () => {
    const all = get().sessions;
    for (const s of Object.values(all)) s.client?.stop();
    set({ sessions: {} });
  },
}));

export function useSessionStatus(siteId: string | null): SyncStatus {
  return useSessions((s) => (siteId ? s.sessions[siteId]?.status ?? "idle" : "idle"));
}

export function useSession(siteId: string | null): Session | null {
  return useSessions((s) => (siteId ? s.sessions[siteId] ?? null : null));
}
