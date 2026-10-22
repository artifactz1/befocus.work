---
phase: BFC-09-tasks-and-time-blocks
plan: 10
subsystem: api
tags: [task-links, block-record, guest-storage]
requires: [09-09]
provides:
  - GET /user/task-links?blockId (getUserBlockTasks, typed client api.user['task-links'].$get)
  - GUEST_LINK_HISTORY_KEY, parseGuestLinkHistory, toGuestLinkHistory, appendGuestLinkHistory
affects: [09-11, phase-10]
key-files:
  modified:
    - packages/api/src/db/tables/plans.ts
    - packages/api/src/routes/plan/plan.route.ts
    - packages/api/src/routes/plan/plan.handler.ts
    - packages/api/src/routes/plan/plan.index.ts
    - apps/next/src/lib/tasks/tasks-storage.ts
    - apps/next/src/lib/tasks/tasks-storage.check.ts
    - apps/next/src/hooks/usePlan.ts
requirements-completed: [TSK-02]
completed: 2026-10-21
---

# Phase 9 Plan 10: Block record data path Summary

A block's worked and completed tasks are readable after the plan closes: signed in via an owner-scoped `GET /user/task-links?blockId=`, guests via `befocus.taskLinkHistory`, filled when the plan closes (newest 500 kept). No schema change, no migration.

## Seam map

Block record: Phase 8 records come from `toRecord(block)` in `lib/blocks/blocks.ts` using `block.id`, and 09-07 seeds the timer with the plan's block ids, so record ids equal plan block ids (09-07 "Block record ids:" line re-checked, unchanged). Guest copy is `befocus.blockRecords` (`lib/blocks/block-records.ts`).
Record view: none in Phase 8 found under `apps/next/src/components` (no component renders block records); Phase 10 owns it.
Guest storage: keys in use are `befocus.tasks`, `befocus.plan`, `befocus.blockRecords`, `befocus.blockQueue.<userId>`, `befocus.themes`, `befocus.activeThemeId`, `befocus.lookPaint`, `befocus.hiddenStarters`, `befocus.askBeforeStart`, `befocus.adjustHintSeen`, `befocus.guestIntroShown`; `befocus.taskLinkHistory` is free. No MISMATCH.

## Deviations from Plan

**1. [Minor] `appendGuestLinkHistory` returns the envelope object `{ version: 1, links }`** (the stored value, stringified by `writeStored`), and its `raw` argument is the object read by `readStored(..., guestLinkHistorySchema)`. History is kept oldest first, sorted by `completedAt ?? workedAt`.
**2. [Minor] Guest links reuse the existing `guestLinkSchema`** (taskId is a string id for guests), exported helpers `guestLinkHistorySchema` added for the read.
**3. [Coordinator rule] Browser and API checks not run** (need wrangler and env files): the signed-in live List-tab tick, cross-account call, 422 call, guest history after reset and corrupt-value reload. The Task 3 verify clause on saved JSON files was not run as written. Task 1 made no commit (no source changes).

## Verification

- `bun run src/lib/tasks/tasks-storage.check.ts` (cwd apps/next): `tasks-storage.check OK` (RED commit failed first, then passed)
- `bunx tsc --noEmit -p` for packages/api and apps/next: exit 0
- `bun run check`: exit 0
- Handler filters on both `taskBlockLinks.userId` and `tasks.userId` equal to `user.id`; chained in `plan.index.ts`.

## Pending human checks

Needs the dev API and a non-production DB:
- Signed in: plan, start, tick an unplanned task in the List tab during the live focus block; `GET /user/task-links?blockId=<current block id>` lists it with `completed: true`. Pick another as now, skip to break, reset: both still listed.
- Second account's cookie with the same blockId returns `{ tasks: [] }`; `blockId=abc` returns 422.
- Guest: run a block with a pick and a tick, reset, `localStorage['befocus.taskLinkHistory']` holds both links; set it to "garbage", reload: app loads with no error.

## Commits

- 9672c6b feat(BFC-09-10): GET /user/task-links block tasks, owner scoped
- 3763b6c test(BFC-09-10): add failing guest link history checks
- 0291626 feat(BFC-09-10): guest task link history appended when a plan closes

## Known Stubs

None. Nothing reads the history in Phase 9 by design; Phase 10 is the reader.

## Threat Flags

None beyond the plan's threat model (T-09-27 uuid query plus double user filter; T-09-29 zod envelope and per-link parse, cap 500, covered by the check).

## Self-Check: PASSED
