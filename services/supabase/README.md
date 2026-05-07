# Supabase backend (alternativă la Pi self-hosted)

Migrează ingest-ul de pe Pi 4 + Cloudflare Tunnel pe Supabase managed Postgres
+ Edge Functions. Avantaje: zero servere de babysit, URL fix permanent, Realtime
WebSocket built-in, free tier suficient pentru proiect personal.

**Caveat sovereignty:** Supabase Inc. e US-incorporated. Cu regiunea
`Frankfurt (eu-central-1)` datele stau fizic în EU dar US CLOUD Act se aplică
companiei. Privacy-ul rămâne intact pentru că tot conținutul e AES-GCM-256
criptat client-side (Supabase fizic nu poate citi). Pentru "produs corporate
EU paranoid" rămâne setup-ul self-hosted (services/ingest).

## Setup în 10 min

### 1. Cont + proiect

1. Mergi pe **https://supabase.com** → Sign up (gratis, fără card)
2. **New project**:
   - Name: `analytics-ingest`
   - Database Password: generat random + salvat în 1Password
   - **Region: `Central EU (Frankfurt)`** ← important, pentru EU data residency
   - Pricing: Free
3. Aștepți ~2 min să provisioneze

### 2. Credentiale

Project Dashboard → **Settings → API** → copiezi:

- **Project URL:** `https://<ref>.supabase.co`
- **anon public key:** `eyJhbGciOi...` (ăsta e safe, public)
- **service_role key:** `eyJhbGciOi...` (NU-l împărtăși — îl folosește doar Edge Function)

### 3. Schema în baza de date

Project Dashboard → **SQL Editor** → New query → copy-paste conținutul lui
`migrations/0001_initial.sql` din acest folder → **Run**.

Trebuie să vezi `Success. No rows returned`.

Verifică în **Table Editor** că tabela `events` apare cu coloanele `id, site_id, time_bucket, received_at, ciphertext, inserted_at`.

### 4. Edge Function

Pe laptop (Windows PowerShell):

```powershell
# Install Supabase CLI (o singură dată)
npm install -g supabase

# Login
supabase login
# (se deschide browser-ul, autorizezi)

# Linkează proiectul tău
cd c:\Users\Andrei\analytics
supabase link --project-ref <project-ref-din-URL>

# Deploy Edge Function
supabase functions deploy e --no-verify-jwt
```

Funcția devine disponibilă la:
`https://<project-ref>.supabase.co/functions/v1/e`

Test:
```powershell
curl.exe -X OPTIONS https://<project-ref>.supabase.co/functions/v1/e -i
```
Trebuie să răspundă cu `204 No Content` + headerele CORS.

### 5. Configurează dashboard-ul

Pe **analytics-seven-steel.vercel.app** → Settings → Endpoints:

- **Supabase URL:** `https://<project-ref>.supabase.co`
- **Supabase Anon Key:** `eyJhbGciOi...` (cea publică)
- **Tracker CDN URL:** `https://analytics-seven-steel.vercel.app`

Salvează.

### 6. Re-creează site-urile

Vechile site-uri foloseau URL-ul de Pi (`roulette-personals...trycloudflare`).
Le ștergi din dashboard și le re-creezi cu același nume + domeniu — primesc
acum snippet-uri care pointează la Edge Function-ul Supabase.

Update CSP-ul pe site-urile tale (Civia etc.) să permită
`https://<project-ref>.supabase.co` în `connect-src`.

### 7. Pi devine opțional

După ce confirmi că merge prin Supabase, poți opri Pi-ul. Datele criptate
de pe Pi rămân în SQLite local — dacă vrei să le importi în Supabase, există
un script de migrare (TODO Phase 8.5). Altfel pierderea e doar istoricul
înainte de migrare.

## Cost real

Supabase Free tier:
- 500 MB database
- 2 GB bandwidth/lună
- 500K Edge Function invocations/lună
- Unlimited Realtime connections

Pentru ~10 site-uri × 1000 vizite/zi = 300k events/lună:
- Database: ~50 MB (event-uri criptate ~150 bytes fiecare)
- Bandwidth: ~50 MB
- Function calls: 300k

Toate sub limit. **Cost: €0/lună.**

Dacă crești la 100+ site-uri sau 1M+ vizite/lună, treci pe Pro tier ($25/lună)
sau revii la self-hosted.
