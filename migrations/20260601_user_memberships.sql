do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'membership_tier'
  ) then
    create type public.membership_tier as enum ('free', 'member', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'membership_status'
  ) then
    create type public.membership_status as enum ('active', 'trialing', 'past_due', 'canceled', 'expired', 'suspended');
  end if;
end $$;

create table if not exists public.user_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier public.membership_tier not null default 'free',
  status public.membership_status not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  provider text,
  provider_subscription_id text,
  auto_renew boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_memberships_provider_subscription_id_key
  on public.user_memberships (provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists user_memberships_tier_status_idx
  on public.user_memberships (tier, status);

create index if not exists user_memberships_ends_at_idx
  on public.user_memberships (ends_at);

create or replace function public.set_updated_at_user_memberships()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_memberships_updated_at on public.user_memberships;

create trigger set_user_memberships_updated_at
before update on public.user_memberships
for each row
execute function public.set_updated_at_user_memberships();

alter table public.user_memberships enable row level security;

drop policy if exists "Enable users to view their own memberships" on public.user_memberships;

create policy "Enable users to view their own memberships"
on public.user_memberships
for select
to authenticated
using (auth.uid() = user_id);

grant select on public.user_memberships to authenticated;

create or replace function public.handle_new_user_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_memberships (user_id, tier, status, starts_at, ends_at)
  values (new.id, 'free', 'active', now(), null)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_membership on auth.users;

create trigger on_auth_user_created_user_membership
after insert on auth.users
for each row
execute function public.handle_new_user_membership();

insert into public.user_memberships (user_id, tier, status, starts_at, ends_at)
select u.id, 'free', 'active', now(), null
from auth.users u
on conflict (user_id) do nothing;