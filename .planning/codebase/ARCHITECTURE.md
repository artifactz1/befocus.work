<!-- refreshed: 2026-09-22 -->
# Architecture

**Analysis Date:** 2026-09-22

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         apps/next (Next.js 15)                       │
├───────────────────────────┬───────────────────────┬─────────────────┤
│   App Router pages         │   Client components    │  Zustand stores │
│  `src/app/**`               │  `src/components/**`   │  `src/store/**` │
│  server-fetched-then-hydrate│  Framer Motion, ShadCN │  timer/sounds/  │
│                             │                         │  todo state     │
└──────────────┬─────────────┴───────────┬─────────────┴────────┬────────┘
               │                          │                      │
               │ better-fetch (server)    │ TanStack Query        │
               │ cookie-forwarded         │ (hono/client RPC,     │
               ▼                          ▼ credentials: include) │
┌─────────────────────────────────────────────────────────────────────┐
│                    packages/api (Hono on Cloudflare Workers)         │
│  `src/lib/create-app.ts` - ordered middleware chain                  │
│  `src/routes/**` - OpenAPI three-file split (route/handler/index)    │
│  `src/app.ts` - wires routers, exports `AppType` for the RPC client  │
└───────────────────────────┬───────────────────────────────────────────┘
                             │ drizzle-orm/neon-http (per-request client)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Neon serverless Postgres (`packages/api/src/db`)        │
│   Tables: auth (better-auth), sessionSettings, sounds, tasks         │
└─────────────────────────────────────────────────────────────────────┘
```

`packages/ui` (ShadCN components + `globals.css` design tokens) and `packages/app` (env schemas, auth provider utils) are shared libraries consumed by both `apps/next` and `packages/api` - not runtime services of their own.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Hardcodes `dark` class + font vars on `<html>`, mounts theme/query providers | `apps/next/src/app/layout.tsx` |
| Dashboard layout (Server Component) | Fetches `Settings` server-side via cookie-forwarded `betterFetch`, passes to shell | `apps/next/src/app/(app)/layout.tsx` |
| `DashboardShell` | One-time client hydration of `useTimerStore` from server-fetched settings | `apps/next/src/hooks/DashboardShell.tsx` |
| `Dashboard` (page) | Composes the dashboard: background, header, timer, footer, global overlays | `apps/next/src/app/(app)/page.tsx` |
| `AppBackground` | Renders background/overlay/grain layers driven entirely by CSS custom properties | `apps/next/src/components/dashboard/AppBackground.tsx` |
| Next middleware | Session-gate for all routes except guest/auth/password pages | `apps/next/src/middleware.ts` |
| `createApp` | Builds the ordered Hono middleware chain and auth gate | `packages/api/src/lib/create-app.ts` |
| `app.ts` | Registers routers, exports `AppType` (RPC contract for the frontend) | `packages/api/src/app.ts` |
| Route handlers | Read `c.get('db')`/`c.get('user')`, perform Drizzle queries, return typed JSON | `packages/api/src/routes/user/user.handler.ts` |
| `initializeDrizzleNeonDB` | Creates a per-request Neon HTTP client, stashes on context | `packages/api/src/db/index.ts` |
| better-auth config | Cross-subdomain cookie config, OAuth providers | `packages/api/src/lib/middlewares/auth/initialize-better-auth.ts`, `create-better-auth-config.ts` |
| `api.client.ts` | Typed `hono/client` RPC instance used by all TanStack Query hooks | `apps/next/src/lib/api.client.ts` |

## Pattern Overview

**Overall:** Turborepo monorepo, thin-client + typed-RPC-backend. Next.js App Router (Server Components for initial data fetch, Client Components for interactivity) talks to a Hono/Cloudflare-Workers API through a fully-typed RPC client (`hono/client`) generated from the API's own route definitions - there is no separate OpenAPI codegen step, the type flows directly from `AppType` in `packages/api/src/app.ts`.

**Key Characteristics:**
- Server Components do a one-shot data fetch per request (no persistent server-side session object); everything else is client-fetched via TanStack Query.
- All app state that must survive navigation lives in Zustand stores (`src/store/`), not React context.
- Styling/theming is CSS-custom-property driven (HSL tuples + Tailwind `hsl(var(--x))` color tokens), so runtime customization does not require Tailwind recompilation.
- The API is a single Worker with one global middleware chain; there are no per-route middleware stacks - auth gating is achieved by mounting public routes (like `/api/auth/**`) *before* the catch-all `requireAuth`.

## Layers

**Presentation (`apps/next/src/app/**`, `apps/next/src/components/**`):**
- Purpose: route composition and UI rendering.
- Location: `apps/next/src/app/` (route groups `(app)`, `(auth)`, `guest`), `apps/next/src/components/` (feature-grouped: `dashboard/`, `sessions/`, `settings/`, `sounds/`, `timer/`, `to-do-list/`, `input/`, `helper/`).
- Contains: Server Components (layouts that fetch), Client Components (`'use client'` - the majority).
- Depends on: `store/` (Zustand), `hooks/` (TanStack Query wrappers), `lib/api.client.ts`, `@repo/ui` components.
- Used by: nothing above it - this is the entry layer.

**Client state (`apps/next/src/store/**`):**
- Purpose: in-memory, non-persisted (no zustand `persist` middleware anywhere) client state for timer, sounds, and to-do list.
- Location: `apps/next/src/store/useTimerStore.tsx`, `useSoundsStore.tsx`, `useToDoStore.tsx`.
- Contains: plain `create<T>((set, get) => ({...}))` stores, no slices/middleware.
- Depends on: nothing (leaf state containers); `useTimerStore` exposes `hydrateFromSettings` as its integration point with server data.
- Used by: components and hooks that read/write timer, sound, or task UI state.

**Data-fetch hooks (`apps/next/src/hooks/**`):**
- Purpose: wrap `api` (hono RPC client) calls in TanStack Query `useQuery`/`useMutation`.
- Location: `apps/next/src/hooks/useSession.ts`, `useSounds.ts`, `useTasks.ts`, `useTimer.ts` (note: `DashboardShell.tsx` also lives in `hooks/` despite being a component - see Anti-Patterns).
- Contains: query key conventions (`['userSettings']`, `['userTasks']`), mutation + `invalidateQueries` pairs, `sonner` toast side effects.
- Depends on: `lib/api.client.ts`.
- Used by: components that need server data (e.g. `TimerInitializer`, `PrefetchUserTasks`, settings panels).

**API composition (`packages/api/src/lib/create-app.ts`, `app.ts`):**
- Purpose: build the single Hono app instance, its middleware order, and its route registry.
- Location: `packages/api/src/lib/create-app.ts` (middleware chain), `packages/api/src/app.ts` (route wiring + `AppType` export), `packages/api/src/index.ts` (Worker `fetch` entry).
- Depends on: middlewares (`lib/middlewares/**`), routers (`routes/**`).
- Used by: `packages/api/src/index.ts` (runtime) and `apps/next/src/lib/api.client.ts` (type-only import of `AppType`).

**Routes (`packages/api/src/routes/**`):**
- Purpose: HTTP surface, one directory per resource group (currently only `user/`).
- Location: `packages/api/src/routes/user/user.route.ts` (Zod/OpenAPI schemas), `user.handler.ts` (implementations), `user.index.ts` (chains `.openapi()` calls).
- Depends on: `db/schemas.ts` (drizzle-zod schemas), `lib/openapi/helpers/*`, `types/app-context.ts`.
- Used by: `app.ts`'s `routes` array.

**Data access (`packages/api/src/db/**`):**
- Purpose: Drizzle table definitions, drizzle-zod schema generation, per-request Neon client construction.
- Location: `packages/api/src/db/tables/{auth,settings,sounds,tasks}.ts`, re-exported from `db/schemas.ts`; connection factory in `db/index.ts`.
- Depends on: `@neondatabase/serverless`, `drizzle-orm/neon-http`, `drizzle-zod`.
- Used by: route handlers (via `c.get('db')`), `drizzle.config.ts` (migrations, reads the same `schemas.ts` barrel).

**Shared libraries (`packages/ui`, `packages/app`, `packages/types`):**
- Purpose: cross-cutting code with no runtime of its own.
- `packages/ui`: ShadCN primitives (`src/components/ui/*`), `magicui` effects, `globals.css` design tokens, Tailwind config.
- `packages/app`: Zod-validated env schemas (`env/api.ts` for the Worker, `env/next.ts` via `@t3-oss/env-nextjs`), auth provider utils (`provider/auth/*`).
- `packages/types`: hand-written shared types (`tasks.ts`) - not a real workspace package (no `package.json`), reached purely via a tsconfig path alias.

## Data Flow

### Initial dashboard load (settings hydration)

1. Browser requests `/` → Next middleware checks session via `betterFetch` to `${API_URL}/api/auth/get-session`, forwarding the request's cookie header (`apps/next/src/middleware.ts:16-21`). Unauthenticated users are redirected to `/guest`.
2. `(app)/layout.tsx` (Server Component) calls the server action `getUserSettings()`, which reads the `better-auth.session_token` cookie directly and calls `betterFetch<Settings>('${API_URL}/user/settings')` with that cookie forwarded manually (`apps/next/src/lib/server/getUserSettings.ts:23-32`).
3. Server Component passes the fetched `Settings | null` into `<DashboardShell initialSettings={data}>` (`apps/next/src/app/(app)/layout.tsx:11`).
4. `DashboardShell` (Client Component) runs a `useEffect` once: if not already hydrated and `initialSettings` is present, calls `useTimerStore.hydrateFromSettings(...)` (`apps/next/src/hooks/DashboardShell.tsx:17-25`).
5. **Redundant path:** `TimerInitializer` (mounted in the dashboard page, not the layout) independently re-fetches `/user/settings` client-side via TanStack Query and also calls `hydrateFromSettings` on success (`apps/next/src/components/timer/TimerInitializer.tsx:9-26`). Both paths write to the same store field - see Anti-Patterns.

### Settings write path (session duration settings)

1. UI component (e.g. `SessionSettings`) calls `useSaveUserSettings()` / `useUpdateUserSettings()` (`apps/next/src/hooks/useSession.ts`).
2. Hook calls the typed RPC client: `api.user.settings.$put({ json: settings })` (credentials included via `lib/api.client.ts:9-13`).
3. Request hits the Worker's middleware chain (auth resolved, `c.get('user')` populated) then `updateUserSettings` handler: loads existing `sessionSettings` row by `userId`, updates it, returns the row (`packages/api/src/routes/user/user.handler.ts:131-160`).
4. On success, the hook invalidates `['userSettings']`, triggering any active `useUserSettings`/`TimerInitializer` query to refetch. `useTimerStore` is **not** automatically re-hydrated from this refetch unless a mounted `TimerInitializer` re-runs its effect.

**State Management:**
- Server-authoritative resources (settings, sounds, tasks) live in Postgres and are read via TanStack Query hooks with query-key-based invalidation.
- Ephemeral/interaction state (which sound is playing, timer countdown, to-do add-mode) lives only in Zustand, never persisted to `localStorage` today (no `persist` middleware present anywhere in `store/`).
- The only bridge from "server truth" to "client store" is the explicit `hydrateFromSettings` call - there is no generic sync layer.

## Key Abstractions

**OpenAPI three-file route split:**
- Purpose: separate the wire contract (Zod schemas via `createRoute`) from the implementation (`AppRouteHandler<typeof Route>`) from route registration (`.openapi(route, handler)` chaining).
- Examples: `packages/api/src/routes/user/user.route.ts`, `user.handler.ts`, `user.index.ts`.
- Pattern: adding an endpoint means adding to all three files, then adding the router to the `routes` array in `packages/api/src/app.ts` - omitting the last step means the route works at runtime but is invisible to the typed frontend client.

**Server-fetched-then-hydrate:**
- Purpose: avoid SSR/CSR drift for user-scoped data.
- Examples: `apps/next/src/app/(app)/layout.tsx` → `apps/next/src/lib/server/getUserSettings.ts` → `apps/next/src/hooks/DashboardShell.tsx` → `useTimerStore.hydrateFromSettings`.
- Pattern: a `'use server'` function manually forwards the `better-auth.session_token` cookie (not the `authClient` session helper) to the API, returns `null` on failure, and the shell component hydrates a Zustand store exactly once via an `isHydrated` guard flag.

**CSS-custom-property theming contract:**
- Purpose: let runtime (non-Tailwind-compiled) values drive presentation.
- Examples: `packages/ui/src/globals.css:5-16` (background contract: `--bg-image`, `--bg-image-size`, `--bg-image-position`, `--bg-overlay-color`, `--bg-overlay-opacity`, `--bg-blur`), consumed by `apps/next/src/components/dashboard/AppBackground.tsx`. Color tokens (`--background`, `--accent`, etc.) defined per-theme-class (`:root`, `.dark`) in the same file and wired into Tailwind via `hsl(var(--x))` in `packages/ui/tailwind.config.ts:28-62`.
- Pattern: a component sets inline `style={{ backgroundImage: 'var(--bg-image)' }}` (or references the token via a Tailwind class like `bg-background`) and something else (currently: nothing yet - the comment says "settings page will populate via CSS vars") is expected to `document.documentElement.style.setProperty(...)` these variables. **This contract exists in CSS today with no writer implemented** - it is the intended integration point for the customization feature (see `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md`).

**Typed RPC client (`hono/client`):**
- Purpose: end-to-end type safety from Drizzle/Zod schema → Hono route → frontend fetch call, no codegen step.
- Examples: `apps/next/src/lib/api.client.ts` imports `AppType` (type-only) from `@repo/api/src/app`; call sites like `api.user.settings.$get()`, `api.user.tasks[':id'].$put(...)`.
- Pattern: any new route must be chained with `.openapi(...)` in an `*.index.ts` file that is itself included in the `routes` array in `packages/api/src/app.ts`, or it will not appear on `api.*`.

## Entry Points

**Next.js Worker/server entry:**
- Location: `apps/next/src/app/layout.tsx` (root layout, always renders).
- Triggers: every HTTP request to the Next app.
- Responsibilities: hardcodes `className='dark'` + font CSS var on `<html>`, mounts `next-themes` `ThemeProvider` (`attribute='class' defaultTheme='dark' enableSystem`) and `AppProviders` (TanStack Query).

**Next.js middleware:**
- Location: `apps/next/src/middleware.ts`.
- Triggers: every request except static assets, `/api`, `/sounds` (see `matcher`).
- Responsibilities: session check against the API, redirect gate for `/guest`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password-success`.

**Cloudflare Worker entry:**
- Location: `packages/api/src/index.ts`.
- Triggers: every request to the Worker (`fetch` handler).
- Responsibilities: delegates to `app.fetch` (the composed Hono app from `packages/api/src/app.ts`).

**Dashboard page composition:**
- Location: `apps/next/src/app/(app)/page.tsx`.
- Triggers: navigating to `/` while authenticated.
- Responsibilities: mounts all dashboard-wide singletons (`GlobalSoundsPlayer`, `TimerInitializer`, `PrefetchUserTasks`, `SessionCompleteModal`, `CommandMenu`, `AppBackground`) plus the visible `Header`/`Timer`/`Footer` composition. This is the component to extend for new dashboard-wide overlays (e.g. a future `CustomizePanel`).

## Architectural Constraints

- **Threading:** Cloudflare Workers execution model - single-threaded per request, no persistent process state. `initializeDrizzleNeonDB` explicitly avoids module-level DB clients because "the Worker has no persistent globals you can rely on" (confirmed in `packages/api/src/db/index.ts:9-19`, comment in project `CLAUDE.md`).
- **Global state:** `packages/api/src/index.ts` sets a module-level `port = 8787` constant only; no other module-level mutable state in the API. Frontend Zustand stores (`useTimerStore`, `useSoundsStore`, `useToDoStore`) are module-level singletons by design (Zustand's `create()` pattern) - safe in a browser SPA context but means any SSR-time read of these stores would leak between requests if ever attempted (currently avoided; stores are only touched in `'use client'` components).
- **Dark-mode-only theming today:** `<html className='dark'>` is hardcoded in `apps/next/src/app/layout.tsx:18` alongside a working `next-themes` `ThemeProvider`/`DarkModeToggle` pair that is largely vestigial - `DarkModeToggle` is commented out of `MenuSettings.tsx:14`. Any customization feature adding a light theme must first decide whether to remove the hardcoded `dark` class.
- **No `persist` middleware:** none of the three Zustand stores persist to `localStorage` today; all client state is lost on refresh except what `hydrateFromSettings` re-derives from the server. A guest-mode customization feature (per the design spec's localStorage sync strategy) has no existing localStorage-persistence pattern to imitate in this codebase - it would be new.
- **Middleware order is load-bearing:** see `packages/api/src/lib/create-app.ts` - `requireAuth` is mounted last on `'*'`, so any new route mounted in `app.ts`'s `routes` array is auth-gated by default unless a handler for it is placed *before* `requireAuth` inside `createApp()` itself (as `/api/auth/**` is).

## Anti-Patterns

### Duplicate settings hydration paths

**What happens:** Both `DashboardShell` (server-fetched, mounted in the `(app)` layout) and `TimerInitializer` (client-fetched via TanStack Query, mounted in the dashboard page) independently call `useTimerStore.hydrateFromSettings(...)` on mount (`apps/next/src/hooks/DashboardShell.tsx:17-25` and `apps/next/src/components/timer/TimerInitializer.tsx:18-26`).
**Why it's wrong:** Two independent fetches of the same resource (`/user/settings`) race to write the same store fields. `DashboardShell` guards with `isHydrated`, but `TimerInitializer`'s effect has no such guard beyond React Query's own `isSuccess` - if settings change between the two fetches (e.g. another tab updates them), the store can be hydrated twice with different values, and it is unclear which one "wins" depending on network timing.
**Do this instead:** Pick one hydration owner. Prefer keeping the server-fetched path in `DashboardShell` as the sole writer of `hydrateFromSettings`, and have `TimerInitializer` (or its replacement) only call `hydrateFromSettings` when its query result differs from the current store state, or remove `TimerInitializer`'s hydration responsibility entirely and let it just prefetch/cache the TanStack Query data. Any new customization store (e.g. `useCustomizeStore` per the design spec) should have exactly one hydration entry point from the start.

### Misnamed component file/export

**What happens:** `apps/next/src/components/Header.tsx` defines and exports a component literally named `function Timer()` (`Header.tsx:7`), imported elsewhere as `Header` (`apps/next/src/app/(app)/page.tsx:6`). Meanwhile the actual pomodoro countdown UI lives in a *different* file, `apps/next/src/components/timer/Timer.tsx`, which itself imports session UI components (`SessionsUI`, `SessionTitleDisplay`, `SessionMobileCount`).
**Why it's wrong:** Two same-named components (`Timer`) exist in different files with unrelated responsibilities (session pips/title header content vs. the countdown ring). This is highly confusing for navigation and for any refactor that greps for `Timer`.
**Do this instead:** Rename the component inside `Header.tsx` to match its file and purpose (e.g. `SessionHeaderBar`), or merge it into `components/sessions/` where its actual dependencies live. Do not add new session-header content to `components/timer/Timer.tsx` expecting it to be the same component as `Header.tsx`.

### Dead scaffold page in the shared UI package

**What happens:** `packages/ui/src/pages/dashboard/index.tsx` contains an unrelated "Multicloud Orchestrator" VM-management mock UI (mock AWS/GCP/Azure VM list, deploy form) using `@/components/ui/*` imports that do not match this repo's alias conventions. It is not imported anywhere in the codebase (confirmed via repo-wide grep).
**Why it's wrong:** Dead code in a shared package increases the surface area scanned by tooling (lint, type-check, bundlers with `exports` globbing) for zero benefit, and its `@/` import alias is inconsistent with every other file in `packages/ui` (which uses relative or `@repo/ui/...`).
**Do this instead:** Delete the file, or if kept as a ShadCN scaffolding reference, move it outside `src/` (e.g. into a `.examples/` directory excluded from the package's `exports` and from Biome linting).

## Error Handling

**Strategy:** Handlers return typed JSON error bodies with explicit HTTP status codes; there is no thrown-exception-to-500 middleware pattern beyond Hono's built-in `onError`.

**Patterns:**
- Route handlers manually check `if (!user || !session)` and return `c.json({ message: ... }, HttpStatusCodes.NOT_FOUND)` - 404 is used even for "not authenticated" in several handlers (e.g. `getUser`, `getUserSettings`), while `deleteUserSound` correctly returns 401 (`packages/api/src/routes/user/user.handler.ts:280-283`). Status code choice is inconsistent across handlers.
- Body validation uses `schema.safeParse(body)` inline per-handler (not a shared validation middleware), returning 400 with `{ message, errors: parsed.error.format() }` on failure (e.g. `createUserSounds`, `createUserTask`).
- Centralized fallbacks: `notFound` and `onError` middlewares registered once in `createApp()` (`packages/api/src/lib/middlewares/not-found.ts`, `on-error.ts`) catch unmatched routes and uncaught exceptions.
- Frontend: TanStack Query mutations pair `onError` with a `sonner` `toast.error(...)` call (e.g. `apps/next/src/hooks/useSession.ts:52-55`); queries generally swallow failures by returning `null` or throwing to React Query's own error state without a shared error boundary.

## Cross-Cutting Concerns

**Logging:** No structured logging in the API path currently active - `pino`/`hono-pino` are installed dependencies but the logger middleware is commented out in `createApp()` with a `// TODO` linking a Notion ticket (`packages/api/src/lib/create-app.ts:29-30`). Frontend has stray `console.log` debug statements left in server components (e.g. `apps/next/src/app/(app)/layout.tsx:8`).

**Validation:** Zod schemas generated from Drizzle tables via `drizzle-zod` (`createSelectSchema`/`createInsertSchema`/`createUpdateSchema`) are the single source of truth for both API request/response shapes and DB row shapes. New tables should follow this pattern (see `packages/api/src/db/tables/settings.ts`) rather than hand-rolling parallel Zod schemas.

**Authentication:** better-auth, initialized per-request (`packages/api/src/lib/middlewares/auth/initialize-better-auth.ts`), session resolved once per request in `handleSessionMiddleware` and exposed as `c.get('user')`/`c.get('session')` (both nullable) to every downstream handler. `requireAuth` is the last middleware mounted on `'*'`, so it gates everything not explicitly mounted earlier in `createApp()`.

---

*Architecture analysis: 2026-09-22*
