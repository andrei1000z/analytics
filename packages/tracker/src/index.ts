/**
 * @analytics/tracker — vanilla TS, ≤1 KB minified+gzipped, NO deps.
 *
 * Contract (per directive section 5.5, implemented in Phase 3):
 *  - Read `data-site` from own <script> tag (public PBKDF2-derived siteId)
 *  - Read encryption key material from script URL hash fragment
 *  - Encrypt event in-browser via WebCrypto.subtle.encrypt (AES-GCM 256)
 *  - Send via navigator.sendBeacon (non-blocking, survives page unload)
 *  - NEVER read/write cookies or localStorage on the visitor
 *  - NEVER capture: IP, user agent, accept-language, referrer beyond hostname,
 *    canvas/font/audio fingerprint
 *  - Wire shape: { p: "/path", r: "referrer-host", v: [w, h], ts: ms }
 */

export {};
