# security Specification

## Purpose

Collects the cross-cutting guarantees the app makes about security, caching, localisation, accessibility and search visibility, which apply across all features.

## Requirements

### Requirement: SEC-1 Content-Security-Policy

Every page response SHALL carry a per-request nonce-based Content-Security-Policy that allows scripts only from self, the nonce, `blob:`, `cdn.jsdelivr.net` and `checkout.wompi.co`, and sets `frame-ancestors 'none'`. API routes SHALL be excluded from the proxy. (`src/proxy.ts:4-54`, `:56-58`)

#### Scenario: Page response

- **WHEN** any page is requested
- **THEN** the response carries a CSP with a fresh nonce

### Requirement: SEC-2 Service-role isolation

The service-role Supabase client SHALL be used only in server route handlers for billing. (`src/app/api/billing/wompi/checkout-config/route.ts:6`, `src/app/api/billing/wompi/webhook/route.ts:4`)

#### Scenario: Client bundle

- **WHEN** the browser bundle is built
- **THEN** the service-role key and client are not included

### Requirement: SEC-3 Rate limiting

Writes and auth attempts SHALL be rate-limited with fixed windows per client IP: sign in 5 per 15 min and sign up 5 per 60 min (both per IP and email), resend confirmation 3 per 60 min, book create and delete 30 per 5 min, session `POST` 10 per 5 min, profile initialize 10 per 15 min. (`src/app/actions/auth.ts:25-30`, `:56-61`, `:100-105`, `src/app/actions/dashboard.ts:67-75`, `src/app/api/auth/session/route.ts:12-16`, `src/app/api/dashboard/profile/initialize/route.ts:8-12`)

#### Scenario: Sixth sign-in attempt

- **WHEN** the same IP and email attempt a sixth sign-in within 15 minutes
- **THEN** the attempt is rejected as rate-limited

### Requirement: SEC-4 Owner filtering

Every query that touches books SHALL filter by `owner_id` in application code, and row-level security SHALL enforce the same rule underneath.

#### Scenario: Forged owner

- **WHEN** a caller tries to read another owner's book
- **THEN** no rows are returned

### Requirement: SEC-5 Secrets

Secrets SHALL live only in environment variables. Only the Supabase URL, the publishable or anon key, the site URL and the Wompi public key SHALL be `NEXT_PUBLIC_*`. (`README.md`, `src/app/api/billing/wompi/checkout-config/route.ts:36-55`)

#### Scenario: Public variables

- **WHEN** the environment is inspected for browser-exposed variables
- **THEN** none carries a private key or secret

### Requirement: PERF-1 Cached dashboard reads

Dashboard reads SHALL use private caching with a minutes-long lifetime, tagged `dashboard-books`, `dashboard-books:{ownerBookId}` and `dashboard-book:{bookId}`. (`src/app/actions/dashboard.ts:99-212`)

#### Scenario: Repeated read

- **WHEN** the same user reads the same page twice within the cache lifetime
- **THEN** the second read is served from cache

### Requirement: PERF-2 Write invalidation

Server-action writes SHALL invalidate with `updateTag`, so the writer sees fresh data straight away. Route-handler writes SHALL use `revalidateTag(…, "max")`. (`src/app/actions/dashboard.ts:278-282`, `:367-374`, `src/app/api/dashboard/books/route.ts:180-184`, `:254-255`)

#### Scenario: Create then list

- **WHEN** a user creates a book through the server action and lists books
- **THEN** the new book appears

### Requirement: L10N-1 Spanish and es-CO formats

All user-facing text SHALL be Spanish. Money SHALL be formatted `es-CO`, dates `dd/MM/yyyy`, and billing SHALL be in COP only. (`src/lib/data.ts:37-42`, `migrations/20260721_wompi_billing_backend.sql:29`)

#### Scenario: Amount display

- **WHEN** an amount of 12500 is shown
- **THEN** it is formatted in es-CO

### Requirement: A11Y-1 Accessible controls

Interactive controls SHALL use semantic components and carry accessible names. (`src/features/dashboard/view/DashboardHistoryView.tsx:203-225`, `src/features/dashboard/view/DashboardPricingView.tsx:210`)

#### Scenario: Icon-only button

- **WHEN** a control has no visible text
- **THEN** it exposes an accessible name

### Requirement: SEO-1 Metadata and indexing

Public pages SHALL set metadata and a canonical URL, and the landing page SHALL emit Organization JSON-LD with a nonce. `/main` SHALL be `noindex, nofollow`. (`src/app/page.tsx:13-57`, `src/app/main/page.tsx:9-19`)

#### Scenario: Dashboard indexing

- **WHEN** a crawler requests `/main`
- **THEN** the page tells it not to index or follow
