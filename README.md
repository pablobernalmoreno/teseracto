This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🏗️ Architecture

This project uses a **feature-oriented architecture** with Next.js App Router as the entrypoint.
It includes selective MVP-style pieces where they provide value, rather than enforcing MVP for every feature.

### Current Pattern

- **Route layer** (`src/app/**`): pages, layouts, route handlers, server actions
- **Feature logic** (`src/features/**`): domain logic, state orchestration, and presenters
- **UI components** (`src/app/components/**`): reusable UI building blocks
- **Shared types** (`src/types/**`): cross-feature type contracts

### Presenter Best Practices

Use a presenter only when it adds real orchestration value.

Create a presenter when at least one is true:

- It maps domain data into view-specific props.
- It coordinates multiple hooks/services.
- It owns side effects that views should not know about.
- It provides a stable API between frequently changing model logic and stable UI.

Do **not** create a presenter when all it does is:

- Pass props through unchanged.
- Render one component without transformation.
- Exist only to satisfy a folder pattern.

If a presenter ends up empty or pass-through, prefer removing it.

### Project Tree (Current)

```
.
├── migrations/
├── public/
├── src/
│   ├── app/
│   │   ├── account_confirmation/
│   │   ├── actions/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── appBarMenu/
│   │   │   ├── dashboard/
│   │   │   └── dataTable/
│   │   ├── login/
│   │   ├── main/
│   │   │   ├── mainStyles.css
│   │   │   └── page.tsx
│   │   ├── pricing/
│   │   ├── register/
│   │   └── utils/
│   ├── config/
│   ├── features/
│   │   ├── account_confirmation/
│   │   ├── dashboard/
│   │   │   ├── model/
│   │   │   │   ├── dashboardService.ts
│   │   │   │   ├── state/
│   │   │   │   └── useItemCardModel.ts
│   │   │   ├── presenters/
│   │   │   └── view/
│   │   └── login/
│   ├── types/
│   └── proxy.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

### Decision Checklist

Before adding a new layer/file, ask:

1. Is this logic reused across multiple pages/features?
2. Does this layer reduce coupling or just add indirection?
3. Can this stay colocated with the route for now?
4. Is the API clearer after introducing this abstraction?

If the answer to 2 or 4 is no, keep it simpler.

## Cache Strategy (Next.js 16)

This project uses Cache Components and tag-based invalidation for dashboard data.

### Enabled Setting

- `cacheComponents: true` in `next.config.ts`

### Read Caching

Dashboard read actions in `src/app/actions/dashboard.ts` use:

- `'use cache: private'`
- `cacheLife('minutes')`
- `cacheTag(...)`

### Cache Tags

- Global books tag: `dashboard-books`
- Owner-scoped books tag: `dashboard-books:{ownerBookId}`
- Single-book tag: `dashboard-book:{bookId}`

### Invalidation Map

- `deleteBooks(...)`
  : updates `dashboard-books`, owner-scoped books tag, and each deleted `dashboard-book:{bookId}`
- `createBook(...)` (create)
  : updates `dashboard-books` and owner-scoped books tag
- `createBook(...)` (update existing)
  : updates `dashboard-books`, owner-scoped books tag, and the updated `dashboard-book:{bookId}`

### `updateTag` vs `revalidateTag`

- Use `updateTag` when the same request or immediate next render must see fresh data (current behavior).
- Use `revalidateTag` for stale-while-revalidate behavior when immediate consistency is not required.

### Rule of Thumb

When adding new read actions:

1. Add `use cache` directive and a bounded `cacheLife(...)` profile.
2. Add one broad tag and one scoped tag when possible.

When adding new write actions:

1. Invalidate all tags impacted by the write.
2. Prefer exact scoped tags to avoid over-invalidating unrelated data.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
