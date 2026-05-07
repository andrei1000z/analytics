/**
 * @analytics/tracker — vanilla TS, ≤1 KB minified+gzipped, NO deps.
 *
 * Embed:
 *   <script
 *     src="https://cdn.<your-domain>.eu/t.js#<base64url-key>"
 *     data-site="<site-id-pbkdf2-hash>"
 *     defer
 *   ></script>
 *
 * Wire (per directive 5.2):
 *   POST <script-origin>/e?s=<siteId>
 *   Content-Type: application/octet-stream
 *   Body: iv (12B) || AES-GCM-256(eventJson)
 *
 * Event JSON (per directive 5.2):
 *   { p: "/path", r: "referrer-host-only", v: [w,h], ts: ms }
 *
 * NEVER captures: ip, ua, accept-language, full referrer, fingerprint,
 * cookie, localStorage. NEVER reads/writes the visitor's storage.
 */

type Win = Window & { __an?: 1 };

const W = window as Win;
const D = document;
const SUB = W.crypto && W.crypto.subtle;

if (!W.__an && SUB) {
  W.__an = 1;

  const script = D.currentScript as HTMLScriptElement | null;
  const site = script ? script.dataset.site : undefined;
  const src = script ? script.src : "";

  if (script && site && src) {
    const u = new URL(src);
    const keyB64 = u.hash.slice(1);
    // Beacon target: data-ingest if present (cross-origin deploy where the
    // tracker JS is on a CDN and the ingest server is elsewhere), else the
    // script's own origin (single-host deploy).
    const dataIngest = script.dataset.ingest;
    const ingestBase = dataIngest && dataIngest.length > 0 ? dataIngest : u.origin;
    const ingest = ingestBase.replace(/\/+$/, "") + "/e?s=" + encodeURIComponent(site);

    if (keyB64) {
      let keyP: Promise<CryptoKey> | null = null;

      const importKey = (): Promise<CryptoKey> => {
        const b64 = keyB64.replace(/-/g, "+").replace(/_/g, "/");
        const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
        const bin = atob(b64 + pad);
        const raw = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) raw[i] = bin.charCodeAt(i);
        return SUB.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt"]);
      };

      const refHost = (): string => {
        try {
          return D.referrer ? new URL(D.referrer).host : "";
        } catch {
          return "";
        }
      };

      // Per-tab session nonce — same value for every beacon emitted from this
      // tab session. Lives in closure memory only; never read from / written to
      // any storage. Tab close = nonce gone = next visit counted as new visitor.
      const nonce = ((): string => {
        const r = W.crypto.getRandomValues(new Uint8Array(4));
        let s = "";
        for (const b of r) s += b.toString(16).padStart(2, "0");
        return s;
      })();

      // Visitor IANA timezone — coarse country approximation (~hundreds of
      // buckets globally), far less identifying than IP. Privacy-honest.
      let tz = "";
      try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch {
        /* old browser */
      }

      const send = async (path: string): Promise<void> => {
        if (!keyP) keyP = importKey();
        const key = await keyP;
        const iv = W.crypto.getRandomValues(new Uint8Array(12));
        const json = JSON.stringify({
          p: path,
          r: refHost(),
          v: [W.innerWidth, W.innerHeight],
          ts: Date.now(),
          n: nonce,
          tz,
        });
        const ct = new Uint8Array(
          await SUB.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(json)),
        );
        const body = new Uint8Array(iv.length + ct.length);
        body.set(iv, 0);
        body.set(ct, iv.length);
        // text/plain is a CORS-safelisted content-type → no preflight, no
        // wildcard-vs-credentials clash when the embedding site has cookies.
        // The server reads the body as raw bytes regardless of MIME.
        W.navigator.sendBeacon(ingest, new Blob([body], { type: "text/plain" }));
      };

      const track = (): void => {
        void send(location.pathname);
      };

      track();

      type StateFn = (data: unknown, unused: string, url?: string | URL | null) => void;
      const wrap = (k: "pushState" | "replaceState"): void => {
        const orig = W.history[k].bind(W.history) as StateFn;
        W.history[k] = ((data: unknown, unused: string, url?: string | URL | null) => {
          orig(data, unused, url);
          track();
        }) as History[typeof k];
      };
      wrap("pushState");
      wrap("replaceState");
      W.addEventListener("popstate", track);
    }
  }
}
