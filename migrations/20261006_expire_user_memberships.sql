-- BILL-8: a Pro membership past its ends_at becomes expired/free in the stored row.
-- Same rule as src/lib/membership.ts: tier member, status active or trialing, ends_at set and not
-- after now. admin, a null ends_at and every other status are never touched.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.expire_user_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  -- One statement, so a renewal that already moved ends_at into the future does not match and one
  -- that commits afterwards overwrites the row with member/active (the webhook upsert sets every
  -- column changed here).
  update public.user_memberships
  set status = 'expired',
      tier = 'free'
  where tier = 'member'
    and status in ('active', 'trialing')
    and ends_at is not null
    and ends_at <= now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke execute on function public.expire_user_memberships() from anon;
revoke execute on function public.expire_user_memberships() from authenticated;
revoke execute on function public.expire_user_memberships() from public;

-- Scheduling by name replaces a job of the same name, so re-running this does not duplicate it.
-- Fails open if a run fails: rows stay as stored until the next hour; the profile endpoints already
-- report them as expired through src/lib/membership.ts.
select cron.schedule(
  'expire-user-memberships',
  '0 * * * *',
  $cron$select public.expire_user_memberships()$cron$
);
