/**
 * Phase 7 multi-device sync orchestration.
 *
 * Watches `useSessions.masterPassphrase`. When set + ingestUrl exists:
 *  - Spins up a ConfigSyncClient for the master-derived config room
 *  - Pushes a snapshot of {sites, collections, ingestUrl, trackerUrl,
 *    per-site passphrases} on every store change (debounced 2s)
 *  - On incoming snapshots from other devices, hydrates Zustand + auto-unlocks
 *    each site whose passphrase came in the snapshot
 *
 * Master passphrase is in memory only. Snapshots include per-site passphrases
 * by design — that's the trade-off making "log in once, get everything"
 * possible across devices.
 */

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { useSessions } from "@/store/useSessions";
import { ConfigSyncClient } from "@/sync/configSync";
import type { ConfigSnapshot, ConfigStatus } from "@/sync/configSync";
import { deriveKeys } from "@/sync/crypto";

const PUSH_DEBOUNCE_MS = 2_000;

export function useConfigSync(): void {
  const ingestUrl = useStore((s) => s.ingestUrl);
  const masterPassphrase = useSessions((s) => s.masterPassphrase);
  const setConfigSyncStatus = useSessions((s) => s.setConfigSyncStatus);
  const recordSnapshotApplied = useSessions((s) => s.recordSnapshotApplied);

  const clientRef = useRef<ConfigSyncClient | null>(null);
  const debounceRef = useRef<number | null>(null);
  const lastPushedRef = useRef<string>("");

  // Manage the client lifecycle.
  useEffect(() => {
    let cancelled = false;
    if (clientRef.current) {
      clientRef.current.stop();
      clientRef.current = null;
    }
    if (!masterPassphrase || !ingestUrl.trim()) {
      setConfigSyncStatus("idle");
      return;
    }
    const onStatus = (status: ConfigStatus, detail?: string): void => {
      if (cancelled) return;
      setConfigSyncStatus(status, detail ?? null);
    };
    const onSnapshot = (snap: ConfigSnapshot): void => {
      if (cancelled) return;
      void applySnapshot(snap, recordSnapshotApplied);
    };
    const client = new ConfigSyncClient({
      ingestUrl,
      masterPassphrase,
      onSnapshot,
      onStatus,
    });
    clientRef.current = client;
    void client.start();
    return () => {
      cancelled = true;
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
      client.stop();
    };
  }, [ingestUrl, masterPassphrase, setConfigSyncStatus, recordSnapshotApplied]);

  // Push current state on changes (debounced).
  useEffect(() => {
    if (!masterPassphrase) return;
    const unsub = useStore.subscribe((state) => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        void pushCurrentState(state);
      }, PUSH_DEBOUNCE_MS);
    });
    // Push once on master passphrase activation (after derive completes).
    const timer = window.setTimeout(() => {
      void pushCurrentState(useStore.getState());
    }, 800);
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [masterPassphrase]);

  function pushCurrentState(state: ReturnType<typeof useStore.getState>): Promise<void> {
    const client = clientRef.current;
    if (!client) return Promise.resolve();
    const passphrases: Record<string, string> = {};
    const sessions = useSessions.getState().sessions;
    for (const [siteId, s] of Object.entries(sessions)) {
      passphrases[siteId] = s.passphrase;
    }
    const snap: ConfigSnapshot = {
      v: 1,
      ts: Date.now(),
      sites: state.sites,
      collections: state.collections,
      ingestUrl: state.ingestUrl,
      trackerUrl: state.trackerUrl,
      passphrases,
    };
    const key = JSON.stringify({
      s: snap.sites,
      c: snap.collections,
      i: snap.ingestUrl,
      t: snap.trackerUrl,
      p: snap.passphrases,
    });
    if (key === lastPushedRef.current) return Promise.resolve();
    lastPushedRef.current = key;
    return client.push(snap);
  }
}

async function applySnapshot(
  snap: ConfigSnapshot,
  recordSnapshotApplied: () => void,
): Promise<void> {
  const store = useStore.getState();
  // Hydrate the persisted slice of state.
  useStore.setState({
    sites: snap.sites as typeof store.sites,
    collections: snap.collections as typeof store.collections,
    ingestUrl: snap.ingestUrl,
    trackerUrl: snap.trackerUrl,
  });

  // Auto-unlock each site whose passphrase came in the snapshot.
  const unlock = useSessions.getState().unlock;
  for (const [siteId, passphrase] of Object.entries(snap.passphrases)) {
    try {
      const { roomId, siteKey, keyHex } = await deriveKeys(passphrase);
      unlock(siteId, { passphrase, siteKey, keyHex, roomId });
    } catch {
      // skip — bad passphrase or crypto unavailable
    }
  }

  recordSnapshotApplied();
}
