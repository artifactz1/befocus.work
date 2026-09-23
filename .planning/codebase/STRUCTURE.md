# Codebase Structure

**Analysis Date:** 2026-09-22

## Directory Layout

```
befocus.work/
├── apps/
│   └── next/                        # Next.js 15 App Router frontend ("web")
│       ├── src/
│       │   ├── app/                 # Route groups (App Router)
│       │   │   ├── (app)/           # Authenticated dashboard: layout.tsx, page.tsx
│       │   │   ├── (auth)/sign-in/  # Sign-in page + layout
│       │   │   ├── guest/           # Public landing page
│       │   │   └── layout.tsx       # Root layout (hardcodes `dark`, mounts providers)
│       │   ├── components/          # Feature-grouped UI components (see below)
│       │   ├── hooks/                # TanStack Query wrapper hooks + DashboardShell
│       │   ├── lib/                  # api.client.ts, auth.client.ts, server/, utils
│       │   ├── provider/             # AppProviders.tsx (QueryClientProvider)
│       │   ├── store/                 # Zustand stores (timer, sounds, todo)
│       │   └── middleware.ts         # Session-gate for all non-public routes
│       └── public/sounds/            # Static audio assets
├── packages/
│   ├── api/                         # Hono API on Cloudflare Workers ("@repo/api")
│   │   └── src/
│   │       ├── app.ts               # Route registry, exports AppType
│   │       ├── index.ts             # Worker fetch entry point
│   │       ├── db/
│   │       │   ├── tables/          # auth.ts, settings.ts, sounds.ts, tasks.ts
│   │       │   ├── schemas.ts       # Barrel re-export (drizzle.config.ts source)
│   │       │   ├── drizzle/          # Generated SQL migrations + meta
│   │       │   └── index.ts         # Per-request Neon client factory
│   │       ├── lib/
│   │       │   ├── create-app.ts    # Ordered middleware chain (load-bearing)
│   │       │   ├── middlewares/     # auth/, not-found.ts, on-error.ts, ...
│   │       │   └── openapi/          # OpenAPI helper schemas
│   │       ├── routes/
│   │       │   └── user/            # *.route.ts / *.handler.ts / *.index.ts
│   │       └── types/                # app-context.ts (Bindings/Variables), zod.ts
│   ├── app/                          # Cross-app helpers ("@repo/app")
│   │   ├── env/                     # api.ts (Worker env, Zod), next.ts (t3-env)
│   │   └── provider/auth/            # Auth provider utils shared by API + web
│   ├── ui/                           # Shared ShadCN components ("@repo/ui")
│   │   └── src/
│   │       ├── components/ui/       # ShadCN primitives (button, dialog, ...)
│   │       ├── components/magicui/  # Visual effect components (border-beam, ...)
│   │       ├── globals.css           # Design tokens + `--bg-*` theming contract
│   │       └── pages/dashboard/      # Unused scaffold - see Special Directories
│   ├── types/                        # Shared types ("@repo/types", no package.json)
│   │   └── tasks.ts
│   └── typescript-config/            # Shared tsconfig bases (base/nextjs/api/react-library)
├── docs/superpowers/specs/           # Design specs (e.g. dashboard customization)
├── turbo.json                        # Turborepo pipeline (build/lint/format/dev)
└── package.json                      # Root workspace scripts, Bun workspaces
```

## Directory Purposes

**`apps/next/src/app/`:**
- Purpose: App Router route groups.
- Contains: `(app)/` (authenticated dashboard, default route `/`), `(auth)/sign-in/` (sign-in), `guest/` (public landing - only unauth-friendly route besides sign-in).
- Key files: `(app)/layout.tsx` (server-fetches settings, wraps `DashboardShell`), `(app)/page.tsx` (dashboard composition root), root `layout.tsx` (theme + query providers, `className='dark'`).

**`apps/next/src/components/`:**
- Purpose: all UI components, organized by dashboard feature area rather than by atomic/molecule/organism tiers.
- Subdirectories: `dashboard/` (background/timer-ring visuals), `sessions/` (session pips, title, theme provider), `settings/` (menu + mobile variants for each settings category), `sounds/` (sound picker UI), `timer/` (countdown ring, buttons, initializer), `to-do-list/` (task list UI), `input/` (numeric/duration inputs), `helper/` (cross-cutting utilities: `ClientOnly`, `Divider`, `MenuButtons`, `PrefetchUserTasks`, `useIsMobileLandscape`).
- Top-level loose files (not in a subdirectory): `AccountButton.tsx`, `CommandDialogContent.tsx`, `CommandMenu.tsx`, `DarkModeToggle.tsx`, `Footer.tsx`, `Header.tsx` (misnamed - see `ARCHITECTURE.md` Anti-Patterns), `SessionCompleteModal.tsx`.
- Convention: most desktop settings components have a `*Mobile.tsx` sibling (e.g. `MenuSettings.tsx` / `MenuSettingsMobile.tsx`) rather than using responsive classes within one component.

**`apps/next/src/hooks/`:**
- Purpose: TanStack Query data-fetch wrappers, one file per resource.
- Contains: `useSession.ts` (settings CRUD), `useSounds.ts`, `useTasks.ts`, `useTimer.ts`, `useCommandMenuHooks.tsx`, `useParsedCommands.tsx`.
- Note: `DashboardShell.tsx` also lives here despite being a rendering component, not a hook - an existing inconsistency to be aware of, not a pattern to copy for new code (put new shell/wrapper components in `components/` or `app/(app)/`).

**`apps/next/src/lib/`:**
- Purpose: cross-cutting frontend utilities and clients.
- Contains: `api.client.ts` (typed hono RPC client), `auth.client.ts` (better-auth react client), `timerWorker.ts` (Web Worker for countdown), `utils.ts` (generic helpers), `server/` (Next.js Server Actions - currently just `getUserSettings.ts`).

**`apps/next/src/store/`:**
- Purpose: Zustand client state, one file per domain, no persistence middleware.
- Contains: `useTimerStore.tsx` (countdown/session state + `hydrateFromSettings`), `useSoundsStore.tsx` (sound library, volumes, player refs), `useToDoStore.tsx` (local to-do list scaffold - note `useTasks.ts` hook is the actual server-synced task source; the store's own `addTask`/`setTasks` shape is a parallel, possibly-unused path worth checking before extending).

**`packages/api/src/routes/`:**
- Purpose: HTTP route definitions, one subdirectory per resource group.
- Contains: `user/` (user profile, session, settings, sounds, tasks - all under `/user/*`), `index.route.ts` (root route, no handler split needed for a single trivial route).
- Key files: `user.route.ts` (Zod/OpenAPI `createRoute` definitions + exported route types), `user.handler.ts` (implementations typed as `AppRouteHandler<RouteType>`), `user.index.ts` (chains `.openapi(route, handler)` - this file's export is what must be registered in `app.ts`).

**`packages/api/src/db/`:**
- Purpose: Drizzle ORM schema and connection management.
- Contains: `tables/auth.ts` (better-auth-managed `user`/`session`/`account` tables), `tables/settings.ts` (`sessionSettings` - the only current per-user preferences table), `tables/sounds.ts`, `tables/tasks.ts`, `schemas.ts` (barrel export consumed by `drizzle.config.ts` and route files), `index.ts` (`initializeDrizzleNeonDB` - per-request client, no module-level DB instance), `drizzle/` (generated migration SQL, do not hand-edit).

**`packages/api/src/lib/middlewares/`:**
- Purpose: Hono middleware, composed in `create-app.ts`.
- Contains: `auth/` (`better-auth-cors.ts` with both `betterAuthCorsMiddleware` and `requireAuth`, `create-better-auth-config.ts`, `handle-session.ts`, `initialize-better-auth.ts`), `not-found.ts`, `on-error.ts`, `serve-emoji-favicon.ts`.

**`packages/ui/src/`:**
- Purpose: shared design system, imported into the Next app via Tailwind `content` globs and direct component imports.
- Contains: `components/ui/` (ShadCN primitives - button, dialog, drawer, dropdown-menu, select, slider, tabs, tooltip, etc.), `components/magicui/` (visual flourish components), `hooks/useDebounce.tsx`, `lib/utils.ts` (`cn()` helper), `globals.css` (all design tokens + the `--bg-*` background-customization CSS variable contract), `pages/dashboard/` (dead scaffold, see Special Directories).

**`packages/app/`:**
- Purpose: environment schema validation and auth-provider utilities shared between the Worker and the Next app.
- Contains: `env/api.ts` (Zod-validated Worker `Bindings`, includes all OAuth provider secrets), `env/next.ts` (`@t3-oss/env-nextjs` schema), `provider/auth/` (`cookie-store.ts`, `utils.ts`, `index.ts`), `provider/utils.ts`.

**`packages/types/`:**
- Purpose: hand-written shared TypeScript types not derived from Drizzle.
- Contains: `tasks.ts` (frontend-facing `Task` type, includes UI-only `editMode` field not present in the DB schema).
- Note: has no `package.json` - it's reached only via the `@repo/types/*` tsconfig path alias (`apps/next/tsconfig.json`), not a real Bun workspace member. Add new shared types here only if they don't belong closer to a Drizzle table (prefer `drizzle-zod`-derived types in `packages/api/src/db/tables/*` when the type mirrors a DB row).

**`docs/superpowers/specs/`:**
- Purpose: design specs written before implementation planning.
- Key file: `2026-04-29-dashboard-customization-design.md` - full spec for the theming/layout/media-upload feature, including target data model, API surface, and component structure under `apps/next/src/components/customize/` (not yet created).

## Key File Locations

**Entry Points:**
- `apps/next/src/app/layout.tsx`: Root layout, theme + query providers.
- `apps/next/src/middleware.ts`: Session gate for the Next app.
- `packages/api/src/index.ts`: Cloudflare Worker `fetch` entry.
- `packages/api/src/app.ts`: API route registry + `AppType` export (frontend RPC contract).

**Configuration:**
- `apps/next/next.config.mjs`: `transpilePackages: ['@repo/ui', '@repo/api']`.
- `apps/next/tsconfig.json`: path aliases (`~/*`, `@repo/api/*`, `@repo/ui/*` - scoped to `components/ui` only, `@repo/types/*`).
- `packages/api/drizzle.config.ts`: reads schema from `packages/api/src/db/schemas.ts`, reads `.dev.vars` directly.
- `packages/ui/tailwind.config.ts`: color tokens mapped to CSS vars, imported by the Next app's Tailwind content globs.
- `turbo.json`: task pipeline (`build`, `lint`, `format`, `dev`).

**Core Logic:**
- `packages/api/src/lib/create-app.ts`: middleware order (load-bearing, see `ARCHITECTURE.md`).
- `apps/next/src/lib/api.client.ts`: typed RPC client, all data hooks route through this.
- `apps/next/src/store/useTimerStore.tsx`: canonical example of the store + `hydrateFromSettings` pattern any new persisted-preference store should follow.

**Testing:**
- None. No test runner is configured anywhere in the repo (confirmed: no `jest.config.*`, `vitest.config.*`, or `*.test.*`/`*.spec.*` files). See `CONVENTIONS.md`/`TESTING.md` if generated, or verify behavior by running `bun run web` / `bun run api` and exercising routes manually.

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g. `AppBackground.tsx`, `DashboardShell.tsx`).
- Hooks: `camelCase.ts`/`.tsx` prefixed with `use` (e.g. `useTasks.ts`, `useSoundsStore.tsx` - stores also use the `use*` prefix despite not being hooks in the strict sense).
- API route triplets: `<resource>.route.ts`, `<resource>.handler.ts`, `<resource>.index.ts` (e.g. `user.route.ts`).
- Drizzle table files: singular-domain, lower-case, matching the exported table's plural name loosely (`settings.ts` exports `sessionSettings`, `tasks.ts` exports `tasks`, `sounds.ts` exports `sounds`) - no fixed convention between file name and table name, check the actual export before importing.

**Directories:**
- Feature-grouped, not type-grouped, inside `apps/next/src/components/` (e.g. `sounds/`, `timer/`, `settings/` rather than `atoms/`, `molecules/`).
- Route groups use Next.js parenthesis convention: `(app)`, `(auth)` - these do not appear in the URL path.
- API resource routes are grouped under `routes/<resource>/` even when there is currently only one resource (`user/`).

## Where to Add New Code

**New dashboard-wide feature (e.g. a customize panel):**
- Component directory: `apps/next/src/components/<feature>/` (per the design spec: `apps/next/src/components/customize/`).
- Mount point: `apps/next/src/app/(app)/page.tsx` - add alongside the other dashboard-wide singletons (`GlobalSoundsPlayer`, `TimerInitializer`, `CommandMenu`, `AppBackground`).
- State: new Zustand store in `apps/next/src/store/` following the `useTimerStore.tsx` shape (plain `create()`, explicit `hydrateFromSettings`-style entry point, no `persist` middleware unless the feature explicitly needs `localStorage` - in which case this would be the first store to use it).
- Data hooks: `apps/next/src/hooks/use<Resource>.ts`, following `useSession.ts`'s query/mutation/invalidate pattern.

**New API resource (e.g. `themes`, `media`):**
- Table: `packages/api/src/db/tables/<resource>.ts`, colocate `createSelectSchema`/`createInsertSchema`/`createUpdateSchema`; add the export to `packages/api/src/db/schemas.ts`.
- Routes: `packages/api/src/routes/<resource>/<resource>.route.ts` + `.handler.ts` + `.index.ts`, following `routes/user/` exactly.
- Wiring: add the new router to the `routes` array in `packages/api/src/app.ts` - required for the route to appear on the typed `api.*` client, not just to work at runtime.
- Auth: no per-route auth annotation needed - everything is auth-gated by default via `requireAuth` in `create-app.ts` unless explicitly mounted earlier.

**New persisted user preference (e.g. active theme, layout density):**
- Follow the existing `sessionSettings` end-to-end pattern: table column/new table in `packages/api/src/db/tables/settings.ts` (or a new table if it's a 1:many relationship like saved themes), GET/PUT routes under `routes/user/`, a server action in `apps/next/src/lib/server/` for the initial SSR fetch (mirror `getUserSettings.ts`'s manual cookie-forwarding), and a hydration call from `DashboardShell.tsx` (prefer consolidating into the single existing hydration owner rather than adding another parallel client-fetch hydration path - see `ARCHITECTURE.md` Anti-Patterns).

**New CSS-variable-driven visual property:**
- Declare the variable's default in `packages/ui/src/globals.css` `:root` block, next to the existing `--bg-*` contract (line ~5-16).
- Consume it via inline `style` (see `AppBackground.tsx`) or a Tailwind token in `packages/ui/tailwind.config.ts` if it should be usable as a utility class.
- Write it via `document.documentElement.style.setProperty(...)` from the client (no existing writer to copy yet - this is the gap the customization feature fills).

**Shared UI primitive:**
- `packages/ui/src/components/ui/` if it's a ShadCN-style primitive (add via `bun run ui` → `shadcn add`), `packages/ui/src/components/magicui/` if it's a visual-effect component.

## Special Directories

**`packages/api/src/db/drizzle/`:**
- Purpose: Drizzle-Kit generated migration SQL + `meta/` snapshots.
- Generated: Yes (via `bun run generate` / `drizzle-kit generate`).
- Committed: Yes - do not hand-edit generated SQL files; change the table definitions in `db/tables/` and regenerate.

**`packages/ui/src/pages/dashboard/`:**
- Purpose: none - contains an unrelated, unused "Multicloud Orchestrator" scaffold component (`index.tsx`) with mock VM-management UI, not imported anywhere in the codebase.
- Generated: No (looks like leftover ShadCN/v0 scaffolding).
- Committed: Yes, but should be treated as dead code - do not build on it, consider deleting.

**`packages/api/src/db/tables/auth.ts`:**
- Purpose: better-auth-managed tables (`user`, `session`, `account`, etc.) - schema shape is largely dictated by the better-auth library, not hand-designed.
- Generated: Partially (better-auth's CLI can regenerate parts of this).
- Committed: Yes.

**`apps/next/.next/`, `.turbo/`, `*/node_modules/`, `packages/api/.wrangler/`:**
- Purpose: build/dev caches and Wrangler local state.
- Generated: Yes.
- Committed: No (gitignored).

---

*Structure analysis: 2026-09-22*
