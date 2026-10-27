---
phase: BFC-10-session-logs-and-reflection
plan: 01
subsystem: data-contract
tags: [types, drizzle, migration]
requires: []
provides: [block log, session note, History types, block_logs, session_notes, tasks.later, migration 0015]
affects: [10-03, 10-04, 10-05, 10-06, 10-07]
key-files:
  created:
    - packages/types/logs.ts
    - packages/api/src/db/tables/logs.ts
    - packages/api/src/db/drizzle/0015_session_logs.sql
    - packages/api/src/db/drizzle/meta/0015_snapshot.json
  modified:
    - packages/types/tasks.ts
    - packages/api/src/db/tables/tasks.ts
    - packages/api/src/db/tables/focus-blocks.ts
    - packages/api/src/db/schemas.ts
    - packages/api/src/db/drizzle/meta/_journal.json
requirements-completed: [LOG-02, LOG-06, LOG-07]
completed: 2026-10-21
---

# Phase BFC-10 Plan 01: Shared log contract and migration 0015 Summary

Zod contract for block logs, session notes and history, owner-scoped `block_logs` / `session_notes` tables, `tasks.later` / `later_at`, and a hand-written (unapplied) migration 0015 with a `(user_id, started_at)` history index.

## Seam map

Block record: packages/types/blocks.ts `BlockRecord` / `blockRecordSchema`; packages/api/src/db/tables/focus-blocks.ts `focusBlocks.id` is `uuid('id').primaryKey()` with no default (client uuid).
Session id: `BlockRecord.sessionId` (uuid); timer store `fresh()` in apps/next/src/store/useTimerStore.tsx issues `sessionId: newId()`.
Plan and links: packages/api/src/db/tables/plans.ts `taskPlans`, `taskBlockLinks`; `deleteUserPlan` in packages/api/src/routes/plan/plan.handler.ts (line 116) deletes only `taskPlans`, links are kept; `closePlan` / `usePlanSync` / `writeCompletion` in apps/next/src/hooks/usePlan.ts.
Tasks: packages/types/tasks.ts `Task` (no later flag), packages/api/src/db/tables/tasks.ts `tasks`.
End of session: apps/next/src/components/SessionCompleteModal.tsx; `isFinished` in apps/next/src/lib/session/session.ts:28; the finished state is `{ ...createRun(f.sessionId, f.seed), completed: true }` (apps/next/src/lib/blocks/blocks.ts:291) with the new `sessionId` from `fresh()`, applied via one `commit` set.
Break start: Phase 8 explicit block end in the timer store (`commit`, `startNext`) and `useEndedCues.ts`.
Preferences: packages/types/look.ts `lookSchema` holds `sessionProgress` (line 43).
Routing: apps/next/src/middleware.ts (`authRoutes`, `/guest` redirect logic).
Migration head: 0014_task_block_links (idx 14, id 2422b1b2-67eb-47d6-872b-64cf37446166).

No MISMATCH found.

Manual step: captain applies migration 0015 (cd packages/api && bun run db:migrate) before any signed-in browser check in 10-06..10-12

## Commits

- ce17a24 feat(BFC-10-01): shared log types, logs tables, tasks later columns
- 51f38d8 feat(BFC-10-01): hand-written migration 0015 and history index

## Verification

- `bunx tsc --noEmit` passes in packages/api and apps/next (after task 2); api re-checked after task 3.
- Snapshot/journal assertion prints "snapshot OK"; `bun run check` passes.
- No test runner exists in the repo; schema cap checks are deferred to 10-04's summary.check per the plan.

## Deviations from Plan

None - plan executed exactly as written. Task 1 (seam map) has no source change; it is committed with this SUMMARY.

## Known Stubs

None.

## Self-Check: PASSED
