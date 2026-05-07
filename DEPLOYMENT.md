# Deployment

Three EU-sovereign paths in order of recommendation. The static dashboard PWA
is deployable on Vercel/Cloudflare Pages because **no encrypted data flows
through it** — the bytes go visitor → ingest → dashboard browser, bypassing
the static host.

| Path | Cost / mo | Jurisdiction | Sovereignty |
|---|---|---|---|
| Hetzner CX22 + Caddy + Docker | €4.51 | DE / FI | High |
| Scaleway Serverless Containers | ≈ €0–1 | FR | High |
| Raspberry Pi + Cloudflare Tunnel | €0 | At home + opaque CF relay | Maximum |

---

## 1. Hetzner Cloud — recommended

### 1.1 Provisioning

1. Sign up at hetzner.com (German jurisdiction, BDSG + GDPR).
2. Create a CX22 instance (4 GB RAM, 40 GB SSD) in `nbg1` (Nuremberg) or
   `fsn1` (Falkenstein) or `hel1` (Helsinki).
3. Add your SSH key during creation. Disable root password login.

### 1.2 First-run hardening

```bash
# As the SSH user Hetzner gave you (typically root on first boot).
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Lock root SSH and password auth.
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# UFW: only 22/tcp + 80/tcp + 443/tcp,udp.
apt-get update && apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp   # HTTP/3
ufw --force enable

# Auto security updates.
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 1.3 Docker + Compose

```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker deploy
# Log out + back in so the docker group takes effect.
```

### 1.4 DNS

At your registrar (INWX / Gandi / OVH — keep it European):

| Type | Name                  | Value           |
|------|-----------------------|-----------------|
| A    | `ingest.example.eu`   | `<your-vps-ip>` |
| AAAA | `ingest.example.eu`   | `<your-vps-ipv6>` |

Wait for propagation (`dig ingest.example.eu` should resolve to your VPS).

### 1.5 Deploy

On the VPS as `deploy`:

```bash
git clone https://github.com/<you>/analytics.git
cd analytics/services/ingest
cp .env.example .env
# Edit .env: set DOMAIN=ingest.example.eu and a fresh INGEST_SECRET.
sed -i "s/replace-with-32-bytes-of-hex/$(openssl rand -hex 32)/" .env
sed -i "s|ingest.example.eu|ingest.your-domain.eu|" .env

docker compose up -d --build
docker compose logs -f
```

Verify:

```bash
curl https://ingest.your-domain.eu/healthz
# {"status":"ok","service":"analytics-ingest","version":"0.1.0"}
```

Caddy will obtain a Let's Encrypt certificate automatically on first request.

### 1.6 Updates

```bash
git pull
docker compose up -d --build
docker compose ps   # confirms both containers are healthy
```

---

## 2. Scaleway Serverless Containers (FR)

For pay-per-request, pay-per-minute usage. Often €0 for personal traffic.

```bash
# Build + push image (requires scw CLI authenticated).
docker build -t rg.fr-par.scw.cloud/<namespace>/analytics-ingest:latest \
  services/ingest
docker push rg.fr-par.scw.cloud/<namespace>/analytics-ingest:latest

scw container container create \
  name=analytics-ingest \
  region=fr-par \
  registry-image=rg.fr-par.scw.cloud/<namespace>/analytics-ingest:latest \
  port=3000 \
  min-scale=0 max-scale=5 \
  memory-limit=512 \
  cpu-limit=500 \
  environment-variables.LISTEN_ADDR=0.0.0.0:3000 \
  environment-variables.INGEST_SECRET=$(openssl rand -hex 32) \
  environment-variables.DATABASE_URL=sqlite:///tmp/data.db?mode=rwc
```

⚠ Scaleway's serverless filesystem is ephemeral. For durable storage,
mount Scaleway Object Storage as a volume or use a managed Postgres
(also FR jurisdiction). The current SQLite path is acceptable for early
self-hosting; migrate to Postgres for any traffic that matters.

---

## 3. Raspberry Pi + Cloudflare Tunnel — maximum sovereignty

Data never leaves your home. Cloudflare Tunnel relays opaque ciphertext —
they pass it through, they cannot decrypt anything.

### 3.1 Pi setup

```bash
# Raspberry Pi 4/5 with Debian Bookworm.
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin

# Cross-build the ingest binary for aarch64 from your laptop:
docker buildx build --platform linux/arm64 \
  -t analytics-ingest:arm64 \
  --load services/ingest

# Or build natively on the Pi (slower but simpler).
git clone https://github.com/<you>/analytics.git
cd analytics/services/ingest
docker compose up -d --build
```

### 3.2 Cloudflare Tunnel

```bash
# Install cloudflared on the Pi.
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

cloudflared tunnel login
cloudflared tunnel create analytics-ingest
cloudflared tunnel route dns analytics-ingest ingest.your-domain.eu

# /etc/cloudflared/config.yml:
cat <<EOF | sudo tee /etc/cloudflared/config.yml
tunnel: analytics-ingest
credentials-file: /home/$USER/.cloudflared/<tunnel-uuid>.json
ingress:
  - hostname: ingest.your-domain.eu
    service: http://localhost:80
  - service: http_status:404
EOF

sudo systemctl enable --now cloudflared
```

⚠ **Important sovereignty note.** Cloudflare can see traffic patterns
(timestamps, byte counts, source IPs at the edge). They CANNOT decrypt
the payload bytes, which are AES-GCM-256-encrypted by the tracker
before they ever leave the visitor's browser. To minimize CF visibility
into source IPs, set the DNS record to **DNS-only** (gray cloud) once
the tunnel is up — the tunnel terminates TLS at the Pi rather than at
Cloudflare's edge.

---

## Static dashboard PWA

The dashboard ships only HTML/JS/CSS. No encrypted data flows through
the static host — the WebSocket goes directly visitor's browser →
ingest server. So Vercel / Cloudflare Pages are acceptable here.

### Vercel

`vercel.json` is already configured at the repo root.

```bash
# Repository → Vercel project → Production branch: main
# No env vars needed; the dashboard reads ingest URL from operator-side Settings.
```

Vercel will build with `pnpm install --frozen-lockfile && pnpm --filter @analytics/dashboard build` and serve `apps/dashboard/dist`.

### Cloudflare Pages

```
Build command:    pnpm install --frozen-lockfile && pnpm --filter @analytics/dashboard build
Output directory: apps/dashboard/dist
```

---

## Updating the tracker bundle

The tracker `<script>` tag uses a versioned URL like
`https://cdn.example.eu/t.js#<key-fragment>`. To roll out a new tracker:

1. `pnpm build:tracker` locally — verifies the size budget.
2. Upload `packages/tracker/dist/tracker.js` to your CDN with a long
   `Cache-Control: public, max-age=86400, immutable` header.
3. Compute the SRI hash:
   `cat packages/tracker/dist/tracker.js | openssl dgst -sha384 -binary | openssl base64 -A`
4. Embed with SRI:
   ```html
   <script
     src="https://cdn.example.eu/t.js#<key-fragment>"
     data-site="<site-id-pbkdf2>"
     integrity="sha384-<hash>"
     crossorigin="anonymous"
     defer
   ></script>
   ```

Subresource Integrity prevents a compromised CDN from serving a malicious
tracker. The browser refuses to execute mismatched bytes.

---

## Forbidden providers in the data path

❌ AWS, GCP, Azure (US CLOUD Act applies even to EU regions)
❌ Vercel/Netlify Functions, Cloudflare Workers (US-incorporated)
❌ Fly.io, Render, Railway, Heroku, DigitalOcean (US)

The static dashboard build is the only artifact allowed on a US-hosted
edge — and only because no encrypted data flows through it.
