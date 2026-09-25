# AGENTS.md

Instructions for AI coding agents working on **teseracto** — a Next.js 16 (App Router) app with React 19, MUI 9, Redux Toolkit, Supabase and TypeScript, managed with pnpm.

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
- Service-role Supabase access (`src/app/utils/supabase/serviceRole.ts`) stays server-side only.
- Validate and rate-limit untrusted input at API boundaries using `src/app/utils/security/`.
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
teseractomy/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── app/                # Next.js App Router (Pages, layouts, APIs)
│   │   ├── (auth)/         # Route group for authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/            # Serverless API routes
│   │   │   └── auth/callback/ # Required for Supabase OAuth/magic links
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   │
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Atomic components (buttons, inputs)
│   │   └── navbar.tsx      # Global components
│   │
│   ├── lib/                # Third-party configurations & utilities
│   │   └── supabase/       # Supabase-specific logic
│   │       ├── client.ts   # Browser client (for Client Components)
│   │       ├── server.ts   # Server client (for Server Components/APIs)
│   │       └── middleware.ts # Session refreshing middleware
│   │
│   ├── types/              # TypeScript definitions
│   │   └── database.types.ts # Auto-generated Supabase types
│   │
│   └── middleware.ts       # Global Next.js middleware (calls supabase/middleware)
│
├── .env.local              # Local environment variables (SUPABASE_URL, etc.)
├── next.config.js          # Next.js configuration
├── package.json
└── tsconfig.json
```

Tests live next to the code they cover as `*.test.ts(x)`.

## Patterns and Principles

- SOLID
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Functional Programming
- Compound Components
