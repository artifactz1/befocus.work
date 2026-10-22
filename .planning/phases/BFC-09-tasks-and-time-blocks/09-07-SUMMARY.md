---
phase: BFC-09-tasks-and-time-blocks
plan: 07
subsystem: ui
tags: [zustand, plan, timer-sync, session-card]
requires: [09-05, 09-06]
provides:
  - toSeed, reconcilePlan, reseedFromSettings, buildSessionView (pure, with checks)
  - usePlanSync (seed, go live, adopt, close) and useSessionView (shared live view)
  - completeTask (live completion link writes), live Session card in PlanTab
affects: [09-08, 09-09]
key-files:
  modified:
    - apps/next/src/lib/plan/plan.ts
    - apps/next/src/lib/plan/plan.check.ts
    - apps/next/src/hooks/usePlan.ts
    - apps/next/src/hooks/useTasks.ts
    - apps/next/src/components/tasks/PlanTab.tsx
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/TasksCard.tsx
    - apps/next/src/components/tasks/tasks.module.css
    - apps/next/src/lib/blocks/blocks.ts
requirements-completed: [TSK-04, TSK-03]
completed: 2026-10-21
---

# Phase 9 Plan 07: Live Session card and plan sync Summary

The plan now seeds Phase 8's block list before the start (and its ahead blocks while live), the Plan tab renders the running session from one shared `useSessionView`, ticks during a running or paused focus block write current-block links, and the plan closes and reseeds when the session finishes or resets.

## Seam map

Block list: `useTimerStore().blocks: Block[]` (lib/blocks/blocks.ts), ordered; `{ id, sessionId, kind, index, plannedSeconds, actualSeconds, addedSeconds, startedAt, endedAt, outcome }`, all durations in seconds, times in epoch ms.
Current block: `currentBlockId: string` (a block id, never null; plan assumed null-able).
Seed action: `seedBlocks({ sessionId, blocks: { id, kind, plannedSeconds }[] }): boolean`, plannedSeconds in seconds, client ids accepted.
Seed while live: same action; `seed()` keeps blocks up to and including the current one and replaces the tail from the input (needs the current id in the input and the same sessionId, else returns false).
Session id: `sessionId` replaced with a fresh uuid by reset, applySettings, resetAll and finish (`completed: true`).
Added time: `Block.addedSeconds` (signed seconds); current block's allowance is `plannedSeconds + addedSeconds`.
Ended state: `status: 'idle' | 'running' | 'paused' | 'ended'`, `Block.outcome` and `endedAt` set on finalised blocks.
Run status: `status` plus `timeLeft` (seconds, legacy field updated on tick).
Block record ids: `toRecord` uses `block.id`, so records reuse the plan's ids once seeded. No MISMATCH.

Renames only versus the plan's assumptions (`currentBlockId` non-null, `status` instead of run status string). `isLive` in blocks.ts was exported (one word) to reuse the store's own live test.

## Deviations from Plan

**1. [Design] usePlanSync is mounted in TasksCard, not in the TasksStoreProvider.** usePlan.ts imports useToDoStore.tsx, so mounting from the provider file would create an import cycle. TasksCard already mounts `usePlanBootstrap()` and is rendered by both layouts; `usePlanSync()` has exactly one call site there. Task 2's `grep usePlanSync src/store/useToDoStore.tsx` therefore does not match; the intent (single mount inside the providers) holds.

**2. [Design] `completeTask` lives in `useTaskActions` (useTasks.ts)**, calling `writeCompletion` exported from usePlan.ts. Putting it in usePlan.ts would need useTaskActions and create a cycle. The literal `completed: true, worked: true, planned: true` is in usePlan.ts.

**3. [Minor] `reconcilePlan` takes `store: { sessionId }` only.** `startedAny` and `ended` are unused by the three outcomes (the decision reads only the plan and links).

**4. [Minor] Settings reseed replaces all block minutes** with the new Session settings (lengths and count), so nudges made before a settings change are reset. Ids and assignments of surviving positions are kept.

**5. [Rule 1] Compare-before-seed also guards on `plan.sessionId === timer.sessionId`.** Without it, a seed during the async DELETE would push the old session id back into the timer.

**6. [Phase 8 touch] `export` added to `isLive` in lib/blocks/blocks.ts.** No behavior change.

**7. [Coordinator rule] Browser checks and screenshots not run** (need wrangler and env files). `09-07-live-1440.png`, `09-07-live-added-1440.png`, `09-07-live-390.png` not captured; Task 3's automated verify line that tests for them was not run as written.

## Behavior notes

- Plan goes live (`wentLive`, saved at once) when the timer has a started block of the same session. Session id change: `reconcilePlan` adopts (not live, no worked or completed link) or closes. Close = `DELETE /user/plan` (account) then `markUnsaved`, links cleared locally, fresh plan from Session settings with the new session id, saved at once. A failed DELETE toasts "Couldn't close your plan..." with Try again and skips the reseed. Guest: the new plan overwrites the guest key.
- On reload the timer session is not persisted, so a stored live plan is closed at mount and the Plan tab shows a fresh plan (old links stay as history).
- nudge and removeFocus no-op on done or current blocks (removal also refuses when the break it would take is done or current); addFocus is planning-only. Live Plan tab hides the add row and footnotes.
- Live rule: running or paused focus block only. Tick writes `{ blockId: current, taskId, completed: true, worked: true, planned: true }`, untick `{ completed: false }`; optimistic via `planTask`, rollback and task toast on failure; 404 retry reuses 09-06's `writeLinks`.
- Announcer: "Block N of M started" / "Break started" via the existing tasks-store live region, on block changes while running.

## Verification

- `bun run src/lib/plan/plan.check.ts` (cwd apps/next): `plan.check OK` with new cases (toSeed, reconcile x3 plus links, reseed shrink and grow, planning view, live view, paused, added time re-flow)
- `tasks-storage.check.ts`: OK
- `bunx tsc --noEmit -p apps/next/tsconfig.json`: exit 0
- `bun run check`: exit 0

## Pending human checks

Needs the dev API and a non-production DB (migration 0014 from 09-06 applied):
- Session settings 2 sessions, shortest lengths; assign tasks to Block 1 and 2; start; Plan tab shows "Block 1 · now", growing bar, "mm:ss of N min"; Phase 8 +N shows hatched band and "+N" in meta, rows below shift; pause shows " · paused"; tick Block 1 task gives "1/2 tasks".
- List tab tick of a task planned nowhere during the live block: GET /user/plan shows a link in the current block with completed, worked, planned true; untick gives completed false; tick during the break fires no PUT /user/task-links.
- Let Block 1 end: done tint, static ticks. Reset the session: plan closed (DELETE /user/plan), fresh 2-block plan, GET /user/plan returns the new session id, old links remain in the DB.
- Reload mid-session closes the old plan. Settings change before start reseeds the plan (count and lengths) and PUTs it.
- Pixel review at 1440 and 390; screenshots listed above.
- Not verified at runtime: the sync effects were checked by typecheck and reading only.

## Commits

- 1abca74 feat(BFC-09-07): session view, plan sync with the timer block list, live completion links
- 86c4fe6 feat(BFC-09-07): live Session card on the Plan tab and completion writes from the List tab

## Known Stubs

None. ("Now" tag and "Set now" arrive in 09-09; the progress slot in 09-08.)

## Threat Flags

None beyond the plan's threat model (T-09-22 loop guard: seedTimer compares ids and seconds before seeding).

## Self-Check: PASSED
