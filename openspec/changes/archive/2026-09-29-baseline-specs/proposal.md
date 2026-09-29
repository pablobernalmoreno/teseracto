# Proposal

## Why

The as-built product spec lives in a single 262-line `spec/SPEC.md`, while `openspec/specs/` is empty. Future changes need something to be a delta against, and OpenSpec cannot express "what changes" without capability specs. Doing the split now gives every later change (plan enforcement, book-write consolidation, billing fixes) a baseline.

## What Changes

- Split the functional and non-functional requirements of `spec/SPEC.md` into six OpenSpec capabilities, moving each requirement with its ID and `file:line` citation unchanged.
- Trim `spec/SPEC.md` to a thin index: overview, glossary, routes, plans and entitlements, data model, API contracts, configuration, known gaps and open questions, with links to `openspec/specs/*` for the requirements.
- Fill in `openspec/config.yaml` `context` (stack, layer boundaries, conventions) so future artifacts start from the project's rules.
- Correct the `AGENTS.md` folder tree so it matches the code (`src/app/main`, `src/app/pricing`, `src/features/login`, `src/types/dashboard.ts`, `openspec/`) and fix the Redux mention (installed, unused).
- Known gaps (GAP-1 to GAP-14) and open questions are **not** turned into requirements; each becomes its own later change.

Non-goals: fixing any gap, changing any code, changing behavior, resolving the `.env.example` gitignore mismatch, or deciding what to do with the untracked `.claude/` and `.github/` tooling directories.

## Capabilities

### New Capabilities

- `auth`: sign-up, sign-in, Google OAuth, callback handling and redirect sanitising, sign-out, profile and membership creation on sign-up (AUTH-1 to AUTH-8).
- `books`: per-user book ownership, listing, pagination, search, previews, create, update, bulk delete, entry validation (BOOK-1 to BOOK-8).
- `receipt-ocr`: in-browser receipt reading, date and amount extraction, one-day-per-upload rule, manual-entry fallback (OCR-1 to OCR-6).
- `dashboard`: server-rendered first page, summary tiles, detail panel, history chart, PDF export, unsaved-changes guard (DASH-1 to DASH-6).
- `billing`: plans and prices, Wompi checkout config, webhook verification, idempotent event storage, status mapping, membership extension (BILL-1 to BILL-7).
- `security`: CSP, service-role isolation, rate limits, owner filtering with RLS, secrets handling, caching, localisation, accessibility, SEO (SEC, PERF, L10N, A11Y, SEO).

### Modified Capabilities

None. There are no existing specs; behavior is unchanged.

## Impact

- New files: `openspec/specs/{auth,books,receipt-ocr,dashboard,billing,security}/spec.md`.
- Edited docs: `spec/SPEC.md`, `openspec/config.yaml`, `AGENTS.md`.
- No source, migration, API or dependency changes.
- `README.md` already links to `spec/SPEC.md`, which stays.
