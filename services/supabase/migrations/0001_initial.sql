-- analytics-supabase migration 0001 — initial schema.
-- Server stores ciphertext only. Even with full database access an attacker
-- without per-site passphrase sees opaque bytes. Enable in Supabase SQL editor
-- or via `supabase db push` from the Supabase CLI.

create table if not exists public.events (
  id           bigserial primary key,
  site_id      bytea     not null,
  time_bucket  bigint    not null,
  received_at  bigint    not null,
  ciphertext   bytea     not null,
  inserted_at  timestamptz not null default now()
);

create index if not exists idx_events_site_bucket
  on public.events (site_id, time_bucket desc);

-- Allow public READ via anon key. Anyone who knows a roomId can pull rows for
-- it, but rows are AES-GCM-256-encrypted with the operator's siteKey — they
-- decrypt to nothing useful without the passphrase. This is the
-- zero-knowledge invariant.
alter table public.events enable row level security;

drop policy if exists "anon read events" on public.events;
create policy "anon read events"
  on public.events
  for select
  to anon, authenticated
  using (true);

-- Inserts only via the Edge Function (service-role key). No anon insert.

-- Realtime publication for live INSERT streaming to the dashboard.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
