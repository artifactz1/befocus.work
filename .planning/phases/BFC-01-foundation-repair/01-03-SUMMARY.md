---
phase: 01-foundation-repair
plan: 03
subsystem: ui
tags: [nextjs, zustand, tanstack-query, ssr, hydration, better-auth]

# Dependency graph
requires:
  - phase: 01-foundation-repair (01-01)
    provides: getUserSettings.ts raw Cookie header forwarding fix (secure-cookie support)
  - phase: 01-foundation-repair (01-02)
    provides: single-sourced Tailwind 3 / design tokens
provides:
  - Per-request Zustand timer store (TimerStoreProvider + useTimerStore) seeded synchronously at render, no post-mount flash
  - Single hydration owner in `(app)/layout.tsx`: one server-side settings read, seeded into TanStack Query via HydrationBoundary/dehydrate
  - Per-request QueryClient in AppProviders (no cross-request/cross-user cache leakage)
  - Robust save flow: useSaveUserSettings tries PUT then falls back to POST on 404
affects: [any future plan touching apps/next/src/store, apps/next/src/hooks/useSession.ts, or the (app)/guest layouts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-request Zustand store via zustand/vanilla createStore + React Context, instantiated with useState(() => createTimerStore(...)) inside a Provider - avoids SSR/CSR drift from a module-singleton store"
    - "Per-request TanStack Query cache seeding: server layout does queryClient.setQueryData(['key'], data) then wraps children in <HydrationBoundary state={dehydrate(queryClient)}>, replacing client-side useEffect fetch-on-mount"
    - "Per-request QueryClient via useState(() => new QueryClient()) instead of a module-level singleton, to prevent cross-request cache leakage on a shared Worker/Node process"
    - "PUT-then-POST-on-404 fallback for upsert-shaped save mutations, instead of branching on a query cache's existence state (which is ambiguous between 'no row' and 'seeded null')"

key-files:
  created: []
  modified:
    - apps/next/src/store/useTimerStore.tsx
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/app/guest/layout.tsx
    - apps/next/src/app/(app)/page.tsx
    - apps/next/src/provider/AppProviders.tsx
    - apps/next/src/hooks/useSession.ts

key-decisions:
  - "Combined Task 1 (per-request timer store) and Task 2 (single hydration owner) into a single commit - Task 1's own file changes remove isHydrated/hydrateFromSettings from TimerState, which TimerInitializer.tsx and useTimer.ts (deleted only in Task 2) still referenced; committing Task 1 alone would leave an intermediate state that fails tsc. The plan explicitly permits combining these two tasks."
  - "useSaveUserSettings now tries PUT first and falls back to POST only on 404, instead of using useUserSettings()'s cached data to decide create-vs-update, since a HydrationBoundary-seeded cache can be null for two different reasons (no row vs. fetch failure) that a naive branch cannot distinguish (D-08)."

patterns-established:
  - "Server Component layouts are the single point that reads per-user server state and seeds both a Zustand provider's initial state and a TanStack Query cache; no client component should fetch that same data on mount."

requirements-completed: [FND-05, FND-01]

# Metrics
duration: ~16min
completed: 2026-09-25
---

# Phase 01 Plan 03: Single Flash-Free Settings Hydration Path Summary

**Rebuilt the dashboard's timer-settings hydration as a single server-owned read: per-request Zustand store seeded at render (D-07) plus a HydrationBoundary-seeded TanStack Query cache (D-06), replacing the old DashboardShell/TimerInitializer client-fetch-and-flash path, with a PUT-then-POST-on-404 save fallback (D-08).**

## Performance

- **Duration:** ~16 min (tool-time; excludes read-only planning/context-loading time before Task 1's baseline capture)
- **Tasks:** 3 (2 implementation, 1 verification-only)
- **Files modified:** 6 modified, 3 deleted (9 total)

## Accomplishments

- Zero-flash first paint: SSR now renders the signed-in user's real timer values (verified with a 47 min / 7 min / 3-session test account) instead of the public 25 min default, on both plain-http and secure-cookie (`__Secure-` prefix) https dev stacks.
- Exactly one settings read per page load: the server layout is now the sole caller of `getUserSettings()`; the browser makes zero `/user/settings` requests on load or on refocus (proven via agent-browser network capture and wrangler server logs on both stacks).
- Deleted three files that duplicated or raced the server-fetched value: `DashboardShell.tsx`, `TimerInitializer.tsx`, `useTimer.ts` (dead code, zero importers).
- `AppProviders`'s `QueryClient` is now created per-request (`useState`), closing the T-01-07 cross-request cache-leakage threat the plan flagged.
- `useSaveUserSettings` no longer depends on `useUserSettings()`'s cache state to decide create-vs-update; it tries PUT and falls back to POST on 404, verified end-to-end for both a no-row and an existing-row account.

## Task Commits

1. **Task 1 + Task 2 (combined): per-request timer store + single hydration owner** - `8a6c45c` (fix)
2. **Task 3: E2E proof (verification-only, no file changes)** - no commit (plan's `<files>` for this task is `(none - verification only)`)

**Plan metadata:** committed separately after this SUMMARY (see below).

## Files Created/Modified

- `apps/next/src/store/useTimerStore.tsx` - Rewritten from a module-singleton `create()` store to `createTimerStore()` (zustand/vanilla) + `TimerStoreProvider` (React Context) + `useTimerStore()` hook. Public call-site API (`useTimerStore()` / `useTimerStore(selector)`) unchanged across all 12 existing call sites.
- `apps/next/src/app/(app)/layout.tsx` - Now the single hydration owner: awaits `getUserSettings()` once, seeds a fresh per-request `QueryClient` via `setQueryData(['userSettings'], settings)`, wraps children in `HydrationBoundary` + `TimerStoreProvider`. Removed the old debug `console.log` and `DashboardShell` wrapper.
- `apps/next/src/app/guest/layout.tsx` - Wraps children in `TimerStoreProvider` with `initialSettings={null}` (defaults) since guest has no signed-in user.
- `apps/next/src/app/(app)/page.tsx` - Removed the now-deleted `<TimerInitializer />` and its import.
- `apps/next/src/provider/AppProviders.tsx` - `QueryClient` moved from module scope into `useState(() => new QueryClient())`; removed unused `ThemeProvider` import.
- `apps/next/src/hooks/useSession.ts` - `useUserSettings` gained `staleTime: Number.POSITIVE_INFINITY` (cache is always server-seeded, never silently refetch). `useSaveUserSettings` rewritten to try PUT then fall back to POST on 404.
- `apps/next/src/hooks/DashboardShell.tsx` - Deleted (superseded by the server layout doing hydration directly).
- `apps/next/src/components/timer/TimerInitializer.tsx` - Deleted (duplicate client-side settings fetch, source of the flash).
- `apps/next/src/hooks/useTimer.ts` - Deleted (dead code, zero importers, referenced the removed `hydrateFromSettings`/`isHydrated` fields).

## Decisions Made

- Combined Task 1 and Task 2 into one commit (see `key-decisions` in frontmatter) - Task 1 in isolation would fail its own `tsc --noEmit` verify step because file deletions required to remove the last references to `isHydrated`/`hydrateFromSettings` belong to Task 2. The plan text explicitly allows committing them together.
- `useSaveUserSettings` uses a PUT-then-POST-on-404 fallback rather than branching on `useUserSettings()`'s cached value, per D-08 and the plan's explicit guidance - the cache can be `null` either because there is no row or because the seed itself came back null, and only the server's 404 response can disambiguate that for certain.

## Deviations from Plan

None - plan executed as written. (The Task 1+2 commit combination above is a sequencing decision explicitly permitted by the plan text, not a deviation from it; no Rule 1-4 auto-fixes were needed this session - `tsc --noEmit`, all grep-based task verify scripts, and `bun run --cwd apps/next build` all passed clean on the first attempt.)

## Issues Encountered

None beyond the pre-existing local-https-dev-environment workarounds already documented in `01-01-SUMMARY.md` (self-signed cert via openssl instead of `next dev --experimental-https`'s mkcert auto-install, and `--compatibility-flags nodejs_compat` on `wrangler dev` for sign-up to work locally) - both were reapplied here per that recipe, not newly discovered.

## Task 1 Baseline (recorded before the fix)

Reproduced with a signed-in test account whose real settings are `workDuration: 2820s (47 min)`, `breakDuration: 420s (7 min)`, `numberOfSessions: 3`:
- `curl -b <jar> http://localhost:3000/` SSR markup showed the public default `25:00`, not `47:00`.
- The browser made a client-side `GET /user/settings` request after mount (via the now-deleted `TimerInitializer`), which then updated the DOM from `25:00` to `47:00` - a visible flash.
- Artifacts: `/tmp/dashboard-before.html` (SSR before), `/tmp/dashboard-browser-before.html` (post-hydration DOM), `/tmp/baseline-before.har` (network trace).

## Task 3 E2E Results

**Test accounts used (both throwaway `@example.test` addresses in the local dev DB, not real users):**
- `fnd01-repro-1790325885@example.test` - existing-row user (created in plan 01-01), settings `{workDuration: 2820, breakDuration: 420, numberOfSessions: 3}` at the start of this plan; changed to `{workDuration: 2520 (42 min), ...}` during the existing-row save test.
- `fnd01-norow-1790329787@example.test` - fresh no-row user created for this plan's D-08 test; no settings row until the save test created one with `{workDuration: 600 (10 min), breakDuration: 300, numberOfSessions: 6}`.
- `fnd01-repro2-1790330009@example.test` - fresh account created for the secure-cookie https-stack re-run of checks 1-2, settings seeded to the same `{2820, 420, 3}` distinctive values, cookie confirmed named `__Secure-better-auth.session_token`.

**Plain-http dev stack (`bun run api`, `bun run web`):**
1. First paint (D-07): SSR digit markers for the 47-min user read `4`, `7`, `0`, `0` (47:00) at both `curl` fetch and agent-browser screenshot at load and +5s - identical, no flash.
2. One read (D-06): agent-browser network log showed zero `/user/settings` requests at load and after a simulated refocus (`visibilitychange` + `focus` events); a fresh wrangler log segment isolated to a single page load showed exactly one `GET /user/settings 200 OK`.
3. Guest: `curl http://localhost:3000/guest` (no cookie) returned 200 with SSR digit markers `2`, `5`, `0`, `0` (25:00 default).
4. No-row user: dashboard loaded with defaults (`25:00`, 1/6 sessions), zero client `/user/settings` requests, no `getUserSettings failed` log line. Changing Work Duration and saving produced `PUT /user/settings 404` then `POST /user/settings 200` in the network log; reloading showed SSR `10:00` (matching the persisted `workDuration: 600`).
5. Existing-row user: changing Work Duration and saving produced `PUT /user/settings 200` (no POST); reloading showed SSR `42:00` (matching the persisted `workDuration: 2520`).
6. `bun run --cwd apps/next build` exited 0 (verified via explicit `echo "EXIT:$?"` after redirecting output).

**Secure-cookie https dev stack** (`wrangler dev --local-protocol https --var ENV:production --compatibility-flags nodejs_compat`, `next dev --experimental-https` with an openssl self-signed cert, agent-browser launched with `AGENT_BROWSER_IGNORE_HTTPS_ERRORS=true`), re-running checks 1-2 only per the plan:
1. First paint: `curl -sk -b <jar> https://localhost:3000/` SSR digit markers read `4`, `7`, `0`, `0` (47:00) - matches the plain-http result.
2. One read: agent-browser screenshots at load and +5s were pixel-identical (`47:00`, 1/3 sessions); zero client `/user/settings` requests at load or on refocus; a fresh wrangler-https log segment isolated to a single page load showed exactly one `GET /user/settings 200 OK`.

All dev servers (plain-http and https legs) were stopped at the end of execution; ports 3000 and 8787 confirmed free.

## User Setup Required

None - no external service configuration required.

## CLAUDE.md Staleness Note (for the user - not edited by this plan)

`CLAUDE.md`'s "Frontend state & hydration" section (lines 99-103) now describes a pattern this plan replaced:
- It says `app/(app)/layout.tsx` "passes the result into `DashboardShell`, a client component that calls `useTimerStore.hydrateFromSettings(...)` once." `DashboardShell.tsx` and `hydrateFromSettings` no longer exist - the layout now seeds `TimerStoreProvider`'s initial state directly and seeds TanStack Query via `HydrationBoundary`/`dehydrate`.
- It says TanStack Query is wired with "a single `QueryClient`" in `AppProviders.tsx`. That `QueryClient` is now created per-request via `useState`, not as a module-level singleton (T-01-07 mitigation).

Per this plan's instructions I did not edit `CLAUDE.md` myself. Recommend updating that section's two sentences to describe the new `TimerStoreProvider` + `HydrationBoundary` pattern the next time someone touches this doc.

## Next Phase Readiness

- FND-05 and FND-01 are fully proven locally on both the plain-http and secure-cookie https dev stacks, satisfying Roadmap success criteria 1-2.
- The per-request store/QueryClient patterns established here (`useState(() => createXStore(...))`, `HydrationBoundary` seeding) are now the reference pattern for any future persisted-user-state work (e.g. `useSoundsStore`, `useToDoStore`) - no changes were made to those stores in this plan; they remain module-singletons and are out of this plan's scope.
- No blockers for subsequent phases.

---
*Phase: 01-foundation-repair*
*Completed: 2026-09-25*

## Self-Check: PASSED

All modified/created files confirmed present on disk (`useTimerStore.tsx`, `(app)/layout.tsx`, `guest/layout.tsx`, `(app)/page.tsx`, `AppProviders.tsx`, `useSession.ts`, this SUMMARY.md). All three deleted files (`DashboardShell.tsx`, `TimerInitializer.tsx`, `useTimer.ts`) confirmed absent. Commit `8a6c45c` confirmed present in `git log --oneline --all`.
