/**
 * Per-site sync orchestration. Spawns one SyncClient per entry in
 * `useSessions.sessions`, tears down clients whose session is gone, and
 * channels decrypted events into the local cache.
 */

import { useEffect, useRef } from "react";
import { recordEvent, recordEvents } from "@/cache";
import type { DecryptedEvent } from "@/cache/types";
import { useStore } from "@/store/useStore";
import { useSessions } from "@/store/useSessions";
import { SyncClient } from "@/sync/client";
import type { SyncEvent } from "@/sync/client";

type Managed = {
  client: SyncClient;
  passphrase: string;
};

function isDecryptedShape(p: unknown): p is DecryptedEvent {
  if (typeof p !== "object" || p === null) return false;
  const r = p as Record<string, unknown>;
  return typeof r["p"] === "string" && typeof r["ts"] === "number" && Array.isArray(r["v"]);
}

function normalize(p: unknown, fallbackTs: number): DecryptedEvent | null {
  if (!isDecryptedShape(p)) return null;
  const w = typeof p.v[0] === "number" ? p.v[0] : 0;
  const h = typeof p.v[1] === "number" ? p.v[1] : 0;
  return {
    p: p.p,
    r: typeof p.r === "string" ? p.r : "",
    v: [w, h],
    ts: typeof p.ts === "number" && p.ts > 0 ? p.ts : fallbackTs,
    n: typeof p.n === "string" ? p.n : "",
  };
}

export function useSync(): void {
  const ingestUrl = useStore((s) => s.ingestUrl);
  const sessions = useSessions((s) => s.sessions);
  const attachClient = useSessions((s) => s.attachClient);
  const setStatus = useSessions((s) => s.setStatus);

  const managed = useRef<Map<string, Managed>>(new Map());

  useEffect(() => {
    const live = managed.current;

    // Tear down clients whose session is gone or whose passphrase changed.
    for (const [siteId, m] of live) {
      const sess = sessions[siteId];
      if (!sess || sess.passphrase !== m.passphrase) {
        m.client.stop();
        live.delete(siteId);
      }
    }

    // Spawn clients for new sessions.
    for (const [siteId, sess] of Object.entries(sessions)) {
      if (live.has(siteId)) continue;
      if (!ingestUrl.trim()) {
        setStatus(siteId, "error");
        continue;
      }

      const batch: DecryptedEvent[] = [];
      let flushTimer: number | null = null;
      const flush = (): void => {
        if (batch.length === 0) return;
        recordEvents(siteId, batch.splice(0));
        flushTimer = null;
      };

      const onEvent = (evt: SyncEvent): void => {
        const ev = normalize(evt.payload, evt.ts);
        if (!ev) return;
        // Live path: 1 event flushed via microtask for sub-frame paint.
        // Batch path: tight bursts coalesce into one cache write per 50 ms.
        batch.push(ev);
        if (batch.length === 1 && flushTimer === null) {
          window.queueMicrotask(() => {
            if (batch.length === 1 && flushTimer === null) {
              const single = batch.pop();
              if (single) recordEvent(siteId, single);
            }
          });
        }
        if (flushTimer === null) {
          flushTimer = window.setTimeout(flush, 50);
        }
      };

      const client = new SyncClient({
        url: ingestUrl,
        roomId: sess.roomId,
        siteKey: sess.siteKey,
        onEvent,
        onStatus: (status) => setStatus(siteId, status),
      });

      live.set(siteId, { client, passphrase: sess.passphrase });
      attachClient(siteId, client);
      client.start();
    }
  }, [sessions, ingestUrl, attachClient, setStatus]);

  useEffect(() => {
    const live = managed.current;
    return () => {
      for (const m of live.values()) m.client.stop();
      live.clear();
    };
  }, []);
}
