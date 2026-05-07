# Deployment

Three EU-sovereign paths, in order of recommendation. Filled in fully during Phase 8.

## 1. Hetzner Cloud — recommended

**Why:** German jurisdiction (BDSG + GDPR), CX22 instance €4.51/mo, mature ecosystem.

**Sketch:**
- Provision CX22 (4 GB RAM, 40 GB SSD) in `nbg1` (Nuremberg) or `fsn1` (Falkenstein)
- Caddy for automatic TLS (Let's Encrypt) terminating at the host
- `docker compose up -d` with the ingest server image (Phase 4)
- DNS at INWX (German registrar) or Gandi (French)
- Endpoint health: `curl https://ingest.<domain>.eu/healthz`

## 2. Scaleway Serverless Containers

**Why:** French jurisdiction, pay-per-request, ~€0–1/month for personal use.

**Sketch:**
- Push image to Scaleway Container Registry (`fr-par`)
- Configure Serverless Container with `min_instances=0, max_instances=5`
- Set `LISTEN_PORT=8080`
- Bind custom domain via the Scaleway console

## 3. Raspberry Pi + Cloudflare Tunnel — maximum sovereignty

**Why:** €0/month after hardware, data physically stays at home, no third-party server access.

**Important:** Cloudflare Tunnel acts as a **dumb opaque tunnel** here — it relays ciphertext only, has no decryption key, can't see content. CF still sees traffic patterns and source IPs, which is why we hash IPs at the Pi-side TLS terminator.

**Sketch:**
- Raspberry Pi 4/5 with the ingest server compiled for `aarch64-unknown-linux-musl`
- `cloudflared tunnel create analytics-ingest`
- Map subdomain `ingest.<domain>.eu` to the tunnel
- Set Cloudflare's DNS proxy to **DNS-only** mode (orange cloud OFF) to bypass CF's TLS termination so the Pi handles TLS directly — guarantees the cleartext IP never reaches Cloudflare

## Static dashboard PWA

The dashboard ships only HTML+JS+CSS — encrypted data flows visitor → ingest → dashboard browser, **never through the static host**. Therefore Vercel / Cloudflare Pages are acceptable for the PWA build only.

```jsonc
// vercel.json
{
  "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @analytics/dashboard build",
  "outputDirectory": "apps/dashboard/dist"
}
```

## Forbidden in the data path

❌ AWS, GCP, Azure (US CLOUD Act applies even to EU regions)
❌ Vercel/Netlify Functions, Cloudflare Workers (US-incorporated)
❌ Fly.io, Render, Railway, Heroku, DigitalOcean (US)
