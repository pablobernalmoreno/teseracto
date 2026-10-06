# Tasks

## 1. Docs first

- [x] 1.1 Update `spec/SPEC.md`: remove `GAP-5` from the known gaps and reference `BILL-8` where memberships are described; verify by reading the file that no other section still says memberships never expire and that every `file:line` it cites was checked against the code. Docs-only commit, before the code commits.

## 2. Read-time expiry (`BILL-8`)

- [x] 2.1 Write the failing tests for `src/lib/membership.ts` first (`membership.test.ts`): a `member`/`active` and a `member`/`trialing` membership past `ends_at` become `expired`/`free` with `ends_at` kept; `ends_at` equal to now is expired; one millisecond in the future is unchanged; `admin`, a null `ends_at`, and each of `past_due`, `canceled`, `expired`, `suspended` and `free` are returned as the same reference; an unparseable `ends_at` is returned unchanged; verify the suite fails because the module does not exist.
- [x] 2.2 Implement `expireMembership(membership, now = new Date())` in `src/lib/membership.ts`, generic over the membership shape, with a comment that an unparseable date fails open to the stored value; verify the 2.1 suite passes.
- [x] 2.3 Write the failing route tests for `src/app/api/dashboard/profile/route.ts` and `src/app/api/dashboard/profile/current/route.ts` (mock `@/lib/supabase/server` as in `src/app/api/dashboard/books/route.test.ts`): a lapsed `member`/`active` row is returned as `free`/`expired`, a running one and the free fallback are unchanged, and a read error is still 500; verify they fail.
- [x] 2.4 Apply `expireMembership` to the membership in both routes and verify the 2.3 tests pass; then add the implementing `file:line` citations to the `BILL-8` delta, verified against the code.

## 3. Stored expiry (`BILL-8`)

- [x] 3.1 Write `migrations/20261006_expire_user_memberships.sql`: `create extension if not exists pg_cron with schema pg_catalog`; `public.expire_user_memberships()` returning the count, `SECURITY DEFINER`, `set search_path = public`, one atomic `UPDATE` with the D2 rule; execute revoked from `anon`, `authenticated` and `public`; `cron.schedule('expire-user-memberships', '0 * * * *', ...)`; verify by reading it against D2 and D4 and checking nothing edits an applied migration.
- [ ] 3.2 Verify the function on a Supabase branch (`create_branch`, apply the migration there, then run a table of cases through `execute_sql`: past `member`/`active`, past `trialing`, exactly now, future, `admin`, null `ends_at`, `canceled`, and a row renewed before the run); verify each row ends in the state `BILL-8` names and that `anon` and `authenticated` cannot execute the function; delete the branch afterwards and record the results in the PR.
- [ ] 3.3 Run a read-only `select` on the live project of the rows the first run would change, and show the result to the user; verify the list matches the one known stale `member`/`active` row before asking to apply.
- [ ] 3.4 Only after the user says so: apply the migration to the live project, check `cron.job` has one `expire-user-memberships` job and that the stale row is `expired`/`free`, then regenerate `src/types/database.types.ts` with the command in `AGENTS.md`; verify `pnpm exec tsc --noEmit` is clean and the new function appears in the generated types.

## 4. Integration

- [ ] 4.1 Run the gate in order (`pnpm lint`, `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, `pnpm test`), then `openspec validate "membership-expiry" --strict`; verify every step is green before any commit, and that every scenario in the `BILL-8` delta has a test from group 2 or a recorded result from 3.2.
