create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'billing_payment_status'
  ) then
    create type public.billing_payment_status as enum (
      'pending',
      'approved',
      'declined',
      'voided',
      'error'
    );
  end if;
end $$;

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'wompi',
  plan_id text not null check (plan_id in ('pro_monthly', 'pro_annual')),
  provider_reference text not null,
  provider_transaction_id text,
  amount_in_cents bigint not null check (amount_in_cents > 0),
  currency text not null check (currency = 'COP'),
  status public.billing_payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_payments_provider_reference_key
  on public.billing_payments (provider_reference);

create unique index if not exists billing_payments_provider_transaction_id_key
  on public.billing_payments (provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists billing_payments_user_id_status_idx
  on public.billing_payments (user_id, status);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'wompi',
  event_id text,
  event_hash text not null,
  event_type text,
  processed boolean not null default false,
  processed_at timestamptz,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists billing_webhook_events_event_hash_key
  on public.billing_webhook_events (event_hash);

create unique index if not exists billing_webhook_events_provider_event_id_key
  on public.billing_webhook_events (provider, event_id)
  where event_id is not null;

create or replace function public.set_updated_at_billing_payments()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_billing_payments_updated_at on public.billing_payments;

create trigger set_billing_payments_updated_at
before update on public.billing_payments
for each row
execute function public.set_updated_at_billing_payments();

alter table public.billing_payments enable row level security;
alter table public.billing_webhook_events enable row level security;

alter table public.billing_payments force row level security;
alter table public.billing_webhook_events force row level security;

drop policy if exists "Users can view own billing payments" on public.billing_payments;

create policy "Users can view own billing payments"
on public.billing_payments
for select
to authenticated
using (auth.uid() = user_id);

revoke all on table public.billing_payments from anon;
revoke all on table public.billing_payments from authenticated;
revoke all on table public.billing_webhook_events from anon;
revoke all on table public.billing_webhook_events from authenticated;

grant select on public.billing_payments to authenticated;

revoke execute on function public.set_updated_at_billing_payments() from anon;
revoke execute on function public.set_updated_at_billing_payments() from authenticated;
revoke execute on function public.set_updated_at_billing_payments() from public;

alter function public.set_updated_at_billing_payments() set search_path = public;
