---
phase: BFC-09-tasks-and-time-blocks
plan: 06
subsystem: api, ui
tags: [drizzle, hono, zustand, drag-and-drop, plan]
requires: [09-02, 09-03, 09-05]
provides:
  - task_block_links table, PUT /user/task-links, links in GET /user/plan
  - planTask, plannedBlockNumber (pure), assignTask, whenTaskSaved
  - Assign panel checklist, add-to-block, native drag, B-chips
affects: [09-07, 09-08]
key-files:
  created:
    - packages/api/src/db/drizzle/0014_task_block_links.sql
    - packages/api/src/db/drizzle/meta/0014_snapshot.json
    - apps/next/src/lib/tasks/task-writes.ts
  modified:
    - packages/api/src/db/tables/plans.ts
    - packages/api/src/routes/plan/plan.route.ts
    - packages/api/src/routes/plan/plan.handler.ts
    - packages/api/src/routes/plan/plan.index.ts
    - packages/api/src/db/drizzle/meta/_journal.json
    - apps/next/src/lib/plan/plan.ts
    - apps/next/src/lib/plan/plan.check.ts
    - apps/next/src/hooks/usePlan.ts
    - apps/next/src/hooks/useTasks.ts
    - apps/next/src/store/useToDoStore.tsx
    - apps/next/src/components/tasks/PlanTab.tsx
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/TasksCard.tsx
    - apps/next/src/components/tasks/tasks.module.css
requirements-completed: [TSK-03]
completed: 2026-10-21
---

# Phase 9 Plan 06: Task-to-block assignment Summary

Tasks are planned into focus blocks by checkbox, "Add a task to Block N" or native drag, one block per task, through an owner-scoped `task_block_links` table and `PUT /user/task-links`; a plan save releases the links of blocks it drops.

## Seam map

Guest storage: apps/next/src/lib/storage/browser-storage.ts exports `defaultStorage`, `readStored`, `writeStored` (re-checked against the file; 09-05 mapping holds). Guest links ride in `GUEST_PLAN_KEY` via `toGuestPlan(plan, links)`, already written on every plan or link change. No MISMATCH.
Task links: built in this plan (Phase 9 owned).

## Deviations from Plan

**1. [Coordinator rule] Task 3 (db:push) not run.** Migrations may not be applied and `.dev.vars` may not be read. Wrote `0014_task_block_links.sql`, `meta/0014_snapshot.json` and the journal entry by hand (same approach as 09-02, drizzle-kit generate is broken in this checkout). Apply 0014 before any browser check.

**2. [Design] Shared pending-create map moved to `lib/tasks/task-writes.ts`** (`pendingCreates`, `whenTaskSaved`, `failToast`), re-exported from useTasks.ts. This avoids a usePlan <-> useTasks import cycle (archive needs `assignTask`). Map entries are kept after a create lands so a late `whenTaskSaved(tempId)` still resolves to the server id. `whenTaskSaved` resolves `string | null` (null = create failed).

**3. [Rule 1] `replaceTaskId` also remaps link task ids**, otherwise an optimistic link made against a temp id would dangle after the create landed.

**4. [Rule 2] Link writes are serialized per store** (promise chain) so a quick second move never lands before the first. On failure only that task's links are restored.

**5. [Design] Live region lives in the tasks store** (`announcement`, `announce`) and renders as an sr-only `role=status` in `TasksTabs`, so both layouts share it.

**6. [Design] `AddRow` from ListTab generalized** (`label`, `onAdd` props, exported) and reused for "Add a task to Block N". `useTaskActions` gained `addToBlock`; `add` was split around a synchronous `start` so the new task can be planned before its create finishes.

**7. [Minor] Wording check.** The row label is built as `Add a task to ${name}`, so the literal string "Add a task to Block" is not present in PlanTab.tsx (renders "Add a task to Block 3").

**8. [Coordinator rule] Browser checks and screenshots not run** (need wrangler and env files).

## Verification

- `bun run src/lib/plan/plan.check.ts` and `tasks-storage.check.ts` (cwd apps/next): both OK (planTask move, unplan-all, other tasks untouched, plannedBlockNumber)
- `bunx tsc --noEmit` in apps/next and packages/api: exit 0
- `bun run check`: exit 0
- Handler: `taskBlockLinks.userId, user.id` appears 5 times; task ownership `inArray(tasks.id`; blocks checked against the plan before any write; `setWhere` on the upsert; `putUserPlan` batch unplans `inArray(taskBlockLinks.blockId, droppedIds)` scoped by owner. Body schema has no userId or timestamps, max 64 items.
- No `dangerouslySetInnerHTML` in components/tasks.

## Pending human checks

- Apply migration 0014 to the non-production dev database, then in the browser (guest and signed in): select Block 2, check two tasks, select Block 3 and check one of them (moves, Block 2 row updates, live region says "... moved to Block 3"); add "Write intro" via "Add a task to Block 3"; synthetic drag of a task onto Block 1 (breaks refuse, "Drop here" pill shows); archive a planned task (chip and row entry disappear); reload, assignments identical.
- Signed in: `DELETE /user/plan`, reload, assign a task to Block 1: expect PUT /user/plan (200) then PUT /user/task-links (200), no toast. Remove a planned block: only PUT /user/plan fires and GET /user/plan shows its tasks `planned: false`; Undo re-plans them with one task-links PUT.
- Cross-account: PUT /user/task-links with another account's task id returns 404.
- Keyboard: Arrow Down selects Block 2, Tab reaches the checklist, Space checks. Pixel review of the chip, checklist, drag-over state at 1440 and 390; screenshots `09-06-assign-1440.png`, `09-06-drag-over-1440.png`, `09-06-assign-390.png` not captured.

## Commits

- 5426fc5 feat(BFC-09-06): task_block_links table, PUT /user/task-links, planTask
- c6ff857 feat(BFC-09-06): assign panel, add to block, native drag and block chips

## Known Stubs

None. (Focus rows now list assigned task names; the current-block "chip accent" and Now/Set now rows are 09-07+.)

## Threat Flags

None beyond the plan's threat model.

## Self-Check: PASSED
