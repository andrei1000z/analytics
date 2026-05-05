-- EuroAnalytics — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  url         text        not null,
  referrer    text,
  device_type text,
  timestamp   timestamptz not null default now()
);

create index if not exists page_views_timestamp_idx
  on public.page_views (timestamp desc);

create index if not exists page_views_url_idx
  on public.page_views (url);

-- Row-Level Security: anon key is allowed to insert (the tracker beacon),
-- but reads stay server-side only (use the service_role key in your dashboard
-- backend, never the anon key, when reading aggregated data).
alter table public.page_views enable row level security;

drop policy if exists "anon can insert page_views" on public.page_views;
create policy "anon can insert page_views"
  on public.page_views
  for insert
  to anon
  with check (true);

drop policy if exists "service role can read page_views" on public.page_views;
create policy "service role can read page_views"
  on public.page_views
  for select
  to service_role
  using (true);
