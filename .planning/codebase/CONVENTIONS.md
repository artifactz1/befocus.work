# Coding Conventions

**Analysis Date:** 2026-09-22

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (`apps/next/src/components/timer/Timer.tsx`, `apps/next/src/components/settings/SessionSettings.tsx`).
- Hooks: `useX.ts`/`useX.tsx`, camelCase after `use` (`apps/next/src/hooks/useTimer.ts`, `apps/next/src/hooks/useSounds.ts`, `apps/next/src/hooks/useCommandMenuHooks.tsx`).
- Zustand stores: `useXStore.tsx` in `apps/next/src/store/` (`useTimerStore.tsx`, `useSoundsStore.tsx`, `useToDoStore.tsx`).
- Server actions: camelCase matching the exported function, one file per action in `apps/next/src/lib/server/` (`getUserSettings.ts`).
- Drizzle table files: lowercase, plural domain noun in `packages/api/src/db/tables/` (`tasks.ts`, `sounds.ts`, `settings.ts`, `auth.ts`).
- API route triples: `<domain>.route.ts`, `<domain>.handler.ts`, `<domain>.index.ts` colocated in `packages/api/src/routes/<domain>/` (see `packages/api/src/routes/user/`).
- ShadCN UI primitives: lowercase-hyphenated matching the Radix/shadcn convention in `packages/ui/src/components/ui/` (`button.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`).
- **Known inconsistency:** `apps/next/src/hooks/useSession.ts` actually contains the `useUserSettings`/`useCreateUserSettings`/`useUpdateUserSettings`/`useSaveUserSettings` hooks (file header comment even says `// hooks/useUserSettings.ts`) - filename does not match contents. Do not assume filename reflects exported hook name in this directory; grep exports before reusing.

**Functions/Variables:**
- camelCase throughout (`hydrateFromSettings`, `skipToNextSession`, `initializeDrizzleNeonDB`).
- Boolean state flags prefixed `is`/`has` (`isRunning`, `isWorking`, `isAlarmOn`, `isHydrated`).

**Types:**
- PascalCase interfaces/types, often suffixed `State`, `Store`, `Route`, `Schema` (`TimerState`, `TodoStore`, `GetUserRoute`, `getUserSettingsSchema`).
- Drizzle-inferred row types via `InferSelectModel<typeof table>`, named after the singular entity (`export type Task = InferSelectModel<typeof tasks>` in `packages/api/src/db/tables/tasks.ts`).

## Code Style

**Formatting:**
- Biome is the only formatter/linter (`biome.json` at repo root). No ESLint, no Prettier config for JS/TS - do not add either.
- Settings: single quotes (`quoteStyle: single`, `jsxQuoteStyle: single`), no semicolons (`semicolons: asNeeded`), 100-column line width, 2-space indent, trailing commas everywhere (`trailingCommas: all`), no parens around single arrow-function params (`arrowParentheses: asNeeded`).
- `noExplicitAny` and `noEmptyInterface` are explicitly turned off in `biome.json` - `any` is used pragmatically in places (e.g. `onSuccessCallback?: (newSound: any) => void` in `apps/next/src/hooks/useSounds.ts`); don't treat `any` as forbidden, but prefer real types where the shape is already known (drizzle-zod inferred types, `AppRouteHandler<...>`).
- `noUnusedVariables` is `warn`, not `error` - unused vars will not fail CI/lint as hard errors today.

**Linting:**
- Biome recommended rule set plus the overrides above. Run via `bun run turbo:lint` (turbo-orchestrated per-package `lint` scripts) or `bun run check` (format:check + lint + fix:check/organize-imports).
- **Current state (verified 2026-09-22): `bun run check` and `bun run turbo:lint` both fail immediately**, not on code issues but on `biome.json` itself. The installed Biome binary resolves to v2.4.13 (a transitive devDependency of `wrangler`'s `miniflare`/`sharp` chain, `packages/api/node_modules/wrangler/node_modules/miniflare/node_modules/sharp` pins `@biomejs/biome ^2.3.4`) even though the root `package.json` pins `@biomejs/biome ^1.9.4` and `node_modules/@biomejs/biome` itself is 1.9.4. Biome v2 rejects the v1-schema keys still in `biome.json` (`files.ignore`, top-level `organizeImports`) with "Found an unknown key". `bun run turbo:build` and `bun x @biomejs/biome --version` both work; only lint/format/check are blocked until `biome.json` is migrated to the v2 schema (`biome migrate`) or the stray v2 binary is removed from resolution.
- Do not rely on `bun run check` passing as a merge gate right now - it will fail for reasons unrelated to any change you make. If you touch `biome.json`, prefer running `bun x biome migrate` once, as a standalone fix, over letting it silently ride along with an unrelated feature diff.

## Import Organization

**Order:**
1. External packages (`react`, `zustand`, `@tanstack/react-query`, `@hono/zod-openapi`).
2. Workspace packages via path aliases (`@repo/api/...`, `@repo/ui/...`, `@repo/types/...`, `@repo/app/...`).
3. Relative imports (`./user.route`, `../../db/tables/sounds`).
- Biome's `organizeImports` assist is enabled (`biome.json` → `organizeImports.enabled: true`, though currently rejected under v2 schema - see above) and is expected to auto-sort/group imports; don't hand-tune import order beyond what Biome produces.

**Path Aliases:**
- `apps/next`: `~/*` → `src/*`, `@repo/api/*` → `packages/api/src/*`, `@repo/ui/*` → `packages/ui/src/components/ui/*`, `@repo/types/*` → `packages/types/*` (see root `CLAUDE.md` and `apps/next/tsconfig.json`).
- `packages/api`: internal imports use `@repo/api/...` aliases (`@repo/api/lib/http-status-codes`, `@repo/api/types/app-context`) even within the same package - prefer the alias over long relative paths for cross-directory imports, though some handler files still use relative (`'./../../db/tables/settings'`) - alias is the cleaner, more common pattern to follow for new code.

## Error Handling

**API (`packages/api`):**
- Route handlers return typed JSON error bodies directly rather than throwing, for expected "not found" cases:
  ```ts
  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }
  ```
  (`packages/api/src/routes/user/user.handler.ts`)
- Unexpected/thrown errors are centralized in `packages/api/src/lib/middlewares/on-error.ts`: a custom `ApiError` class (`statusCode`, `isOperational`), an `errorConverter` that normalizes `ZodError`, JSON parse `SyntaxError`, and unknown errors into `ApiError`, reporting 5xx errors to Sentry via `Toucan` (`sentry.captureException`). The final `onError` handler strips the stack trace in production (`env === 'production' ? undefined : err.stack`).
- Follow this pattern for new routes: return `c.json({ message: ... }, HttpStatusCodes.X)` for expected control flow, let unexpected exceptions propagate to `onError` rather than wrapping every handler body in try/catch.
- Error message strings are inconsistent in a couple of spots - some use `HttpStatusPhrases.NOT_FOUND`, others hardcode `'User or session not found'` / `'Settings not found'` (`user.handler.ts`). Prefer `HttpStatusPhrases` constants for new code.

**Frontend (`apps/next`):**
- TanStack Query mutations follow a consistent `onError`/`onSuccess` shape using `sonner` toasts:
  ```ts
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['userSettings'] })
    toast('Session Settings updated successfully', { description: '...' })
  },
  onError: (error) => {
    toast.error('Failed to update settings')
    console.error('Error updating settings:', error)
  },
  ```
  (`apps/next/src/hooks/useSession.ts`, mirrored in `useSounds.ts`, `useTasks.ts`, `useTimer.ts`)
- `mutationFn`s manually check `response.ok` and `throw new Error('Failed to ...')` before parsing JSON - the typed `hono/client` (`~/lib/api.client.ts`) does not auto-throw on non-2xx.
- Server actions (`apps/next/src/lib/server/*.ts`) return `null` on failure rather than throwing, logging via `console.error` (`getUserSettings.ts`): `if (!cookieHeader) return null`. Callers must null-check.

## Logging

**Framework:** No structured logger wired into the app paths in active use. `pino`/`hono-pino` are installed dependencies but the Pino middleware is commented out in `packages/api/src/lib/create-app.ts` (`// app.use(pinoLogger())` with a TODO linking a Notion ticket). Sentry (`toucan-js`) captures 5xx exceptions from `on-error.ts` but there is no general app logger.

**Patterns:**
- `console.error` is the de facto logging mechanism today (36+ call sites across `apps/next/src` and `packages/api/src`), almost always paired with a user-facing toast on the frontend or a JSON error response on the API. Follow this pattern for now rather than introducing a new logging library - if you re-enable Pino, do it as a deliberate, scoped change (uncomment + wire `c.var` typing), not incidentally inside an unrelated feature.

## Comments

**When to Comment:**
- Sparse, mostly explaining *why* a check exists (`// let DB handle the timestamp`, `// Resetting isAlarmOn to false`) or marking known TODOs with a tracking link (`// TODO: https://www.notion.so/...` in `create-app.ts`).
- A few stray commented-out code blocks are left in place rather than deleted (`useTimerStore.tsx` has commented alternate values like `// workDuration: 10`) - don't treat commented-out code as intentional documentation; clean it up if you're already editing that block, but don't go out of your way to remove unrelated ones.

**JSDoc/TSDoc:** Not used. Types are expressed via TypeScript signatures and Zod schemas, not doc comments.

## Function Design

**Size:** Small, single-purpose functions per store action / per route handler / per query hook. Route handlers stay under ~30 lines by delegating validation to Zod schemas at the route layer.

**Parameters:** Destructured object params for anything with 2+ related fields, e.g. `useSound({ name, url, type, onSuccessCallback })` (`apps/next/src/hooks/useSounds.ts`). Zustand actions take positional primitives when there's a single value (`toggleTask: (id: number) => void`).

**Return Values:** API handlers always return `c.json(data, HttpStatusCodes.X)` - never a bare object. Query hooks return the full `useQuery`/`useMutation` result (not unwrapped data) so callers get `.isLoading`/`.isError` etc.

## Module Design

**Exports:** Named exports throughout - no default exports for stores, hooks, route defs, or table schemas. The router files (`*.index.ts`) are the one place using `export default router` (`packages/api/src/routes/user/user.index.ts`), matching how `packages/api/src/app.ts` composes routers.

**Barrel Files:** `packages/api/src/db/schemas.ts` re-exports every table file's Zod/Drizzle schemas as a single barrel that `drizzle.config.ts` and route files import from (`import { getTaskSchema, ... } from '@repo/api/db/schemas'`). New tables must be added to this barrel to be usable from routes. No other widespread barrel-file usage - components and hooks are imported directly by path, not through an `index.ts` re-export.

## Commit Message Conventions

Based on `git log` history (`git log --oneline -30`, `git log -10 --format=...`):

- **Common format:** `type(scope): summary` - e.g. `fix(web): bump Next.js to 15.1.9 to patch react2shell RCE (CVE-2025-66478)`, `fix(auth): correct env key and gate prod cookie flags so dev OAuth works`, `docs(spec): add dashboard customization design`. Types observed: `fix`, `docs`, `update`, `create`, `clean-up`, `code-clean-up`, `debugging`, `add`. Not a strictly enforced convention (no commitlint/husky hook found) - `docs: minor README phrasing tweak` (no scope) and `inital setup / added some fade animation on initial load and in guest page` (free-form) both appear in the same history. Prefer `type(scope): summary` for new commits since it's the more common and more useful pattern, but don't invent a scope that doesn't map to a real package/area.
- **Body:** Multi-paragraph explanatory bodies are used for non-trivial fixes, written in prose explaining *why*, not just *what* (see `ed6c945 fix(web): eliminate post-login hydration mismatches` - three-bullet root-cause breakdown of independent SSR/CSR drift sources). Trivial commits (docs tweaks, one-line fixes) have no body.
- **Attribution trailers:** Several commits carry `Co-Authored-By: Claude Opus X.Y <noreply@anthropic.com>` and/or `Claude-Session: https://claude.ai/code/session_...` trailers when the commit was produced by an AI coding session. This repo's own `CLAUDE.md` does not mandate this - it comes from the calling agent's own attribution instructions, not a repo-level convention to replicate unconditionally.
- **PR merges:** `Merge pull request #NNN from artifactz1/<branch-name>` - standard GitHub merge commit format, branch names are free-form kebab/camel-ish (`upddate-sign-in`, `fix/hydration-error-command-menu`).

## Reusable Patterns for New Features (with file paths)

**Zustand store** (`apps/next/src/store/*`):
- One `interface XState`/`XStore` with state fields + action methods inline, `export const useXStore = create<XState>((set, get) => ({ ... }))`. Actions mutate via `set(state => ({ ... }))` (functional updater) when depending on prior state, or `set({ ... })` for direct replacement. See `apps/next/src/store/useTimerStore.tsx` and `apps/next/src/store/useToDoStore.tsx`.

**Drizzle table + drizzle-zod schema** (`packages/api/src/db/tables/*`):
- One file per table: `pgTable(...)` definition, an `InferSelectModel` type export, then `createSelectSchema`/`createInsertSchema`/`createUpdateSchema` from `drizzle-zod`, each `.omit()`-ing server-managed fields (`id`, `createdAt`, `userId`). See `packages/api/src/db/tables/tasks.ts`. Re-export the new schemas from `packages/api/src/db/schemas.ts`.

**OpenAPI route/handler/index split** (`packages/api/src/routes/<domain>/*`):
- `<domain>.route.ts`: `createRoute({ path, method, tags, request?, responses })` per endpoint using `jsonContent(schema, description)` from `@repo/api/lib/openapi/helpers/json-content` and `HttpStatusCodes`/`notFoundSchema` constants.
- `<domain>.handler.ts`: `export const x: AppRouteHandler<XRoute> = async c => { ... }`, pulling `c.get('db')`, `c.get('user')`, `c.get('session')` and returning `c.json(...)`.
- `<domain>.index.ts`: `createRouter().openapi(routes.x, handlers.x)...` chain, `export default router`; then add the router to the `routes` array in `packages/api/src/app.ts` so it appears in the typed `AppType` consumed by `apps/next/src/lib/api.client.ts`.

**TanStack Query data hooks** (`apps/next/src/hooks/use*.ts`):
- Separate `useX` (query), `useCreateX`/`useUpdateX` (mutations) exports per resource, all calling the typed `api` client from `~/lib/api.client.ts`. Mutations invalidate the related `queryKey` in `onSuccess` and toast via `sonner` in both `onSuccess`/`onError`. See `apps/next/src/hooks/useTasks.ts`, `useSounds.ts`.

**Server actions** (`apps/next/src/lib/server/*`):
- `'use server'` directive at top of file, one exported async function per file, reads the `better-auth.session_token` cookie via `next/headers` `cookies()`, calls the API with `betterFetch` from `@better-fetch/fetch` forwarding the cookie header, returns `null` on any failure path with a `console.error`. See `apps/next/src/lib/server/getUserSettings.ts`. Consumed by async Server Components (e.g. `app/(app)/layout.tsx`) that hydrate a Zustand store client-side - do not fetch this data client-side on mount for anything persisted server-side.

**ShadCN component conventions** (`packages/ui/src/components/ui/*`):
- Copied-in shadcn primitives, not an npm dependency - edited in place per project needs (see the commented-out `outline` variant left next to its replacement in `button.tsx`). Pattern: `cva(...)` for variants, `React.forwardRef` wrapping the Radix primitive, `Comp.displayName = 'Name'`, exporting both the component and its `xVariants` cva function. Class merging always via `cn()` from `@repo/ui/lib/utils`. To add a new primitive, run `bun run ui` (aliases to `bunx shadcn@latest` in `packages/ui`) rather than hand-writing one from scratch.

---

*Convention analysis: 2026-09-22*
