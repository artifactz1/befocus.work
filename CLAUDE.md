# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack snapshot

- **Monorepo**: Turborepo + Bun workspaces (`apps/*`, `packages/*`). Bun is the canonical package manager (`packageManager: bun@1.1.20`); `package-lock.json` files exist alongside `bun.lock` but Bun is what the scripts assume.
- **Frontend**: Next.js 15 App Router (`apps/next`), Tailwind, ShadCN UI, Zustand, TanStack Query, Framer Motion.
- **Backend**: Hono on Cloudflare Workers (`packages/api`) with `@hono/zod-openapi`, Drizzle ORM, Neon serverless Postgres, better-auth.
- **Lint/format**: Biome (single quotes, no semicolons, 100-col, trailing commas all, JSX single quotes). There is no ESLint or Prettier — do not introduce them.

## Commands

Run from repo root unless noted.

```bash
# Install
bun install

# Dev (pick one)
bun run turbo:dev      # all services
bun run web            # Next.js only  (http://localhost:3000)
bun run api            # Hono/Wrangler (http://localhost:8787)
bun run ui             # UI package dev

# Build / quality
bun run turbo:build
bun run turbo:lint
bun run turbo:format
bun run check          # format:check + lint + organize-imports check
bun run check-deps     # check-dependency-version-consistency

# Database (Drizzle, runs from packages/api)
bun run generate                                    # drizzle-kit generate (root alias)
cd packages/api && bun run db:migrate               # apply migrations
cd packages/api && bun run db:push                  # push schema (dev)
cd packages/api && bun run db:seed                  # bun run ./src/db/seed.ts
cd packages/api && bun run db:studio                # drizzle-kit studio

# Deploy API
cd packages/api && bun run deploy                   # wrangler deploy --minify
```

There is no test runner configured. Don't fabricate one — if you need to verify behavior, run the dev server and exercise the route, or write a one-off `bun run` script.

Local env requires two files: `packages/api/.dev.vars` (worker secrets — Drizzle also reads these directly via `drizzle.config.ts`) and `apps/next/.env.local`. Examples are in `.dev.vars.example` and `.env.example`.

## Architecture

### Workspace layout & path aliases

- `apps/next` — Next.js app. tsconfig paths: `~/*` → `src/*`, `@repo/api/*` → `packages/api/src/*`, `@repo/ui/*` → `packages/ui/src/components/ui/*`, `@repo/types/*` → `packages/types/*`.
- `packages/api` — Hono API + Drizzle schema. Cloudflare Worker entry is `src/index.ts`; the app composition lives in `src/app.ts`.
- `packages/ui` — Shared ShadCN components and `globals.css`. Imported by the Next app via `@repo/ui/...`.
- `packages/app` — Cross-app helpers: env schemas (`env/api.ts` Zod-validated worker env, `env/next.ts` `@t3-oss/env-nextjs`) and auth provider utilities.
- `packages/types` — Shared types (currently `tasks.ts`).
- `packages/typescript-config` — Shared `tsconfig` bases (`base.json`, `nextjs.json`, `api.json`, `react-library.json`).

### API request pipeline (`packages/api/src/lib/create-app.ts`)

Middleware order is load-bearing — new middleware must respect it:

1. `prettyJSON`, `secureHeaders`, `timing`
2. `initializeDrizzleNeonDB` + `initializeBetterAuth` (sets `c.var.db` and `c.var.auth`)
3. `betterAuthCorsMiddleware` (cross-subdomain cookies are enabled)
4. `handleSessionMiddleware` (sets `c.var.user`, `c.var.session`, both nullable)
5. better-auth handler mounted at `POST/GET /api/auth/**`
6. `notFound` / `onError`
7. `requireAuth` — applied to `*` last, so **everything not above is auth-gated by default**

`AppContext` (`packages/api/src/types/app-context.ts`) types the `Bindings` (worker env) and `Variables` (`db`, `user`, `session`, `auth`).

### Route pattern

Routes follow an OpenAPI three-file split, e.g. `packages/api/src/routes/user/`:

- `*.route.ts` — `createRoute({...})` definitions with Zod request/response schemas.
- `*.handler.ts` — `AppRouteHandler<typeof routes.x>` implementations.
- `*.index.ts` — chains `.openapi(route, handler)` calls on `createRouter()` and exports the router.

The chained `.openapi(...)` calls in `*.index.ts` are what make routes appear in the type exported from `src/app.ts`. **The frontend `hono/client` RPC (`apps/next/src/lib/api.client.ts`) imports `AppType` from `@repo/api/src/app`** — if a new route isn't wired into a `*.index.ts` chain, it won't exist on the typed client even if the runtime works.

Top-level wiring is in `packages/api/src/app.ts`: add new feature routers to the `routes` array.

### Database

- Schemas live in `packages/api/src/db/tables/{auth,settings,sounds,tasks}.ts` and are re-exported from `src/db/schemas.ts`. Drizzle pulls from that single barrel (`drizzle.config.ts` → `schema: './src/db/schemas.ts'`).
- Each table file colocates its `createSelectSchema` / `createInsertSchema` / `createUpdateSchema` (drizzle-zod) — reuse these in route definitions instead of hand-rolling Zod.
- Connection is per-request: `initializeDrizzleNeonDB` constructs a `neon(c.env.DATABASE_URL)` client and stashes it on the context. Don't create module-level DB clients — the Worker has no persistent globals you can rely on.

### Auth

better-auth is initialized per-request (`initialize-better-auth.ts`) with `crossSubDomainCookies: true`. In production, cookies are scoped to `extractDomain(WEB_DOMAIN)` and `sameSite: 'lax'`; in dev they are `sameSite: 'none'`. This means **prod expects API and web on the same root domain** (e.g. `api.example.com` + `app.example.com`).

Frontend auth client is `apps/next/src/lib/auth.client.ts` (`better-auth/react`). The Next.js middleware (`apps/next/src/middleware.ts`) gates every route except `/guest`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password-success`, and the matcher's static-asset exclusions; unauthenticated users get redirected to `/guest`, authenticated users hitting `/guest` get bounced to `/`.

OAuth providers configured: Google, GitHub, Discord, Apple (see `packages/app/env/api.ts` for the full required env list).

### Frontend state & hydration

- Zustand stores in `apps/next/src/store/` (`useTimerStore`, `useSoundsStore`, `useToDoStore`).
- The dashboard uses a **server-fetched-then-hydrate** pattern to avoid SSR/CSR drift: `app/(app)/layout.tsx` is an async Server Component that calls `getUserSettings()` (a server action in `lib/server/`) and passes the result into `DashboardShell`, a client component that calls `useTimerStore.hydrateFromSettings(...)` once. When adding new persisted user state, follow this pattern rather than fetching client-side on mount.
- TanStack Query is wired in `provider/AppProviders.tsx` (single `QueryClient`); data hooks live in `apps/next/src/hooks/use*.ts` and call the typed `api` client from `lib/api.client.ts`.

### App Router structure

Route groups under `apps/next/src/app/`:

- `(app)/` — authenticated dashboard (default route `/`).
- `(auth)/` — sign-in, etc.
- `guest/` — public landing page (only unauth-friendly route besides `(auth)`).

Root `layout.tsx` hardcodes `className='dark'` on `<html>` and uses `next-themes`.
