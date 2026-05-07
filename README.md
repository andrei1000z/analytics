# Analytics

> Privacy-first, EU-sovereign, zero-knowledge web analytics.
> Liquid Glass 2026 · React 19 · Vite 7 · Tauri 2 · Rust ingest.

The server stores ciphertext only and is **mathematically incapable** of reading your traffic.
No cookies. No fingerprinting. No US CLOUD Act exposure. Open-source, self-hostable.

## Status — Phase 0: Bootstrap

Monorepo skeleton + design tokens + bootstrap preview screen.

```
analytics/
├── apps/
│   └── dashboard/        Vite + React + TS + Tailwind 3.4 + framer-motion
├── packages/
│   └── tracker/          ≤1 KB embeddable JS (Phase 3)
├── services/
│   └── ingest/           Rust + axum (Phase 4)
└── docs/
    └── ARCHITECTURE.md   Threat model + data flow + privacy invariants
```

## Quickstart

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev          # apps/dashboard at http://localhost:5173
pnpm build        # production build
pnpm typecheck    # tsc --noEmit across all workspaces
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for EU-sovereign hosting paths
(Hetzner DE / Scaleway FR / OVH FR / Raspberry Pi + Cloudflare Tunnel).

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the threat model,
data flow, and zero-knowledge identity / encryption protocol.

## License

AGPL-3.0-only. The server source code is yours to inspect, audit, and self-host.
