# analytics-ingest

Rust + axum + sqlx + SQLite. Public-facing event collector. **Phase 4.**

## Deployment paths

See [`/DEPLOYMENT.md`](../../DEPLOYMENT.md) for Hetzner DE / Scaleway FR /
Raspberry Pi + Cloudflare Tunnel walkthroughs.

## Privacy guarantees (cannot be relaxed)

- IPs hashed at the TLS terminator with a salt that rotates daily
- Hashed-IP retention < 24h, in-memory only, never persisted
- Stored row shape: `(site_id BLOB, time_bucket INTEGER, ciphertext BLOB)`
- The server has no key. It cannot decrypt anything.

See [`/docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for full threat model.
