-- Wendy Coach Supabase schema
-- Run in Supabase Dashboard → SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  openai_api_key text not null default '',
  openai_model text not null default 'gpt-4o-mini',
  embedding_model text not null default 'text-embedding-3-small',
  updated_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric not null default 0,
  exit_price numeric not null default 0,
  quantity numeric not null default 0,
  pnl numeric not null default 0,
  setup text not null default '',
  notes text not null default '',
  emotions text not null default '',
  mistakes text not null default '',
  lessons text not null default '',
  outcome text not null check (outcome in ('win', 'loss', 'breakeven')),
  created_at timestamptz not null default now()
);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  market_notes text not null default '',
  pnl_notes text not null default '',
  mood text not null default '',
  goals text not null default '',
  reflections text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  summary text not null default '',
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  encouragement text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('trade', 'journal')),
  ref_id uuid not null,
  date date not null,
  text text not null,
  embedding jsonb not null,
  unique (user_id, type, ref_id)
);

create index if not exists trades_user_date_idx on public.trades (user_id, date desc);
create index if not exists journals_user_date_idx on public.journals (user_id, date desc);
create index if not exists embeddings_user_idx on public.embeddings (user_id);

alter table public.user_settings enable row level security;
alter table public.trades enable row level security;
alter table public.journals enable row level security;
alter table public.coach_reviews enable row level security;
alter table public.embeddings enable row level security;

create policy "user_settings_select" on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trades_select" on public.trades for select using (auth.uid() = user_id);
create policy "trades_insert" on public.trades for insert with check (auth.uid() = user_id);
create policy "trades_update" on public.trades for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trades_delete" on public.trades for delete using (auth.uid() = user_id);

create policy "journals_select" on public.journals for select using (auth.uid() = user_id);
create policy "journals_insert" on public.journals for insert with check (auth.uid() = user_id);
create policy "journals_update" on public.journals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journals_delete" on public.journals for delete using (auth.uid() = user_id);

create policy "coach_reviews_select" on public.coach_reviews for select using (auth.uid() = user_id);
create policy "coach_reviews_insert" on public.coach_reviews for insert with check (auth.uid() = user_id);
create policy "coach_reviews_update" on public.coach_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "embeddings_select" on public.embeddings for select using (auth.uid() = user_id);
create policy "embeddings_insert" on public.embeddings for insert with check (auth.uid() = user_id);
create policy "embeddings_update" on public.embeddings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "embeddings_delete" on public.embeddings for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
