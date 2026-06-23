-- Tradovate connection + trade sync deduplication
-- Run in Supabase SQL Editor

alter table public.trades
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text;

create unique index if not exists trades_user_external_id_idx
  on public.trades (user_id, external_id)
  where external_id is not null;

create table if not exists public.tradovate_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  password text not null,
  environment text not null default 'demo' check (environment in ('demo', 'live')),
  access_token text,
  token_expires_at timestamptz,
  tradovate_user_id bigint,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tradovate_connections enable row level security;

create policy "tradovate_connections_select"
  on public.tradovate_connections for select
  using (auth.uid() = user_id);

create policy "tradovate_connections_insert"
  on public.tradovate_connections for insert
  with check (auth.uid() = user_id);

create policy "tradovate_connections_update"
  on public.tradovate_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tradovate_connections_delete"
  on public.tradovate_connections for delete
  using (auth.uid() = user_id);
