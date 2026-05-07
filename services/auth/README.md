# @analytics/auth

Bun + Hono + `@simplewebauthn/server` passkey auth service.
**Optional** — only needed for **multi-operator** deployments. Single-operator
setups use the dashboard's local-only WebAuthn gate, no server required.

## Endpoints

| Method | Path                      | Purpose                                  |
|--------|---------------------------|------------------------------------------|
| GET    | `/healthz`                | Liveness                                 |
| GET    | `/auth/me`                | `{authenticated: boolean, userId?: string}` |
| POST   | `/auth/register/options`  | Returns WebAuthn registration challenge |
| POST   | `/auth/register/verify`   | Verifies attestation, sets session cookie |
| POST   | `/auth/login/options`     | Returns WebAuthn auth challenge          |
| POST   | `/auth/login/verify`      | Verifies assertion, sets session cookie  |
| POST   | `/auth/logout`            | Clears session cookie                    |

## Run locally

```bash
cd services/auth
bun install
RP_ID=localhost ORIGIN=http://localhost:5173 bun run dev
```

## Deploy

```bash
docker build -t analytics-auth .
docker run -p 3001:3001 \
  -e RP_ID=auth.your-domain.eu \
  -e ORIGIN=https://dashboard.your-domain.eu \
  -e ALLOWED_ORIGINS=https://dashboard.your-domain.eu \
  -e DATABASE_PATH=/data/auth.db \
  -v /opt/analytics-auth/data:/data \
  analytics-auth
```

Front it with the same Caddy reverse-proxy used for the ingest server. The
domain hosting this service must match `RP_ID` exactly (WebAuthn RP-ID is
strict — subdomain inheritance only, no wildcards).

## Threat model

- The single-tenant model assumes one trusted operator. Anyone with the URL
  can register the FIRST passkey; further registrations need an active session.
- Sessions are 24h, opaque random UUIDs in HTTP-only `SameSite=Strict` cookies.
- Lost passkey = locked out. Run `sqlite3 auth.db "DELETE FROM credentials"` on
  the host to reset (admin recovery is intentionally manual).

## Wiring from the dashboard

When `AUTH_BASE_URL` is exposed to the build, the dashboard's `AuthGate`
falls forward to this service. Without it, `AuthGate` runs the local-only
flow (Touch ID etc., no server).

Phase 6 dashboard ships with the local-only flow; switching to the server
flow is a small client-side change once the service is deployed.
