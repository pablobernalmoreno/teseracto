# Proposal

## Why

A Pro membership never ends. The only code that writes `user_memberships` after sign-up is the Wompi webhook, which sets `tier: member` and `status: active` with a new `ends_at` (`src/app/api/billing/wompi/webhook/route.ts:203-217`). Nothing sets `status: expired` or moves `tier` back to `free` when `ends_at` passes, there is no scheduled job (`pg_cron` is not installed) and the profile routes pass the stored values through. The live table has one `member`/`active` row, paid through Wompi with no auto-renew, whose `ends_at` was 2026-08-27 and still reads `active`. Plan limits are not enforced yet (`spec/SPEC.md` GAP-1), so the wrong state has no effect on what a user can do today, but any feature that starts reading `tier` or `status` would give Pro to a lapsed user. This closes `GAP-5` before that happens.

## What Changes

- Add a pure helper in `src/lib/` that returns a membership as `status: expired`, `tier: free` (keeping `ends_at`) when it is a `member` with status `active` or `trialing` and an `ends_at` that is not after now. The `admin` tier, a null `ends_at` and every other status are returned unchanged.
- Apply the helper in both profile routes (`src/app/api/dashboard/profile/route.ts` and `src/app/api/dashboard/profile/current/route.ts`), so the API never reports a lapsed membership as active.
- Add a migration `migrations/20261006_expire_user_memberships.sql` with a `SECURITY DEFINER` function that expires lapsed memberships in one atomic `UPDATE`, execute revoked from `anon`, `authenticated` and `public`, scheduled hourly with `pg_cron`.
- Regenerate `src/types/database.types.ts` after the migration.
- Close `GAP-5` in `spec/SPEC.md` (docs commit first).

Out of scope: enforcing plan limits by tier (`GAP-1`), auto-renew, handling of the `canceled` status, and notifying users.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `billing`: adds a requirement that a membership past its `ends_at` is expired, both when read and in the database. `BILL-7` (extension on an approved payment) is unchanged.

## Impact

- `src/lib/` (new helper and test), the two profile route handlers and a test for each
- `migrations/20261006_expire_user_memberships.sql` (new function, extension and schedule)
- `src/types/database.types.ts` (regenerated), `spec/SPEC.md` (`GAP-5`)
- Applying the migration to the live project is a separate, explicit step: its first run changes the one existing stale row (user data).
- No change to the webhook, the client or any dependency.
