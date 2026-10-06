# Teseracto — Product & System Specification

**Status:** as-built. This document describes what the code does today. Where the product promises
something the code does not do, the gap is listed in [§10 Known gaps](#10-known-gaps) rather than
written as a requirement.

Requirements live in [`openspec/specs/`](../openspec/specs/), one capability per folder (see §4 and §8).
Each requirement there cites the code that implements it as `file:line`. When code changes, update the
requirement and its citation in the same change. This file keeps the cross-cutting reference material:
overview, routes, plans, data model, API contracts, configuration, known gaps and open questions.

## 1. Overview

Teseracto is a Spanish-language web app for keeping lightweight financial ledgers. A user creates
**books** (_libros_), fills them with **entries** (_movimientos_: a date and an amount), usually by
photographing receipts that are read in the browser, and reviews the results as tables, a history
chart and CSV exports. A paid Pro plan is sold through Wompi in Colombian pesos.

### 1.1 Target users

Community organisations, national associations and local clubs or groups that need to consolidate
movements and share simple reports (`src/app/page.tsx:83-123`).

### 1.2 Scope

In scope: account management, books and entries, receipt OCR, dashboard review, history chart, CSV
export, plan purchase.

### 1.3 Non-goals (as built)

- No multi-user sharing: a book belongs to exactly one user.
- No categories, accounts, balances or double-entry bookkeeping; an entry is only a date and an amount.
- No recurring billing: a purchase buys a fixed period (`src/app/api/billing/wompi/webhook/route.ts:170-180`, `auto_renew: false` at `:212`).
- No server-side OCR; images never leave the browser (`src/features/dashboard/model/useItemCardModel.ts:221-267`).

## 2. Glossary

| Term                  | Meaning                                                                                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Book (_libro_)        | A row in `user_books`: `id`, `title`, `creationTime`, `owner_id`, `content` (`src/types/database.types.ts:96-102`).                                                                                                                                   |
| Entry (_movimiento_)  | One element of a book's `content`: `{ id: number, date: string, money: string }` (`src/types/dashboard.ts:1-5`).                                                                                                                                      |
| Owner key (`book_id`) | A UUID on `user_profile` that owns all of a user's books. `user_books.owner_id` references it, not the auth user id (`src/types/database.types.ts:117-124`). Assigned on sign-up (`migrations/20260617_assign_book_id_on_profile_creation.sql:2-23`). |
| Tier                  | `user_memberships.tier`: `free`, `member` (Pro) or `admin` (`src/types/database.types.ts:209`).                                                                                                                                                       |
| Plan                  | A priced offer: `free`, `pro_monthly`, `pro_annual` (`src/lib/pricing.ts:17`).                                                                                                                                                                        |

## 3. Routes

| Path                                 | Kind          | Access         | Purpose                                                                              |
| ------------------------------------ | ------------- | -------------- | ------------------------------------------------------------------------------------ |
| `/`                                  | Page          | Public         | Landing page (`src/app/page.tsx`)                                                    |
| `/pricing`                           | Page          | Public         | Public plan comparison (`src/app/pricing/page.tsx`)                                  |
| `/login`, `/register`                | Page          | Public         | Sign in / sign up (`src/app/(auth)/`)                                                |
| `/account_confirmation`              | Page          | Public         | "Check your email" after sign-up                                                     |
| `/main`                              | Page          | Authenticated  | Dashboard; redirects to `/login` without a user (`src/app/main/page.tsx:36-43`)      |
| `/auth/callback/error`               | Page          | Public         | Explains a failed OAuth / email-link callback                                        |
| `/auth/callback`                     | Route handler | Public         | Legacy; 307-forwards to `/api/auth/callback` (`src/app/auth/callback/route.ts:7-12`) |
| `/api/auth/callback`                 | Route handler | Public         | Exchanges an auth code for a session                                                 |
| `/api/auth/session`                  | Route handler | Public         | `POST` sets a session from tokens, `DELETE` signs out                                |
| `/api/auth/service-status`           | Route handler | Public         | Reports whether Supabase Auth is reachable                                           |
| `/api/dashboard/profile`             | Route handler | Authenticated  | Profile + membership (array form)                                                    |
| `/api/dashboard/profile/current`     | Route handler | Authenticated  | Profile + membership, repairing a missing `book_id`                                  |
| `/api/dashboard/profile/initialize`  | Route handler | Authenticated  | Ensures a profile with `book_id` exists                                              |
| `/api/dashboard/books`               | Route handler | Authenticated  | List (`GET`), create (`POST`), bulk delete (`DELETE`)                                |
| `/api/dashboard/books/[id]/content`  | Route handler | Authenticated  | Read (`GET`) or replace (`PATCH`) a book's entries                                   |
| `/api/billing/wompi/checkout-config` | Route handler | Authenticated  | Creates a payment intent and signed checkout config                                  |
| `/api/billing/wompi/webhook`         | Route handler | Wompi (signed) | Receives Wompi transaction events                                                    |
| `robots.txt`, `sitemap.xml`          | Metadata      | Public         | `src/app/robots.ts`, `src/app/sitemap.ts`                                            |

## 4. Functional requirements

Requirements are normative in the capability specs below; this table is only an index.

| Capability                                             | Requirement IDs  | Covers                                                                    |
| ------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------- |
| [`auth`](../openspec/specs/auth/spec.md)               | AUTH-1 to AUTH-8 | Sign-up, sign-in, Google OAuth, callback, sign-out, profile on sign-up    |
| [`books`](../openspec/specs/books/spec.md)             | BOOK-1 to BOOK-8 | Ownership, list, pagination, search, create, update, delete, entry limits |
| [`receipt-ocr`](../openspec/specs/receipt-ocr/spec.md) | OCR-1 to OCR-6   | In-browser receipt reading, date and amount extraction, manual fallback   |
| [`dashboard`](../openspec/specs/dashboard/spec.md)     | DASH-1 to DASH-6 | Dashboard, summary, detail panel, history chart, CSV export               |
| [`billing`](../openspec/specs/billing/spec.md)         | BILL-1 to BILL-7 | Plans, checkout config, webhook, membership extension                     |

## 5. Plans and entitlements

The promises below are what the product advertises (`src/lib/pricing.ts:32-132`). The last column
says whether the code enforces them.

| Entitlement           | Free          | Pro          | Enforced?                                                           |
| --------------------- | ------------- | ------------ | ------------------------------------------------------------------- |
| Books                 | 10            | Unlimited    | **No** — see GAP-1                                                  |
| Entries per book      | 100           | 500          | **Partly** — 500 for everyone (`src/lib/security/validation.ts:66`) |
| Receipt OCR           | Monthly quota | Larger quota | **No** — see GAP-3                                                  |
| Dashboard and metrics | Basic         | Full         | **No** — everyone gets the same dashboard                           |
| CSV export            | Not included  | Included     | **No** — see GAP-2                                                  |

## 6. Data model

All tables are in `public` and have RLS enabled and forced
(`migrations/20260603_db_security_hardening.sql:1-7`,
`migrations/20260721_wompi_billing_backend.sql:83-87`).

| Table                    | Key                                     | Written by                                 | Client access (`authenticated`)       |
| ------------------------ | --------------------------------------- | ------------------------------------------ | ------------------------------------- |
| `user_profile`           | `id` = auth user id                     | Sign-up trigger; profile routes            | select/insert/update own row          |
| `user_books`             | `id`; `owner_id → user_profile.book_id` | Server actions; books routes               | select/insert/update/delete own books |
| `user_memberships`       | `user_id` = auth user id                | Sign-up trigger; webhook (service role)    | select own row                        |
| `billing_payments`       | `id`; unique `provider_reference`       | Checkout config and webhook (service role) | select own rows                       |
| `billing_webhook_events` | `id`; unique `event_hash`               | Webhook (service role)                     | none (`with check (false)`)           |

A book made from a receipt upload is one upload: its `title` is the range of its entry dates (`dd/MM/yyyy - dd/MM/yyyy`, or a single `dd/MM/yyyy`), its `creationTime` is the lowest entry date as `YYYY-MM-DD`, and its `content` is in ascending date order (`src/features/dashboard/model/reviewEntries.ts:157-170`). The title and date travel through `POST /api/dashboard/books` (`src/features/dashboard/model/useItemCardModel.ts:276-281`, `src/app/api/dashboard/books/route.ts:237-253`). Books saved before this change keep their `Dia dd/mm/yyyy` titles (the old rule was at `src/features/dashboard/model/useItemCardModel.ts:391-394` on `main` before this change).

Other database objects:

- `get_user_books_page_preview(p_from, p_to, p_search_query)` is `security invoker`. It resolves the owner from `auth.uid()` itself, so a caller cannot ask for another user's books (`migrations/20260603_db_security_hardening.sql:121-176`).
- Enums: `membership_tier`, `membership_status`, `billing_payment_status` (`src/types/database.types.ts:206-210`).
- Schema changes go only in new dated files under `migrations/`, and `src/types/database.types.ts` is regenerated afterwards (see `README.md`).

## 7. API contracts

Route handlers accept either the Supabase cookie session or `Authorization: Bearer <access_token>`
(`src/lib/security/validation.ts:19-27`, for example `src/app/api/dashboard/books/route.ts:36-38`).
Request bodies must be `application/json`, otherwise the handler returns 415. Errors come back as
`{ error: string }`; internal failures are masked with "No se pudo completar la solicitud."
(`src/lib/security/validation.ts:3`).

| Endpoint                                  | Request                                      | Success                                | Errors                       |
| ----------------------------------------- | -------------------------------------------- | -------------------------------------- | ---------------------------- |
| `GET /api/dashboard/books`                | `?from&to&searchQuery`                       | `{ data: Book[], count }`              | 401, 404, 500                |
| `POST /api/dashboard/books`               | `{ title, content, bookId?, creationTime? }` | `{ data: Book }`                       | 400, 401, 404, 415, 429, 500 |
| `DELETE /api/dashboard/books`             | `{ bookIds: string[] }`                      | `{ data: { id }[] }`                   | 400, 401, 404, 415, 429, 500 |
| `GET /api/dashboard/books/{id}/content`   | —                                            | `{ data: { content } }`                | 401, 404, 500                |
| `PATCH /api/dashboard/books/{id}/content` | `{ content }`                                | `{ data: Book }`                       | 400, 401, 404, 415, 429, 500 |
| `GET /api/dashboard/profile`              | —                                            | `{ data: [Profile & { membership }] }` | 401, 500                     |
| `GET /api/dashboard/profile/current`      | —                                            | `{ data: Profile & { membership } }`   | 401, 500                     |
| `POST /api/dashboard/profile/initialize`  | —                                            | `{ data: Profile, created }`           | 401, 429, 500                |
| `POST /api/auth/session`                  | `{ access_token, refresh_token }`            | `{ ok: true }`                         | 400, 401, 415, 429           |
| `DELETE /api/auth/session`                | —                                            | `{ ok: true }`                         | 429, 500                     |
| `GET /api/auth/service-status`            | —                                            | `{ available: true }`                  | 503 `{ available: false }`   |
| `POST /api/billing/wompi/checkout-config` | `{ planId: "pro_monthly" \| "pro_annual" }`  | `{ data: CheckoutConfig }`             | 400, 401, 500                |
| `POST /api/billing/wompi/webhook`         | Wompi event                                  | `{ ok: true, duplicate? }`             | 400, 401, 404, 500           |

When a user has no membership row, the profile endpoints return a default `free`/`active`
membership (`src/app/api/dashboard/profile/route.ts:60-69`).

Server actions (`src/app/actions/`): `signInAction`, `signUpAction`, `signOutAction`,
`resendConfirmationEmailAction`, `fetchBooksPage`, `fetchBookContent`, `fetchAllBooksHistory`,
`createBook`, `deleteBooks`.

## 8. Non-functional requirements

All non-functional requirements are in [`security`](../openspec/specs/security/spec.md):

| Requirement IDs | Covers                                                             |
| --------------- | ------------------------------------------------------------------ |
| SEC-1 to SEC-5  | CSP, service-role isolation, rate limits, owner filtering, secrets |
| PERF-1, PERF-2  | Dashboard read caching and write invalidation                      |
| L10N-1          | Spanish text, `es-CO` formats, COP billing                         |
| A11Y-1          | Accessible controls                                                |
| SEO-1           | Metadata, canonical URLs, JSON-LD, `noindex` on `/main`            |

## 9. Configuration

| Variable                                                                                          | Used by                                               |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                                        | All Supabase clients                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`                          | All Supabase clients                                  |
| `NEXT_PUBLIC_SITE_URL`                                                                            | Metadata, JSON-LD                                     |
| Service-role key                                                                                  | `src/lib/supabase/serviceRole.ts`                     |
| `NEXT_PUBLIC_WOMPI` / `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`                                              | Checkout config (`checkout-config/route.ts:37`)       |
| `NEXT_INTEGRITY_WOMPI_URL` / `NEXT_WOMPI_INTEGRITY_SECRET` / `WOMPI_INTEGRITY_SECRET`             | Checkout signature (`checkout-config/route.ts:37-40`) |
| `NEXT_EVENT_WOMPI_URL` / `NEXT_WOMPI_EVENT_SECRET` / `WOMPI_EVENT_SECRET` / `WOMPI_EVENTS_SECRET` | Webhook checksum (`webhook/route.ts:54-58`)           |

External configuration that points into the code: the Supabase Auth redirect URLs point at
`/api/auth/callback`, and the Wompi events URL points at `/api/billing/wompi/webhook`.

## 10. Known gaps

Places where the code differs from what the product promises, or from what a reader would expect.
Each one is a candidate for its own task.

- **GAP-1 Plan limits are not enforced.** Nothing reads `user_memberships.tier` before a write. A Free user can create unlimited books, each with up to 500 entries (`src/app/actions/dashboard.ts:287-377`, `src/lib/security/validation.ts:66`).
- **GAP-2 CSV export is not restricted by plan.** It is advertised as Pro-only, but `exportBookToCsv` is called with no tier check (`src/features/dashboard/view/DashboardDetailPanel.tsx:48`).
- **GAP-3 No OCR quota.** Both plans advertise a monthly limit on receipt reading, but OCR runs entirely in the browser and nothing counts it (`src/features/dashboard/model/useItemCardModel.ts:221-267`).
- **GAP-4 OCR model (resolved).** The reader now uses the Spanish model, `createWorker("spa")` (`src/features/dashboard/model/useItemCardModel.ts:230`). On the 24 sample receipts the full read pipeline got 18 dates and 22 amounts right with `spa` and 19 and 22 with `eng` (`pnpm test:ocr`, `test-support/receipts/accuracy.ocr.ts`); the one extra date was a "25" read as "28".
- **GAP-5 Memberships never expire.** `ends_at` is set on purchase, but nothing moves `status` to `expired` or `tier` back to `free` when it passes.
- **GAP-6 Webhook replay can extend a membership twice.** If membership sync succeeds but marking the event processed fails, the route returns 500 (`src/app/api/billing/wompi/webhook/route.ts:421-433`). Wompi then redelivers the event, it is treated as unprocessed (`:272-276`), and `ends_at` is extended again (`:199-209`).
- **GAP-7 Non-final Wompi statuses become `error`.** For example, `PENDING` maps to `error` rather than staying `pending` (`src/app/api/billing/wompi/webhook/route.ts:132-148`).
- **GAP-8 Checkout return is not handled.** `/main?billing=processing&reference=…` is the return URL (`src/app/api/billing/wompi/checkout-config/route.ts:127`), but no dashboard code reads those query parameters.
- **GAP-9 "Resend confirmation email" does nothing.** `resendConfirmationEmailAction` validates and rate-limits, then returns `success: true` without sending anything (`src/app/actions/auth.ts:98-118`).
- **GAP-10 Rate limits are per instance.** The store is an in-memory `Map` on `globalThis` (`src/lib/security/rateLimit.ts:17-24`). On serverless or multi-instance hosting, limits are neither shared nor durable. Clients without a forwarding header all share the `"unknown"` bucket (`:48`).
- **GAP-11 Two paths for book writes.** Server actions (`src/app/actions/dashboard.ts`) and the `/api/dashboard/books*` route handlers implement overlapping logic, with different cache invalidation (`updateTag` vs `revalidateTag`) and different `creationTime` defaults when none is given (date-only `YYYY-MM-DD` vs full ISO timestamp: `src/app/actions/dashboard.ts:356` vs `src/app/api/dashboard/books/route.ts:253`). Both accept an optional `YYYY-MM-DD` date; the route rejects anything else with 400 (`src/app/api/dashboard/books/route.ts:237-241`) and the action does not check that the date is real (`src/app/actions/dashboard.ts:311-313`).
- **GAP-12 Money is stored as display strings.** `money` is a formatted string that is re-parsed with heuristics in at least three places (`src/features/dashboard/model/reviewEntries.ts:119-145`, `src/features/dashboard/components/dataTable/DataTable.tsx:46-68`, `src/features/dashboard/view/DashboardHistoryView.tsx:60-82`), so totals depend on formatting.
- **GAP-13 `@reduxjs/toolkit` is installed but unused.** It is a dependency (`package.json`), but nothing under `src/` imports it; state lives in hooks and context (`src/features/dashboard/model/state/`).
- **GAP-14 Legacy callback route.** `/auth/callback` still exists only to forward old links, and is meant to be removed once Supabase references only `/api/auth/callback` (`src/app/auth/callback/route.ts:3-6`).

## 11. Open questions

1. Should plan limits (GAP-1 to GAP-3) be enforced on the server, and should it happen in server actions, RLS or both?
2. What should happen to books above the Free limit when a Pro membership ends?
3. Should `money` become a numeric column (cents), with formatting only at the edges?
4. Which book-write path should remain, server actions or route handlers? The dashboard client currently uses both.
5. Is the `admin` tier meant to unlock anything? No code reads it today.
