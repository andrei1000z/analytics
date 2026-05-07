# @analytics/tracker

Vanilla TypeScript tracker. **≤1 KB** minified + gzipped. **No dependencies.**

## Phase 3 deliverable

- esbuild pipeline → ES2020 IIFE
- minify + gzip-size assertion in CI (fail build if > 1024 bytes)
- E2E test on a static demo site
- Embed snippet:

```html
<script
  src="https://cdn.<your-domain>.eu/t.js#<key-material>"
  data-site="<public-site-id>"
  defer
></script>
```

The fragment after `#` is **never** sent to the server (browsers strip it from
network requests). It carries the AES-GCM key material for the visitor's
session-bound encryption.

## Privacy guarantees (cannot be relaxed)

- No cookies, no localStorage, no sessionStorage on the visitor
- No fingerprint surface beyond `[viewport.w, viewport.h]`
- Referrer is reduced to its hostname before hashing (no URL paths)
- Tracker payload is AES-GCM-encrypted before `sendBeacon`

See [`/docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for full threat model.
