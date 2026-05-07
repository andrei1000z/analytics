# Working in this repository

This is **Analytics** — a privacy-first, EU-sovereign, zero-knowledge web analytics platform.
The full architectural and design directive (the "Liquid Glass 2026 / EU Privacy-First Stack")
governs every decision here. Read it before writing code. Key invariants below.

## Stack

- **Dashboard:** React 19 + Vite 7 + TypeScript ~5.8 + Tailwind **3.4** (NOT v4) + framer-motion 12 + lucide-react + Zustand 5 + fuse.js 7
- **Native shell:** Tauri 2 (Phase 6+)
- **Tracker:** vanilla TS, ≤1 KB minified+gzipped, NO deps (Phase 3)
- **Ingest:** Rust + axum + sqlx + SQLite (Phase 4)
- **Crypto:** WebCrypto (PBKDF2 200k + AES-GCM 256)
- **Auth:** Passkeys via `@simplewebauthn/server` (Phase 6)

## Non-negotiable privacy invariants

1. No PII at rest. Server stores `(siteId, time-bucket, ciphertext)` only.
2. No cookies or `localStorage` on the visitor's browser.
3. No third-party CDN at runtime in production. Self-hosted fonts + tracker.
4. No IPs at rest. Hashed at TLS terminator with daily-rotating salt, retention <24h.
5. EU jurisdiction only for ingest/storage/processing. Forbidden: AWS, GCP, Azure, Vercel/Netlify Functions, Cloudflare Workers, Fly.io, Render, Railway, DigitalOcean.

## Critical Tailwind trap

CSS-var color tokens (`line`, `soft-elev`, `text-main`, etc.) use the **channel-triplet pattern**:

```css
:root { --line: 229 231 235; }
```

```js
colors: { line: "rgb(var(--line) / <alpha-value>)" }
```

This makes both solid (`border-line`) and opacity-modified (`border-line/70`) classes work. **Do NOT** define CSS vars as full `rgb(229, 231, 235)` strings — Tailwind 3.4 cannot inject `<alpha-value>` and opacity modifiers will silently fail.

## Forbidden libraries

❌ Tailwind v4, react-icons, heroicons, MUI/Chakra/Mantine/Ant Design, axios/swr/react-query, redux/mobx/recoil/jotai, styled-components/emotion, `window.alert/confirm/prompt`, `Loader2 + animate-spin`, Auth0/Clerk/Supabase Auth, Sentry/Datadog/LogRocket/PostHog (visitor-side), shadcn/ui as-is.

## Quality gates (every commit)

- `pnpm typecheck` exits 0
- No `any`, no `console.log`, no orphan `// TODO`
- `pnpm build` succeeds for changes that touch the dashboard
- Conventional commit messages with `Co-Authored-By` trailer when AI-assisted

## Build phases (don't skip)

- **Phase 0** — bootstrap (this commit) ✓
- **Phase 1** — shell UI: sidebar, command palette, settings modal, empty states
- **Phase 2** — local-first analytics shell (LibSQL + KPI cards + charts)
- **Phase 3** — tracker (≤1 KB)
- **Phase 4** — Rust ingest server
- **Phase 5** — live dashboard (WS + WebCrypto decrypt in browser)
- **Phase 6** — Passkeys auth + Tauri desktop
- **Phase 7** — multi-device sync
- **Phase 8** — production deploy (Hetzner / Scaleway / Pi)

## Communication

User language is Romanian. Respond in Romanian unless instructed otherwise.
