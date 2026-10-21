---
phase: BFC-08-focus-blocks-and-added-time
plan: 01
subsystem: timer
tags: [timer, zustand, zod, blocks, wall-clock]
requires: []
provides:
  - packages/types/blocks.ts block record contract
  - pure block run engine (lib/blocks/blocks.ts) with assert-based check
  - timer store on the engine (ended state, endsAt anchor, onRecords callback)
affects: [08-02, 08-04, 08-06, 08-08, 09-07]
tech-stack:
  added: []
  patterns: [pure engine with now argument, single commit() per transition, 250 ms worker tick]
key-files:
  created:
    - packages/types/blocks.ts
    - apps/next/src/lib/blocks/blocks.ts
    - apps/next/src/lib/blocks/blocks.check.ts
  modified:
    - apps/next/src/store/useTimerStore.tsx
    - apps/next/src/lib/timerWorker.ts
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/sessions/SessionTitleDisplay.tsx
key-decisions:
  - "Engine settles an end that passed without a tick before skip / reset / resetSession"
  - "startNext is a no-op unless status is ended"
  - "seed returns null when the current id is not in the seed (live, same session)"
requirements-completed: [BLK-01, BLK-05]
duration: 25 min
completed: 2026-10-21
---

# Phase 8 Plan 01: Block run engine Summary

The timer now runs on an explicit block list with idle / running / paused / ended status anchored on a wall-clock `endsAt`; at 00:00 it stops in `ended`, rings the alarm once and never advances by itself.

## Tasks

| Task | Commit | Notes |
| ---- | ------ | ----- |
| 1 Contract + engine + check | 93d9cc3 | blocks.check.ts passes |
| 2 Store, worker, Timer, title | 6038735 | tsc and `bun run check` clean |

## Seam

Store fields: `sessionId`, `blocks: Block[]`, `currentBlockId` (always a string), `status`, `endsAt`, `remainingMs`, `segmentStartedAt`, `activeMs`, `completed`, derived `timeLeft` (seconds), `isRunning`, `isWorking`, `currentSession`; settings `sessions`, `workDuration`, `breakDuration`, `askBeforeStart`, `card`.

Actions: `tick(now)`, `requestStart`, `reset`, `resetAll`, `resetCurrentTime`, `skipToNextSession`, `skipToPrevSession`, `adjust(minutes): boolean`, `startNext`, `seedBlocks({ sessionId, blocks }): boolean`, `updateSettings`, `applySettings`, `openCard`, `closeCard`, `setAskBeforeStart`. Removed: `decrementTime`, `setTimeLeft`, `setIsRunning`, `isAlarmOn`.

Differences from the Phase 9 assumption: signed `addedSeconds`, `idle` status, `endsAt`; re-run blocks keep their id and accumulate time; `applySettings` goes through `resetSession` (which seeds blocks), not `seedBlocks`; `sessionId` changes on finish, reset and settings apply, not on the modal's Continue. `createTimerStore(initial, onRecords)` takes the records sink; the provider passes a no-op until 08-06.

## Deviations from Plan

**1. [Rule 3 - Blocker] Strict index access typing**
- **Found during:** Task 2 (tsc)
- **Issue:** `noUncheckedIndexedAccess` rejected `blocks[0]` style access in engine and check
- **Fix:** `createRun` / `currentBlock` throw on an empty list or unknown id; check file uses optional chaining. Landed in commit 6038735 together with Task 2.

Total deviations: 1 auto-fixed. No impact on behavior.

## Checks

- `bun run src/lib/blocks/blocks.check.ts` ok
- `bunx tsc --noEmit -p apps/next/tsconfig.json` clean, `bun run check` clean
- SessionCompleteModal.tsx unchanged; grep for removed actions empty; no `Date.now` / `crypto` in blocks.ts
- Dev exercise on /guest (chrome-devtools-axi): Space opens the start card, Enter starts (24:57 after ~3 s), Space pauses (time frozen) and resumes, R returns to 25:00, footer Next lands on the 05:00 break, Back returns to the focus block. 00:00 ended state and alarm were covered by the engine check only (not waited out in the browser).

## Known Stubs

None. The `onRecords` sink is a deliberate no-op until 08-06.

## Self-Check: PASSED
