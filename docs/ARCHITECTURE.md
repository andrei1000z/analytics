# Architecture

## Identity model — passphrase, not accounts

The operator chooses a passphrase at site onboarding. The system **never** receives it; only deterministic derivatives:

```ts
// PBKDF2-HMAC-SHA-256, 200_000 iterations
roomId  = PBKDF2(passphrase, "salt-room-v1", 200_000, 256-bit)   // public, server learns
siteKey = PBKDF2(passphrase, "salt-key-v1",  200_000, AES-GCM 256) // private, never leaves device
```

Same passphrase on any device → same `roomId` + `siteKey` → automatic pairing.
**No accounts, no password reset, no recovery.** Lost passphrase = unrecoverable data. That's the security guarantee, not a bug.

Onboarding generates a 6-word Diceware passphrase by default and offers a print/PDF export of the recovery sheet.

## Wire protocol

### Tracker → Ingest (per pageview)

```http
POST https://ingest.<domain>.eu/e
Content-Type: application/octet-stream
Body: AES-GCM(iv ‖ event-json)
```

Where:

```ts
event-json = { p: "/path", r: "referrer-host-only", v: [w, h], ts: ms }
```

**Never** sent: ip, cookie, fingerprint, accept-language, user-agent.
Server stores: `events(site_id, time_bucket, ciphertext)` keyed by `(site_id, time_bucket)`. Body is opaque.

### Dashboard ↔ Ingest (live + slice fetch)

```
WS wss://ingest.<domain>.eu/sync?room=<siteId>
```

Messages:

```jsonc
{"type": "subscribe", "from": <ms>, "to": <ms>}
{"type": "slice", "buckets": [{"t": <ms>, "ciphertext": "<base64>"}]}
{"type": "live", "ciphertext": "<base64>"}
{"type": "ping"} | {"type": "pong"}
```

Dashboard decrypts each bucket in-browser via WebCrypto, aggregates client-side, paints from local LibSQL cache. **Server never decrypts.**

## IP handling (live window only)

At the TLS terminator on the ingest server:

```
daily_salt = HMAC(server_secret, today)
ip_hash    = HMAC-SHA-256(daily_salt, client_ip)
```

The 32-byte hash is kept in memory ≤24h purely for sliding-window bot detection. **Never written to disk. Never paired with `siteId`. Never logged.** Salt rotates daily.

## Threat model

| Adversary | Mitigation |
|---|---|
| Honest-but-curious server operator | No siteKey on server. Sees traffic patterns by `siteId` only. Operators may rotate passphrases periodically if traffic correlation matters. |
| Network MITM / ISP / TLS terminator | TLS 1.3 mandatory. Content already AES-GCM encrypted underneath, so a TLS-terminating proxy still sees ciphertext only. |
| Compromised dashboard device | Passphrase stored in OS keychain (Tauri `tauri-plugin-stronghold` or platform-native). Passkey/biometric required to unlock per session. |
| Supply-chain attack on tracker | ≤1 KB minified, vanilla TS, no deps. SRI on the embed `<script>`. Reproducible build pinned in CI. |
| Lost passphrase | Irrecoverable by design. Loud warning at onboarding + printable recovery sheet. |

## Local-first paint

The dashboard maintains a per-`siteId` LibSQL (SQLite-compatible) cache on disk (Tauri) or IndexedDB (web). Charts render from the cache at 60+ Hz. WebSocket events update the cache; React re-renders react to the cache, not to the wire. This decouples render performance from network latency.

## EU sovereignty enforcement

✅ **Ingest path:** Hetzner DE/FI, Scaleway FR, OVHcloud FR/DE, self-hosted on a Raspberry Pi behind a CF Tunnel (CF as opaque relay).

❌ **Forbidden in data path:** AWS, GCP, Azure (US CLOUD Act, even with EU regions); Vercel/Netlify Functions, Cloudflare Workers (US-incorporated); Fly.io, Render, Railway, Heroku, DigitalOcean (US).

⚠ **Acceptable for static dashboard PWA only** (no data flows through them): Vercel, Cloudflare Pages — they ship HTML/JS/CSS; encrypted bytes flow direct visitor→ingest→browser, bypassing the static host.
