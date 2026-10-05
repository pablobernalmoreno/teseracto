# AGENTS.md

Instructions for AI coding agents working on **teseracto** — a Next.js 16 (App Router) app with React 19, MUI 9, Supabase and TypeScript, managed with pnpm. Redux Toolkit is installed but unused (`spec/SPEC.md` GAP-13); state lives in hooks and context.

## Development Workflow (MANDATORY)

For every feature, bug fix, or task requested, you must strictly follow this four-phase cycle. Do not skip phases or jump straight to coding.

### 1. Explore

- Read existing codebase files, check directory structures, and inspect dependencies before writing code.
- Understand existing patterns and constraints (see `README.md` for the architecture and presenter guidelines).

### 2. Plan

- Propose a clear, concise step-by-step implementation plan.
- List the files you intend to create or modify.
- **Wait for my approval or feedback before moving to the coding phase.**

### 3. Code

- Execute the plan methodically using your tools.
- Adhere strictly to TypeScript, Next.js App Router conventions, and project styling rules.
- Keep changes atomic and clean.

### 4. Commit

- Run the gate and make sure every step is green. **Never commit on a red gate.**

  ```sh
  pnpm lint
  pnpm exec next typegen   # refresh .next/types so tsc sees moved routes
  pnpm exec tsc --noEmit
  pnpm test
  ```

- Split doc changes and code changes into **separate commits, doc side first**.
- Prepare a clear, descriptive Git commit message summarizing the changes made.

## Standards: what is checked for you, and what isn't

What runs automatically:

| Where                            | Check                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-commit (`.husky/pre-commit`) | `lint-staged`: Prettier + ESLint `--fix` on staged `js/jsx/ts/tsx`, Prettier on `json/md/css/scss`                                                 |
| ESLint (`eslint.config.mjs`)     | Next core-web-vitals + TypeScript rules, `eqeqeq`, `no-debugger`, `no-console` (warn/error allowed), `no-explicit-any` and unused vars as warnings |
| CI (`.github/workflows/`)        | `pnpm lint:ci`, Gitleaks secret scan, `pnpm audit --prod --audit-level=high`, Semgrep (OWASP Top 10 + JavaScript)                                  |

Nothing runs `tsc` or `jest` for you — the Commit phase gate above is the only place they run.

**A green checker is not a passed review.** These rules are still yours to apply, and nothing greps for them:

- Use MUI components and the existing CSS / CSS Modules for UI; do not add another UI kit.
- Keep layer boundaries: route files in `src/app/**` stay thin and delegate to `src/features/**`; views do not call Supabase directly — go through the feature's `model/` services, server actions or route handlers.
- Service-role Supabase access (`src/lib/supabase/serviceRole.ts`) stays server-side only.
- Validate and rate-limit untrusted input at API boundaries using `src/lib/security/`.
- Do not move or rename these without updating the external config that points at them: `src/app/api/auth/callback/` (Supabase Auth → URL Configuration → Redirect URLs) and `src/app/api/billing/wompi/webhook/` (Wompi dashboard events URL).
- Only create a presenter when it adds real orchestration value (see `README.md`).
- Interactive elements are accessible: semantic element or correct `role`, and an accessible name.
- State in a comment whether new error handling fails **open** or **closed**, and why.
- For every path you write, name its complement and say what happens there.
- Reducers return the **identical state reference** on a no-op; never read a ref during render.
- Chaos tests assert **invariants, never outcomes**. Test through public entry points.
- Never change production code to make a test pass — write the failing test, stop, and report.
- Verify a documentation claim against the code and cite `file:line` before writing it.
- Schema changes go in a new dated file under `migrations/` (`YYYYMMDD_description.sql`); never edit an applied migration.

## Project Architecture & Folder Structure (MANDATORY)

All code must adhere to this directory layout. Do not place files outside of these designated boundaries:

```text
teseracto/
├── cypress/                    # Cypress component tests, support and synthetic receipt fixtures
├── migrations/                 # Dated Supabase SQL migrations
├── openspec/                   # OpenSpec workflow: specs/ (requirements per capability), changes/
├── public/                     # Static assets (images, icons)
├── spec/                       # Index, data model, API contracts, gaps (SPEC.md); requirements are in openspec/specs/
├── test-support/               # Test-only helpers (filename oracle, OCR accuracy suite); never imported from src/
├── src/
│   ├── app/                    # Next.js App Router (pages, layouts, route handlers ONLY)
│   │   ├── (auth)/             # Route group for authentication pages (no URL segment)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── account_confirmation/
│   │   ├── actions/            # Server actions
│   │   ├── api/                # Route handlers
│   │   │   ├── auth/callback/  # Supabase OAuth/magic-link callback
│   │   │   └── billing/wompi/  # Wompi checkout config + webhook
│   │   ├── auth/callback/      # Legacy: forwards to /api/auth/callback; error/ is the callback error page
│   │   ├── main/               # Authenticated dashboard page
│   │   ├── pricing/            # Public plan comparison
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   │
│   ├── components/             # Global, reusable UI components
│   │   ├── ui/                 # Atomic components (buttons, inputs)
│   │   └── navbar.tsx          # Global navigation bar
│   │
│   ├── features/               # Code grouped by business module
│   │   └── <feature>/          # Today: dashboard/, login/
│   │       ├── components/     # Components exclusive to this feature
│   │       ├── model/          # Services, state hooks, context
│   │       ├── presenters/     # Only when they add orchestration value
│   │       └── view/           # Feature screens composed from components
│   │
│   ├── lib/                    # Third-party configurations & utilities
│   │   ├── supabase/           # Supabase-specific logic
│   │   │   ├── client.ts       # Browser client (for Client Components)
│   │   │   ├── server.ts       # Server client (for Server Components/APIs)
│   │   │   ├── serviceRole.ts  # Service-role client (server-only)
│   │   │   └── proxy.ts        # Session refresh used by src/proxy.ts
│   │   ├── security/           # Input validation, rate limiting
│   │   ├── auth/               # Safe post-login redirect paths
│   │   ├── pricing.ts          # Pricing plans (shared by API routes and dashboard)
│   │   └── data.ts             # Date parsing helpers
│   │
│   ├── types/                  # TypeScript definitions
│   │   ├── dashboard.ts        # Ledger entry type (MainData)
│   │   └── database.types.ts   # Auto-generated Supabase types
│   │
│   └── proxy.ts                # Next.js proxy (Next 16 name for middleware; calls lib/supabase/proxy)
│
├── .env.local                  # Local environment variables (SUPABASE_URL, etc.)
├── next.config.ts              # Next.js configuration
├── package.json
└── tsconfig.json
```

Next 16 renamed `middleware.ts` to `proxy.ts`; never add a `middleware.ts`.

Regenerate `src/types/database.types.ts` after every migration:

```sh
pnpm dlx supabase gen types typescript --project-id thmibsraljsxawcogiyt > src/types/database.types.ts
```

Tests live next to the code they cover as `*.test.ts(x)`.

## Patterns and Principles

- SOLID
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Functional Programming
- Compound Components
