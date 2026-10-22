---
phase: BFC-09-tasks-and-time-blocks
plan: 02
subsystem: api
tags: [zod, drizzle, hono, plan]
requires: []
provides:
  - planBlocksSchema, taskPlanSchema, PLAN_LIMITS, TaskLink (packages/types/plan.ts)
  - pure plan module (seed, add, remove, nudge, deriveBlockTimes, copy helpers)
  - task_plans table and GET/PUT/DELETE /user/plan
affects: [09-05, 09-06, 09-07]
key-files:
  created:
    - packages/types/plan.ts
    - apps/next/src/lib/plan/plan.ts
    - apps/next/src/lib/plan/plan.check.ts
    - packages/api/src/db/tables/plans.ts
    - packages/api/src/routes/plan/plan.route.ts
    - packages/api/src/routes/plan/plan.handler.ts
    - packages/api/src/routes/plan/plan.index.ts
    - packages/api/src/db/drizzle/0013_task_plans.sql
    - packages/api/src/db/drizzle/meta/0013_snapshot.json
  modified:
    - packages/api/src/db/schemas.ts
    - packages/api/src/app.ts
    - packages/api/src/db/drizzle/meta/_journal.json
requirements-completed: [TSK-03]
completed: 2026-10-21
---

# Phase 9 Plan 02: Plan data layer Summary

Shared plan contracts, a pure plan module with a node:assert check, a one-row-per-user `task_plans` table and owner-scoped GET/PUT/DELETE `/user/plan` on the typed client.

## Seam map

Session id: `sessionId` on the timer store (`apps/next/src/store/useTimerStore.tsx`, part of `Run` from `lib/blocks/blocks`; `seedBlocks({ sessionId, blocks })` also takes one). It is `crypto.randomUUID()` (`newId`) created in `createTimerStore` via `createRun(newId(), ...)`, so a uuid exists before the first block starts. It is NOT persisted: a page reload before start creates a new store and a new id. 09-05 must treat a stored plan whose `sessionId` differs from the store's as adoptable when `wentLive` is false. Same behaviour as the plan's assumption, no mismatch.

## Deviations from Plan

**1. [Coordinator rule] Task 3 (db:push, route smoke test) not run.** Sequential-executor rules forbid applying migrations, running wrangler and reading `.dev.vars`. Instead I wrote the migration `0013_task_plans.sql`, its snapshot and the journal entry (the repo tracks generated migrations, precedent `0012_focus_blocks`).

**2. [Rule 3] Migration hand-written, not generated.** `drizzle-kit generate` fails in this checkout (`esbuild` host 0.19.12 vs binary 0.28.1 mismatch, drizzle-kit's nested esbuild has no platform binary). The snapshot is the 0012 snapshot plus the `task_plans` table with a new id/prevId, mirroring the `focus_blocks` entry format. Worth regenerating with `drizzle-kit generate` once the toolchain works to confirm no diff.

**3. [Rename] routes array.** Plan expected `[index, user]`; code has `[index, user, themes, blocks]`. Added `plan` to the end: `[index, user, themes, blocks, plan]`. The plan's `grep "\[index, user, plan\]"` check therefore does not match literally.

**4. [Rule 1] Handler guards.** The upsert `.returning()` row is checked (`noUncheckedIndexedAccess` in the next tsconfig, which type checks the api via the path alias). Unauthenticated requests return 401 explicitly although `requireAuth` already gates the route.

## Verification

- `bun run src/lib/plan/plan.check.ts` (cwd apps/next): `plan.check OK`
- `bunx tsc --noEmit` for apps/next and packages/api: exit 0
- `bun run check`: exit 0 (existing warnings only; none in new files)
- One-off: `putPlanSchema` strips an injected `userId`, and rejects a plan with a leading break.
- Handler ownership: `grep -c "taskPlans.userId, user.id" plan.handler.ts` = 2 (GET, DELETE); PUT keys the upsert on `userId: user.id` (conflict target `taskPlans.userId`, value from session), never from the body.

## Pending human checks

- Confirm `DATABASE_URL` is non-production, then apply `0013_task_plans.sql` (or `bun run db:push`) to the dev database.
- With `bun run api` and a signed-in cookie: PUT seeded plan 200, GET same blocks with `links: []`, PUT plan with leading break 422, DELETE 204, GET `plan: null`. Also check a second user cannot read or delete the first user's plan.

## Commits

- 043a3ab feat(BFC-09-02): plan contracts, pure plan module and /user/plan routes

## Known Stubs

`linkResponseSchema` and `links: []` are intentional until 09-06 adds the link table.

## Self-Check: PASSED
