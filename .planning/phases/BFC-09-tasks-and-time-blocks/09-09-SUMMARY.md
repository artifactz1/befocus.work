---
phase: BFC-09-tasks-and-time-blocks
plan: 09
subsystem: ui
tags: [now-pick, popover, plan-links, timer]
requires: [09-07, 09-08]
provides:
  - deriveNow, nextNowAfterDone, blockRecordTasks (pure, with now.check)
  - useNow, writeNow / setNow, markDone, default-now worked write at block start
  - NowLine (now line plus "Working on" popover), BlockTasks (done-row record)
affects: [09-10, 09-11]
key-files:
  created:
    - apps/next/src/lib/plan/now.ts
    - apps/next/src/lib/plan/now.check.ts
    - apps/next/src/components/tasks/NowLine.tsx
    - apps/next/src/components/tasks/BlockTasks.tsx
  modified:
    - apps/next/src/hooks/usePlan.ts
    - apps/next/src/hooks/useTasks.ts
    - apps/next/src/components/tasks/PlanTab.tsx
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/tasks.module.css
    - apps/next/src/components/timer/Timer.tsx
requirements-completed: [TSK-02]
completed: 2026-10-21
---

# Phase 9 Plan 09: Now pick Summary

A derived "now" task for the current focus block, a now line under the digits that opens a "Working on" popover (pick, Mark done), "Now" / "Set now" in the Session card and List, and a Worked on / Completed record in done focus rows, all written through the current block's task links.

## Seam map

Current block: timer store `status` ('running' | 'paused' | 'idle' | 'ended') with `currentBlockId` (never null) and `blocks[].kind`; a running or paused focus block is `liveFocusBlock()` in usePlan.ts (also requires the open plan to hold the block and match the session id). Block start = `status` becomes 'running' or `currentBlockId` changes (09-07 map re-checked, unchanged).
Under slot: `.under` in Timer.tsx holds, outside the ended state, the `.ruler` (always) and the `.hints` div (Space, R, and the "+/- 1 min" hint while running and unseen); in the ended state (desktop) it holds the ended group (label, primary button, its own `.endedHints`). No end-block or add-time controls live in `.under`. NowLine replaces only the non-ended `.hints` div. No MISMATCH.

## Deviations from Plan

**1. [Design] `markDone` lives in `useTaskActions` (useTasks.ts), not `usePlanActions`.** useTasks.ts imports usePlan.ts (cycle otherwise), as with `completeTask` in 09-07. It calls the same `update` + `writeCompletion` pair as `completeTask`, then `writeNow(next)`; there is no second completion write path. `setNow` is on `usePlanActions`, backed by an exported `writeNow`.
**2. [Minor] Private tick hook `useNow(ms)` renamed `useTick`** so the new exported `useNow()` fits the plan's name.
**3. [Minor] The "+/- 1 min" adjust hint is not shown while the now line replaces `.hints`** (the plan replaces the hints div as a whole).
**4. [Minor] Done focus rows show only tasks with worked or completed links** (BlockTasks), so a task planned in a block but never touched no longer appears in that block's done row.
**5. [Coordinator rule] Browser checks and the three screenshots not run** (need wrangler and env files); Task 3's screenshot verify clause not run as written. Task 1 made no commit (no source changes).

## Behavior notes

- `setNow` writes `{ blockId, taskId, planned: true, worked: true }` optimistically (guest stamps `workedAt` client side), announces "Now working on {task}", rolls back and toasts on failure. Account writes reuse `writeLinks` (plan save wait, task-create wait, 404 retry).
- Default now (discretion): when a focus block starts running and its derived now task has no worked link, `writeNow(..., quiet)` records it once.
- `deriveNow`: latest `workedAt` among open planned tasks, else first in link order. `nextNowAfterDone` wraps and ignores completed tasks.
- The now line shows for a running or paused focus block when any open task exists; "Pick a task" when the block has none.
- Idle dim: `bf-chrome-dim` with `--idle-opacity: 0.55`; popover carries `data-now-pick` (09-08's `:has` exclusion keeps chrome awake).
- Phone placement is 09-11; under 640px the same element renders in the same slot (the phone digit stack does not render `.under`, so the now line is not visible there yet).

## Verification

- `bun run src/lib/plan/now.check.ts`: `now.check OK`; `plan.check.ts`: `plan.check OK`
- `bunx tsc --noEmit -p apps/next/tsconfig.json`: exit 0
- `bun run check`: exit 0; no `dangerouslySetInnerHTML` under components/tasks; BlockTasks has no `api.` use

## Pending human checks

Needs the dev server (not run here), guest and signed in, 1440:
- Plan three tasks in Block 1, start: now line reads the first task, ruler still shows; open the pick, pick task 2: line updates, live region "Now working on ...", Now tag on task 2 in the Session card.
- Mark done: task 2 ticked, now moves to task 3, popover stays open. Pick a task planned in Block 2: it moves into Block 1.
- Skip to the break: hints return, Block 1's done row lists Worked on and Completed; signed in, `GET /user/plan` shows links with worked and completed set.
- Pixel review of the now line, popover and done row; screenshots `09-09-nowline-1440`, `09-09-nowpick-1440`, `09-09-done-row-1440`.
- Idle: now line at 0.55 opacity; popover open keeps chrome awake.

## Commits

- 89a815b feat(BFC-09-09): now derivation, setNow and markDone writes on the current block's links
- 7f9b4ce feat(BFC-09-09): now line, now pick popover, Set now tags and done-row task record

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (T-09-28 reuses PUT /user/task-links and the single completion path; T-09-30 names render as React text, grep gate passes).

## Self-Check: PASSED
