---
phase: BFC-09-tasks-and-time-blocks
plan: 04
subsystem: ui
tags: [guest-storage, hydration, tasks, zod]
requires: [09-03]
provides:
  - GUEST_TASKS_KEY, guestTasksSchema, parseGuestTasks, toGuestTasks
  - getUserTasks server helper
affects: [09-05, 09-07]
key-files:
  created:
    - apps/next/src/lib/tasks/tasks-storage.ts
    - apps/next/src/lib/tasks/tasks-storage.check.ts
    - apps/next/src/lib/server/getUserTasks.ts
  modified:
    - apps/next/src/store/useToDoStore.tsx
    - apps/next/src/hooks/useTasks.ts
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/tasks.module.css
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/app/(app)/page.tsx
    - packages/api/src/db/tables/tasks.ts
    - packages/api/src/routes/user/user.handler.ts
  deleted: [apps/next/src/components/helper/PrefetchUserTasks.tsx]
requirements-completed: [TSK-01]
completed: 2026-10-21
---

# Phase 9 Plan 04: Durable task list Summary

Guest tasks persist through Phase 3's `browser-storage` helper with an item-by-item validated read; signed-in tasks arrive in the `(app)/layout.tsx` server render; task routes enforce text bounds and owner-scoped delete.

## Seam map

Guest storage: apps/next/src/lib/storage/browser-storage.ts: `readStored<T>(key, schema: ZodType<T>, storage?) => T | null`, `writeStored(key, value, storage?) => boolean` (false when unavailable), `defaultStorage() => Storage | undefined`. Matches the assumed shape; used with `guestTasksSchema` (envelope only) then `parseGuestTasks` for items.
Hydration owner: apps/next/src/app/(app)/layout.tsx: async server layout awaits `getUserSettings()` (now alongside `getUserTasks()`) and passes results as initial props to `TimerStoreProvider`, `CustomizeStoreProvider` and `TasksStoreProvider`. Guest: `app/guest/GuestShell.tsx` (not `layout.tsx`, rename only). No mismatch.

## Deviations from Plan

**1. [Rename] Guest providers** live in GuestShell.tsx; no change needed there (guest persistence runs inside `TasksStoreProvider`).

**2. [Already done in 09-03] Guest footnote** with `Sign in` link was already in ListTab; not re-added.

**3. [Rule 2] Empty state hidden while load error shows** so "No tasks yet" does not appear beside "Couldn't load your tasks."

**4. [Coordinator rule] Browser checks and curl 422 check not run** (need wrangler, env files). See pending human checks. No screenshots.

**5. Notes.** Route-level zod validation (defaultHook) rejects bad text before the handler; the handler's own 400 branch is now unreachable for text. `loadState` error is derived in `createTasksStore` (account mode with null tasks). Update schema trims text but keeps it optional.

## Verification

- `bun run src/lib/tasks/tasks-storage.check.ts` (cwd apps/next): `tasks-storage.check OK`
- `bunx tsc --noEmit` for apps/next and packages/api: exit 0
- `bun run check`: exit 0
- `befocus.tasks` appears only in tasks-storage.ts; PrefetchUserTasks has no references; delete statement includes `eq(tasks.userId, user.id)`.

## Pending human checks

- Guest at /guest: add "Repro A", "Repro B", tick B, reload: both present, B done. Set `befocus.tasks` to `{"version":1,"tasks":[{"id":"x"}]}` and reload: no crash, empty list. Block storage: toast appears once.
- Signed in (non-production DB): no client GET /user/tasks on load, list filled on first paint; break the API to see "Couldn't load your tasks." and that "Try again" repopulates.
- `POST /user/tasks` with `{"text":"   "}` returns 422; text of 501 chars returns 422; deleting another user's task id returns 404.
- Screenshots `09-04-guest-after-refresh.png`, `09-04-account-first-paint.png` not captured.

## Commits

- b72b797 feat(BFC-09-04): guest tasks persist with a validated read
- 31ece8d feat(BFC-09-04): signed-in tasks in the server render, load error, task route hardening

## Known Stubs

None.

## Self-Check: PASSED
