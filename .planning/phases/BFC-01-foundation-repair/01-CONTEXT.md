# Phase 1: Foundation Repair - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

A signed-in user's saved timer settings reach the dashboard on the server render in production, from
exactly one hydration path, with no flash of defaults. The styling toolchain (Tailwind) and lint
toolchain (Biome) are single-sourced and `bun run check` / `bun run turbo:build` pass from a fresh
install. Requirements: FND-01..FND-05. No customization features in this phase.

</domain>

<decisions>
## Implementation Decisions

### Tailwind (FND-02, FND-03)
- **D-01:** Monorepo stays on Tailwind **v3.4**. Replace the bogus `tailwind@^4.0.0` in
  `apps/next/package.json` with `tailwindcss@^3.4` (version consistent with `packages/ui`, so
  `bun run check-deps` passes). No v4 migration in this milestone phase.
- **D-02:** Remove the v4-only `@theme inline` block from `packages/ui/src/globals.css`. The `shine`
  keyframes it wraps must keep working: move them into `tailwind.config.ts` `keyframes` (or plain
  CSS `@keyframes` outside any v4 at-rule). Verify whatever uses `shine` still animates.
- **D-03:** `--border`: keep the value that renders today. `<html>` is always `dark`, and the
  unlayered `.dark { --border: 0 0% 25% }` (globals.css ~:208) wins over the layered
  `12 6.5% 15.1%` (~:87). Keep `0 0% 25%` as the single dark value and delete the duplicate
  definitions. Same for the `:root` light value (single definition). Zero visual change is the goal.

### Biome (FND-04)
- **D-04:** Upgrade to **Biome 2** and run `biome migrate`. Retires the rejected v1 keys
  (`files.ignore`, top-level `organizeImports`). Root scripts (`format:check`, `lint`, `fix:check`)
  updated to Biome 2 CLI flags as needed. `bun.lock` must resolve the correct platform binary on
  macOS and Linux.
- **D-05:** Any new lint findings from Biome 2 are **fixed in this phase**, not disabled.
  `bun run check` must exit clean. Mechanical format / import-order churn goes in its own commit,
  separate from real code fixes and separate from feature diffs.

### Settings hydration (FND-01, FND-05)
- **D-06:** The server layout (`apps/next/src/app/(app)/layout.tsx` via `getUserSettings`) is the
  **single hydration owner**. Its result seeds both the TanStack `['userSettings']` query cache and
  the Zustand timer store once. Delete `TimerInitializer` and `useTimer`'s hydrate effect. Client
  queries on `['userSettings']` (`useTimer`, `useUserSettings`) read the seeded cache and must not
  refetch on mount. `saveSettings` keeps create-vs-update logic and post-save invalidation.
- **D-07:** Zero flash is required: the store must hold the user's values **during the server
  render**, not after a `useEffect`. Restructuring the timer store (e.g. per-request store via React
  context, or synchronous init from props) is approved. Planner picks the lightest mechanism that
  achieves it. Phase 2's customization store will copy this pattern, so it must be clean.
- **D-08:** Signed-in user with no settings row, or server fetch failure: render built-in defaults,
  no client fallback fetch. Failure is logged server-side. First save creates the row.
- **D-09:** Cookie fix: the shared server helper **forwards the incoming request's Cookie header
  as-is** to the API. No hardcoded cookie name, so both `better-auth.session_token` and
  `__Secure-better-auth.session_token` work. Early-return when there is no cookie at all is fine.
  This helper is the shared path Phases 3-6 will reuse.

### Verification
- **D-10:** Reproduce FND-01 **locally with secure cookies first** (`next dev --experimental-https`,
  API served so better-auth issues `__Secure-` cookies), confirm the bug, then prove the fix there.
- **D-11:** Final production check: the plan ends with a **human checkpoint**. The user deploys
  (Vercel web + `wrangler deploy` API); Claude does not run deploy commands. After deploy, verify
  signed in on `https://www.befocus.work`: own values on first paint, one settings request.
  Vercel preview URLs (`*.vercel.app`) cannot test this because auth cookies are scoped to
  `befocus.work`.

### Claude's Discretion
- Exact mechanism for zero-flash store init (D-07).
- How the query cache is seeded (`initialData`, `HydrationBoundary`/`dehydrate`, or
  `setQueryData`) and staleTime choice, as long as D-06 holds.
- Plan split / ordering across FND items (Biome upgrade as its own change per roadmap note).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope
- `.planning/ROADMAP.md` Phase 1 - goal, success criteria, planning notes per FND item
- `.planning/REQUIREMENTS.md` FND-01..FND-05
- `.planning/PROJECT.md` "Known issues this milestone must clear first", Constraints

### Codebase maps
- `.planning/codebase/ARCHITECTURE.md` - documents the DashboardShell / TimerInitializer
  duplicate-hydration anti-pattern
- `.planning/codebase/CONCERNS.md` - Tailwind, Biome, cookie issues
- `.planning/codebase/STACK.md` - versions, Biome/wrangler split installs
- `.planning/codebase/INTEGRATIONS.md` - deployment (Vercel web, Cloudflare Worker API)

### Background
- `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md` - reference only; not
  needed for Phase 1 beyond awareness that later phases build on the hydration pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Files in play
- `apps/next/src/lib/server/getUserSettings.ts` - hardcodes `better-auth.session_token` (FND-01)
- `apps/next/src/app/(app)/layout.tsx` - async server layout, calls `getUserSettings`, renders
  `DashboardShell`
- `apps/next/src/hooks/DashboardShell.tsx` - hydrates Zustand in `useEffect` (causes flash)
- `apps/next/src/components/timer/TimerInitializer.tsx` - duplicate client fetch + hydrate; used in
  `apps/next/src/app/(app)/page.tsx`. Delete.
- `apps/next/src/hooks/useTimer.ts` - own `['userSettings']` query + hydrate-once effect; save
  mutation depends on `data` for create vs update
- `apps/next/src/hooks/useSession.ts` - `useUserSettings` query + invalidations on same key
- `packages/ui/src/globals.css` - `@theme inline` (~:211), duplicate `--border` (:57, :87, :204,
  :208)
- `packages/ui/tailwind.config.ts` - shared config (re-exported by `apps/next/tailwind.config.ts`)
- `apps/next/package.json` - `"tailwind": "^4.0.0"` (wrong package)
- root `package.json` / `biome.json` - `@biomejs/biome ^1.9.4`, v1 schema

### Established Patterns
- Server-fetched-then-hydrate (CLAUDE.md): keep it, but make it single-path and flash-free.
- TanStack Query single `QueryClient` in `provider/AppProviders.tsx`.

### Integration Points
- Guest route `/guest` has no server settings: must keep rendering defaults unchanged.

</code_context>

<specifics>
## Specific Ideas

- Success = signed-in prod load shows own work/break/sessions on first paint, network tab shows
  exactly one settings read (the server one), values never change after paint.
- Repro-before-fix is mandatory (user's global rule).

</specifics>

<deferred>
## Deferred Ideas

- Tailwind v4 migration - possible future phase; not this milestone's foundation work.
- Wrangler 3 -> 4 bump (`git stash@{0}`) - not Phase 1; revisit in Phase 5 if R2 bindings need it.

</deferred>

---

*Phase: 01-foundation-repair*
*Context gathered: 2026-09-24*
