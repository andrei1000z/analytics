import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { SyncClient } from "@/sync/client";
import type { SyncEvent } from "@/sync/client";
import { deriveRoomId, deriveSiteKey } from "@/sync/crypto";

/**
 * Single global sync client driven by `ingestUrl` + `syncPassphrase`.
 * Mounts once at the app shell. Tears down + rebuilds when either input
 * changes. Passphrase is in-memory only (never reaches localStorage).
 *
 * Phase 5 wires the WS transport + decrypt path. Aggregating decrypted
 * events into the local cache is intentionally a no-op handler here —
 * the data shape (per-site hourly buckets) needs the production siteId
 * routing that lands when an ingest server is actually deployed.
 */
export function useSync(): void {
  const ingestUrl = useStore((s) => s.ingestUrl);
  const passphrase = useStore((s) => s.syncPassphrase);
  const setSyncStatus = useStore((s) => s.setSyncStatus);

  const clientRef = useRef<SyncClient | null>(null);

  useEffect(() => {
    let cancelled = false;

    const teardown = (): void => {
      if (clientRef.current) {
        clientRef.current.stop();
        clientRef.current = null;
      }
    };

    if (!ingestUrl.trim() || !passphrase) {
      teardown();
      setSyncStatus("idle");
      return;
    }

    setSyncStatus("connecting");

    void (async () => {
      try {
        const [roomId, siteKey] = await Promise.all([
          deriveRoomId(passphrase),
          deriveSiteKey(passphrase),
        ]);
        if (cancelled) return;
        const client = new SyncClient({
          url: ingestUrl,
          roomId,
          siteKey,
          onEvent: (_evt: SyncEvent) => {
            // Phase 5: hook for cache aggregation. Real events arrive only when
            // the ingest server is reachable AND the passphrase decrypts them.
          },
          onStatus: (status) => setSyncStatus(status),
        });
        clientRef.current = client;
        client.start();
      } catch {
        if (!cancelled) setSyncStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [ingestUrl, passphrase, setSyncStatus]);
}
