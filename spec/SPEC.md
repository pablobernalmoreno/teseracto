# Teseracto — Product & System Specification

**Status:** as-built. This document describes what the code does today. Where the product promises
something the code does not do, the gap is listed in [§10 Known gaps](#10-known-gaps) rather than
written as a requirement.

Every requirement cites the code that implements it as `file:line`. When code changes, update the
requirement and its citation in the same change.

## 1. Overview

Teseracto is a Spanish-language web app for keeping lightweight financial ledgers. A user creates
**books** (_libros_), fills them with **entries** (_movimientos_: a date and an amount), usually by
photographing receipts that are read in the browser, and reviews the results as tables, a history
chart and PDF exports. A paid Pro plan is sold through Wompi in Colombian pesos.

### 1.1 Target users

Community organisations, national associations and local clubs or groups that need to consolidate
movements and share simple reports (`src/app/page.tsx:83-123`).

### 1.2 Scope

In scope: account management, books and entries, receipt OCR, dashboard review, history chart, PDF
export, plan purchase.

### 1.3 Non-goals (as built)

- No multi-user sharing: a book belongs to exactly one user.
- No categories, accounts, balances or double-entry bookkeeping; an entry is only a date and an amount.
- No recurring billing: a purchase buys a fixed period (`src/app/api/billing/wompi/webhook/route.ts:170-180`, `auto_renew: false` at `:212`).
- No server-side OCR; images never leave the browser (`src/features/dashboard/model/useItemCardModel.ts:272-289`).

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

### 4.1 Authentication (AUTH)

- **AUTH-1** A user can sign up with email and password. Email is trimmed and lower-cased; the password must be at least 8 characters and match its confirmation. On success the user is sent to `/account_confirmation` (`src/app/actions/auth.ts:53-89`).
- **AUTH-2** A user can sign in with email and password and is sent to `/main`. Every failure, including an invalid email, returns the same message, "Correo o contraseña incorrectos.", so the response does not reveal whether an account exists (`src/app/actions/auth.ts:9`, `:21-51`).
- **AUTH-3** A user can sign in with Google OAuth (`src/features/login/model/loginService.ts:20-22`).
- **AUTH-4** OAuth and email links return to `/api/auth/callback`, which exchanges `code` for a session and redirects to `next`. `next` is sanitised: only same-site relative paths are allowed; anything else falls back to `/main` (`src/app/api/auth/callback/route.ts:48-92`, `src/lib/auth/redirect.ts:12-44`).
- **AUTH-5** A failed callback redirects to `/auth/callback/error?reason=…` with `missing_code`, `oauth_callback` or `service_unavailable`. `service_unavailable` is chosen for 503/504 responses and network, timeout or "paused" errors (`src/app/api/auth/callback/route.ts:6-46`, `:83-89`).
- **AUTH-6** Signing out clears the session and redirects to `/login` (`src/app/actions/auth.ts:91-96`).
- **AUTH-7** On sign-up the database creates a `user_profile` row, with a name taken from the provider metadata or the email local part and a fresh `book_id` (`migrations/20260617_assign_book_id_on_profile_creation.sql:2-23`). It also creates a `free`/`active` `user_memberships` row (`migrations/20260601_user_memberships.sql:78-97`).
- **AUTH-8** If a profile somehow lacks a `book_id`, `/api/dashboard/profile/current` and `/api/dashboard/profile/initialize` assign one (`src/app/api/dashboard/profile/current/route.ts:27-54`, `src/app/api/dashboard/profile/initialize/route.ts:41-75`).

### 4.2 Books (BOOK)

- **BOOK-1** A user sees only their own books, newest first by `creationTime` then `id` (`src/app/actions/dashboard.ts:140-145`). Postgres RLS enforces the same thing by matching `owner_id` to the caller's `user_profile.book_id` (`migrations/20260721_rls_initplan_tuning.sql:37-94`).
- **BOOK-2** The book list is paginated. Page size defaults to 5 and is clamped to 1–100; negative or non-numeric pages become 0 (`src/app/actions/dashboard.ts:55-63`).
- **BOOK-3** The book list can be searched by title, case-insensitively and as a substring. `%` and `_` are escaped in the fallback query (`src/app/actions/dashboard.ts:146-149`). A trigram index backs the search (`migrations/20260405_dashboard_query_indexes.sql:9-10`).
- **BOOK-4** List results carry only the first 3 entries of each book as a preview, both from the RPC and from the fallback query (`migrations/20260405_dashboard_books_preview_rpc.sql:33-37`, `src/app/actions/dashboard.ts:37-42`). The full content is loaded on demand (`src/app/actions/dashboard.ts:164-184`, `:228-240`).
- **BOOK-5** A user can create a book. The title is trimmed and at most 180 characters, defaulting to "Libro sin título"; `creationTime` is an optional `YYYY-MM-DD` date that defaults to today (`src/app/actions/dashboard.ts:287-377`).
- **BOOK-6** A user can update a book's content, and optionally its title and date, through the same action by passing `bookId` (`src/app/actions/dashboard.ts:323-346`).
- **BOOK-7** A user can delete several books at once, up to 100 ids per request, with duplicates removed (`src/app/actions/dashboard.ts:251-285`, `src/lib/security/validation.ts:42-49`).
- **BOOK-8** Every entry must be `{ id: integer, date: string, money: string }`, and a book holds at most 500 entries. Anything else rejects the whole payload (`src/lib/security/validation.ts:51-80`).

### 4.3 Receipt OCR (OCR)

- **OCR-1** A user can select one or more images. Each is read in the browser by a tesseract.js worker that is loaded on demand and terminated afterwards (`src/features/dashboard/model/useItemCardModel.ts:261-330`).
- **OCR-2** The date is extracted from text as `d de <mes> de 20yy`, `d <mes> 20yy` (Spanish month names or abbreviations) or `dd/mm/20yy`, and normalised to `dd/MM/yyyy` (`src/lib/data.ts:4-32`).
- **OCR-3** The amount is the largest number of at least 1.000 and at most 9 digits, read in Colombian format (`.` for thousands, `,` for decimals) and re-formatted as `es-CO` (`src/lib/data.ts:34-67`).
- **OCR-4** One upload is one day: the first date found becomes the reference date. An image showing a different date is excluded, with a message naming both dates (`src/features/dashboard/model/useItemCardModel.ts:128-150`).
- **OCR-5** An image with no readable amount is flagged so the user can type the amount in (`src/features/dashboard/model/useItemCardModel.ts:155-163`).
- **OCR-6** If no date is found in any image, or the OCR worker fails, every image is flagged for manual entry of both date and amount. The OCR failure path fails open to manual entry: the user can still save (`src/features/dashboard/model/useItemCardModel.ts:175-185`, `:311-326`).

### 4.4 Dashboard (DASH)

- **DASH-1** `/main` renders the first page of books on the server, then hands off to the client (`src/app/main/page.tsx:35-48`).
- **DASH-2** Summary tiles show the number of books, the rows in view (edited rows while a book is open, otherwise filtered results), the number selected for deletion, and the page count (`src/features/dashboard/view/DashboardSummaryStats.tsx:28-54`).
- **DASH-3** A detail panel shows and edits a book's entries, and can export the book to PDF (`src/features/dashboard/view/DashboardDetailPanel.tsx:48`).
- **DASH-4** The history view sums amounts per day across **all** of the user's books and plots them. It can be filtered to all time, the last 30 days or the last 7 days (`src/features/dashboard/view/DashboardHistoryView.tsx:112-138`). Dates are accepted as ISO, `dd/MM/yyyy`, `d/M/yyyy`, `yyyy/MM/dd`, `dd-MM-yyyy` or `d-M-yyyy`; entries with unparseable dates are skipped (`:34-58`, `:84-91`).
- **DASH-5** A PDF export is an A4 portrait table of a book's entries with a total. If the rows aren't already loaded, they are fetched first (`src/features/dashboard/model/exportPdf.ts:39-60`).
- **DASH-6** Unsaved edits are guarded by a confirmation dialog (`src/features/dashboard/components/Dialog/UnsavedChangesDialog.tsx`).

### 4.5 Billing (BILL)

- **BILL-1** The plans are Free ($0), Pro monthly (3.000 COP) and Pro annual (199.000 COP). Amounts are held in cents in `BILLING_PLANS` (`src/lib/pricing.ts:32-104`).
- **BILL-2** Choosing a paid plan calls `POST /api/billing/wompi/checkout-config`. This requires a signed-in user, inserts a `pending` row in `billing_payments` with a unique reference, and returns the Wompi public key, amount, reference, a SHA-256 integrity signature and a return URL of `/main?billing=processing&reference=…` (`src/app/api/billing/wompi/checkout-config/route.ts:57-130`).
- **BILL-3** The client opens the Wompi Widget Checkout from `checkout.wompi.co/widget.js` (`src/features/dashboard/view/DashboardPricingView.tsx:53`, `:153-187`).
- **BILL-4** The webhook rejects a request with no configured event secret (500), invalid JSON (400) or a bad checksum (401). The checksum is compared in constant time (`src/app/api/billing/wompi/webhook/route.ts:121-130`, `:225-234`, `:357-384`).
- **BILL-5** Each event is stored in `billing_webhook_events`, keyed by the SHA-256 of the raw body. A redelivered event that was already processed is acknowledged without being applied again (`src/app/api/billing/wompi/webhook/route.ts:236-277`, `:386-408`).
- **BILL-6** Wompi statuses map to `APPROVED → approved`, `DECLINED → declined`, `VOIDED → voided`, and anything else `→ error` (`src/app/api/billing/wompi/webhook/route.ts:132-148`).
- **BILL-7** An approved payment sets the membership to `tier: member`, `status: active`, with `ends_at` extended by one month or one year. The extension counts from the later of now and the current `ends_at`, so buying early stacks the periods (`src/app/api/billing/wompi/webhook/route.ts:170-223`).

## 5. Plans and entitlements

The promises below are what the product advertises (`src/lib/pricing.ts:32-132`). The last column
says whether the code enforces them.

| Entitlement           | Free          | Pro          | Enforced?                                                           |
| --------------------- | ------------- | ------------ | ------------------------------------------------------------------- |
| Books                 | 10            | Unlimited    | **No** — see GAP-1                                                  |
| Entries per book      | 100           | 500          | **Partly** — 500 for everyone (`src/lib/security/validation.ts:66`) |
| Receipt OCR           | Monthly quota | Larger quota | **No** — see GAP-3                                                  |
| Dashboard and metrics | Basic         | Full         | **No** — everyone gets the same dashboard                           |
| PDF export            | Not included  | Included     | **No** — see GAP-2                                                  |

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

Other database objects:

- `get_user_books_page_preview(p_from, p_to, p_search_query)` is `security invoker`. It resolves the owner from `auth.uid()` itself, so a caller cannot ask for another user's books (`migrations/20260603_db_security_hardening.sql:121-176`).
- Enums: `membership_tier`, `membership_status`, `billing_payment_status` (`src/types/database.types.ts:206-210`).
- Schema changes go only in new dated files under `migrations/`, and `src/types/database.types.ts` is regenerated afterwards (see `README.md`).

## 7. API contracts

Route handlers accept either the Supabase cookie session or `Authorization: Bearer <access_token>`
(`src/lib/security/validation.ts:19-27`, for example `src/app/api/dashboard/books/route.ts:35-37`).
Request bodies must be `application/json`, otherwise the handler returns 415. Errors come back as
`{ error: string }`; internal failures are masked with "No se pudo completar la solicitud."
(`src/lib/security/validation.ts:3`).

| Endpoint                                  | Request                                     | Success                                | Errors                       |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------- | ---------------------------- |
| `GET /api/dashboard/books`                | `?from&to&searchQuery`                      | `{ data: Book[], count }`              | 401, 404, 500                |
| `POST /api/dashboard/books`               | `{ title, content, bookId? }`               | `{ data: Book }`                       | 400, 401, 404, 415, 429, 500 |
| `DELETE /api/dashboard/books`             | `{ bookIds: string[] }`                     | `{ data: { id }[] }`                   | 400, 401, 404, 415, 429, 500 |
| `GET /api/dashboard/books/{id}/content`   | —                                           | `{ data: { content } }`                | 401, 404, 500                |
| `PATCH /api/dashboard/books/{id}/content` | `{ content }`                               | `{ data: Book }`                       | 400, 401, 404, 415, 429, 500 |
| `GET /api/dashboard/profile`              | —                                           | `{ data: [Profile & { membership }] }` | 401, 500                     |
| `GET /api/dashboard/profile/current`      | —                                           | `{ data: Profile & { membership } }`   | 401, 500                     |
| `POST /api/dashboard/profile/initialize`  | —                                           | `{ data: Profile, created }`           | 401, 429, 500                |
| `POST /api/auth/session`                  | `{ access_token, refresh_token }`           | `{ ok: true }`                         | 400, 401, 415, 429           |
| `DELETE /api/auth/session`                | —                                           | `{ ok: true }`                         | 429, 500                     |
| `GET /api/auth/service-status`            | —                                           | `{ available: true }`                  | 503 `{ available: false }`   |
| `POST /api/billing/wompi/checkout-config` | `{ planId: "pro_monthly" \| "pro_annual" }` | `{ data: CheckoutConfig }`             | 400, 401, 500                |
| `POST /api/billing/wompi/webhook`         | Wompi event                                 | `{ ok: true, duplicate? }`             | 400, 401, 404, 500           |

When a user has no membership row, the profile endpoints return a default `free`/`active`
membership (`src/app/api/dashboard/profile/route.ts:60-69`).

Server actions (`src/app/actions/`): `signInAction`, `signUpAction`, `signOutAction`,
`resendConfirmationEmailAction`, `fetchBooksPage`, `fetchBookContent`, `fetchAllBooksHistory`,
`createBook`, `deleteBooks`.

## 8. Non-functional requirements

### 8.1 Security

- **SEC-1** Every page response carries a per-request nonce-based Content-Security-Policy. It allows scripts only from self, the nonce, `blob:`, `cdn.jsdelivr.net` (tesseract assets) and `checkout.wompi.co`, and sets `frame-ancestors 'none'` (`src/proxy.ts:4-54`). API routes are excluded from the proxy (`src/proxy.ts:56-58`).
- **SEC-2** The service-role Supabase client is used only in server route handlers for billing (`src/app/api/billing/wompi/checkout-config/route.ts:6`, `src/app/api/billing/wompi/webhook/route.ts:4`).
- **SEC-3** Writes and auth attempts are rate-limited with fixed windows per client IP:

  | Operation                                      | Limit       | Source                                                                                                                 |
  | ---------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
  | Sign in (per IP + email)                       | 5 / 15 min  | `src/app/actions/auth.ts:25-30`                                                                                        |
  | Sign up (per IP + email)                       | 5 / 60 min  | `src/app/actions/auth.ts:56-61`                                                                                        |
  | Resend confirmation (per IP + email)           | 3 / 60 min  | `src/app/actions/auth.ts:100-105`                                                                                      |
  | Book create / delete (actions)                 | 30 / 5 min  | `src/app/actions/dashboard.ts:67-75`                                                                                   |
  | Book `POST` / `DELETE` / content `PATCH` (API) | 30 / 5 min  | `src/app/api/dashboard/books/route.ts:136-140`, `:190-194`; `src/app/api/dashboard/books/[id]/content/route.ts:97-101` |
  | Session `POST`                                 | 10 / 5 min  | `src/app/api/auth/session/route.ts:12-16`                                                                              |
  | Profile initialize                             | 10 / 15 min | `src/app/api/dashboard/profile/initialize/route.ts:8-12`                                                               |

- **SEC-4** Every query that touches books filters by `owner_id` in application code, and RLS enforces the same rule underneath (§6).
- **SEC-5** Secrets live only in environment variables. Only the Supabase URL, the publishable/anon key, the site URL and the Wompi public key are `NEXT_PUBLIC_*` (`README.md`, `src/app/api/billing/wompi/checkout-config/route.ts:36-55`).

### 8.2 Caching

- **PERF-1** Dashboard reads use `'use cache: private'` with `cacheLife('minutes')`, tagged `dashboard-books`, `dashboard-books:{ownerBookId}` and `dashboard-book:{bookId}` (`src/app/actions/dashboard.ts:99-212`).
- **PERF-2** Server-action writes invalidate with `updateTag`, so the writer sees fresh data straight away (`src/app/actions/dashboard.ts:278-282`, `:367-374`). Route-handler writes use `revalidateTag(…, "max")` (`src/app/api/dashboard/books/route.ts:180-184`, `:254-255`).

### 8.3 Localisation

- **L10N-1** All user-facing text is Spanish. Money is formatted `es-CO`, dates `dd/MM/yyyy`, and billing is in COP only (`src/lib/data.ts:37-42`; `migrations/20260721_wompi_billing_backend.sql:29`).

### 8.4 Accessibility

- **A11Y-1** Interactive controls use semantic MUI components and carry accessible names, for example the history filter toggles and back buttons (`src/features/dashboard/view/DashboardHistoryView.tsx:203-225`, `src/features/dashboard/view/DashboardPricingView.tsx:210`).

### 8.5 SEO

- **SEO-1** Public pages set metadata and a canonical URL, and the landing page emits Organization JSON-LD with a nonce (`src/app/page.tsx:13-57`). `/main` is `noindex, nofollow` (`src/app/main/page.tsx:9-19`).

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
- **GAP-2 PDF export is not restricted by plan.** It is advertised as Pro-only, but `exportBookToPdf` is called with no tier check (`src/features/dashboard/view/DashboardDetailPanel.tsx:48`).
- **GAP-3 No OCR quota.** Both plans advertise a monthly limit on receipt reading, but OCR runs entirely in the browser and nothing counts it (`src/features/dashboard/model/useItemCardModel.ts:272-289`).
- **GAP-4 OCR uses the English model.** `createWorker("eng")` is used for Spanish receipts, which can hurt accuracy on accented month names (`src/features/dashboard/model/useItemCardModel.ts:279`).
- **GAP-5 Memberships never expire.** `ends_at` is set on purchase, but nothing moves `status` to `expired` or `tier` back to `free` when it passes.
- **GAP-6 Webhook replay can extend a membership twice.** If membership sync succeeds but marking the event processed fails, the route returns 500 (`src/app/api/billing/wompi/webhook/route.ts:421-433`). Wompi then redelivers the event, it is treated as unprocessed (`:272-276`), and `ends_at` is extended again (`:199-209`).
- **GAP-7 Non-final Wompi statuses become `error`.** For example, `PENDING` maps to `error` rather than staying `pending` (`src/app/api/billing/wompi/webhook/route.ts:132-148`).
- **GAP-8 Checkout return is not handled.** `/main?billing=processing&reference=…` is the return URL (`src/app/api/billing/wompi/checkout-config/route.ts:127`), but no dashboard code reads those query parameters.
- **GAP-9 "Resend confirmation email" does nothing.** `resendConfirmationEmailAction` validates and rate-limits, then returns `success: true` without sending anything (`src/app/actions/auth.ts:98-118`).
- **GAP-10 Rate limits are per instance.** The store is an in-memory `Map` on `globalThis` (`src/lib/security/rateLimit.ts:17-24`). On serverless or multi-instance hosting, limits are neither shared nor durable. Clients without a forwarding header all share the `"unknown"` bucket (`:48`).
- **GAP-11 Two paths for book writes.** Server actions (`src/app/actions/dashboard.ts`) and the `/api/dashboard/books*` route handlers implement overlapping logic, with different cache invalidation (`updateTag` vs `revalidateTag`) and different `creationTime` formats (date vs full ISO timestamp: `src/app/actions/dashboard.ts:356` vs `src/app/api/dashboard/books/route.ts:243`).
- **GAP-12 Money is stored as display strings.** `money` is a formatted string that is re-parsed with heuristics in at least two places (`src/features/dashboard/model/exportPdf.ts:14-37`, `src/features/dashboard/view/DashboardHistoryView.tsx:60-81`), so totals depend on formatting.
- **GAP-13 `@reduxjs/toolkit` is installed but unused.** It is a dependency (`package.json`), but nothing under `src/` imports it; state lives in hooks and context (`src/features/dashboard/model/state/`).
- **GAP-14 Legacy callback route.** `/auth/callback` still exists only to forward old links, and is meant to be removed once Supabase references only `/api/auth/callback` (`src/app/auth/callback/route.ts:3-6`).

## 11. Open questions

1. Should plan limits (GAP-1 to GAP-3) be enforced on the server, and should it happen in server actions, RLS or both?
2. What should happen to books above the Free limit when a Pro membership ends?
3. Should `money` become a numeric column (cents), with formatting only at the edges?
4. Which book-write path should remain, server actions or route handlers? The dashboard client currently uses both.
5. Is the `admin` tier meant to unlock anything? No code reads it today.
