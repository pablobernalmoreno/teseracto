# Design

## Context

See proposal.md for why. Today the Wompi webhook is the only writer of `user_memberships` after sign-up. It upserts `member`/`active` with a new `ends_at` and counts from `max(now, ends_at)` (`src/app/api/billing/wompi/webhook/route.ts:198-215`), so a lapsed membership renews correctly whatever its stored status is. Two profile routes read the row and pass it through, each with the same inline fallback to a free membership (`src/app/api/dashboard/profile/route.ts:57-71`, `src/app/api/dashboard/profile/current/route.ts:98-112`). Nothing else reads `tier`, `status` or `ends_at`.

Facts checked on the live project (read-only): `pg_cron` 1.6.4 is available and not installed; the `postgres` role has `rolbypassrls`, so the forced row-level security on `user_memberships` does not block an `UPDATE` run as `postgres`; `handle_new_user_membership` is the existing `SECURITY DEFINER` function owned by `postgres`, with execute revoked from `anon`, `authenticated` and `public` (`migrations/20260603_db_function_permissions_lockdown.sql:5-7`). Enums are `membership_tier` (`free`, `member`, `admin`) and `membership_status` (`active`, `trialing`, `past_due`, `canceled`, `expired`, `suspended`).

## Goals / Non-Goals

**Goals:**

- A lapsed membership is never reported as active, even in the window before the job runs.
- The stored row converges to `expired`/`free` without any request being made.

**Non-Goals:**

- Enforcing limits by tier (`GAP-1`), auto-renew, the `canceled` status, notifying users.
- Changing the webhook. It already counts from now after expiry.

## Decisions

**D1. One pure helper, `expireMembership(membership, now = new Date())`, in `src/lib/membership.ts`.** It is generic over the membership shape so both routes' local `UserMembership` interfaces satisfy it, and it returns the same reference when nothing changes. Alternative: expire inside each route. Rejected: the rule would live in two places, like the fallback already does (DRY).

**D2. The rule, shared by the helper and the SQL.** Expire when `tier = member`, `status in (active, trialing)`, `ends_at` is not null and `ends_at <= now`. Result: `status = expired`, `tier = free`, `ends_at` kept. `admin` and a null `ends_at` never expire. `past_due`, `canceled` and `suspended` are left alone because no code produces them and their meaning is undecided. The comparison is `<=` so "exactly at the end" is expired in both places.

**D3. Both layers, not one.** The read-time helper makes the API correct immediately; the job makes the stored data correct for anything that reads the table directly (reports, a future tier check, support queries). The job alone leaves up to an hour of wrong answers; the helper alone leaves wrong data. Alternative: persist from the request path (a write on `GET`). Rejected: a read endpoint that writes needs the service role and races the webhook.

**D4. `public.expire_user_memberships()` returns the number of rows changed, as a single atomic `UPDATE ... WHERE <rule>`.** `SECURITY DEFINER`, `set search_path = public`, execute revoked from `anon`, `authenticated` and `public`, following `handle_new_user_membership`. Because the predicate is evaluated per row at update time, a webhook renewal that already moved `ends_at` into the future does not match, and a renewal that commits after the job simply overwrites the row with `member`/`active`; the webhook's upsert sets every field the job touches, so the end state is correct either way. Returning the count lets a branch test and a manual run show what changed.

**D5. Schedule hourly with `pg_cron`.** `create extension if not exists pg_cron with schema pg_catalog` and `cron.schedule('expire-user-memberships', '0 * * * *', ...)`; scheduling by name replaces an existing job of that name, so re-running the migration does not duplicate it. Hourly bounds the stored-data lag at one hour while the helper covers the reads. Alternatives: a Next.js cron route (needs a secret, a hosting scheduler and the service role in another path) and a trigger (fires only on writes, never when time passes).

**D6. Error handling states.**

- _Helper, `ends_at` that does not parse:_ fails open to returning the membership as stored (do not take Pro away on bad data); the job handles it, since Postgres has already validated `timestamptz`. Complement: a parseable past date, which is expired.
- _Helper, membership is `null`:_ the routes keep their existing free fallback; the helper is not called on it.
- _Job fails or does not run:_ rows stay `active` until the next successful run (fails open for stored data); reads are still correct through the helper, so the user-visible effect is none. Complement: a successful run, which expires every matching row.
- _Profile route read errors:_ unchanged, still 500.

## Risks / Trade-offs

- [The first run changes the one existing stale row (user data)] → Run a read-only `select` of matching rows first and tell the user which row; applying the migration to the live project is the user's decision, not part of apply by default.
- [Helper and SQL drift] → Both state the same rule; the tests name each case (boundary, admin, null, other statuses) and the branch test runs the same table of cases against the function.
- [`pg_cron` is not enabled on the project] → The migration creates the extension; if the project's plan or settings refuse it, the migration fails as a whole and nothing is half-applied, so the helper keeps the API correct while it is sorted out.
- [Job runs as `postgres`, relying on `BYPASSRLS` through a forced-RLS table] → Verified on the role; the branch test proves the `UPDATE` changes a row.
- [An hour of stale stored data] → Accepted; the helper covers reads.

## Migration Plan

1. Land the helper, route changes and tests, and the migration file, with the docs commit first (spec delta and `GAP-5`).
2. Verify the function on a Supabase branch (create the branch, apply the migration, run the table of cases, delete the branch), then show the user the read-only list of rows the first run would change.
3. On the user's go-ahead, apply the migration to the live project and regenerate `src/types/database.types.ts`.
4. Rollback: `select cron.unschedule('expire-user-memberships')` and `drop function public.expire_user_memberships()` in a new dated migration; rows already expired stay expired, and a new payment makes them active again through the webhook.
