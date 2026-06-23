-- Platform users table: everyone who joins Wendy Coach
-- Run in Supabase SQL Editor after 001_wendy_coach_schema.sql

create table if not exists public.platform_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  provider text not null default 'email',
  joined_at timestamptz not null default now(),
  last_sign_in_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists platform_users_joined_at_idx on public.platform_users (joined_at desc);
create index if not exists platform_users_email_idx on public.platform_users (email);

alter table public.platform_users enable row level security;

create policy "platform_users_select_own"
  on public.platform_users for select
  using (auth.uid() = id);

-- Backfill anyone who already signed up before this migration
insert into public.platform_users (id, email, full_name, provider, joined_at, last_sign_in_at)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  coalesce(u.raw_app_meta_data->>'provider', 'email'),
  u.created_at,
  u.last_sign_in_at
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  provider = excluded.provider,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

-- When a new user joins, add them to platform_users + user_settings
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_provider text;
  user_name text;
begin
  user_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');
  user_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  );

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.platform_users (id, email, full_name, provider, joined_at, last_sign_in_at)
  values (
    new.id,
    coalesce(new.email, ''),
    user_name,
    user_provider,
    coalesce(new.created_at, now()),
    new.last_sign_in_at
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    provider = excluded.provider,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();

  return new;
end;
$$;

-- Keep last_sign_in_at in sync when user logs in again
create or replace function public.sync_platform_user_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_users
  set
    email = coalesce(new.email, email),
    full_name = coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      full_name
    ),
    provider = coalesce(new.raw_app_meta_data->>'provider', provider),
    last_sign_in_at = new.last_sign_in_at,
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_sign_in on auth.users;
create trigger on_auth_user_sign_in
  after update of last_sign_in_at on auth.users
  for each row
  when (old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute function public.sync_platform_user_sign_in();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
