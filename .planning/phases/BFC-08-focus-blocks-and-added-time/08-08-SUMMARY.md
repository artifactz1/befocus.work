---
phase: BFC-08-focus-blocks-and-added-time
plan: 08
subsystem: timer
tags: [block-records, queue, offline-retry, account]
requires: [08-06, 08-07]
provides:
  - createRecordQueue and queueKey (persisted per-user queue, single flight, chunks of 100)
  - Account record sink in TimerStoreProvider sending to PUT /user/blocks
affects: [08-09]
key-files:
  modified:
    - apps/next/src/lib/blocks/block-records.ts
    - apps/next/src/lib/blocks/block-records.check.ts
    - apps/next/src/store/useTimerStore.tsx
key-decisions:
  - Records pushed before the session user id is known are buffered in memory and moved into the queue once known
  - Status widened to number in send because the route types omit 400
  - flush() returns the in-flight promise so checks can await it
requirements-completed: [BLK-03, BLK-04]
completed: 2026-10-20
---

# Phase BFC-08 Plan 08: Account Record Queue Summary

Signed-in block records go through a localStorage queue keyed by user id, sent to PUT /user/blocks one request at a time in chunks of 100, kept on failure and retried on push, load and the browser coming online. Failures are silent.

## Commits

- 49645ad feat(BFC-08-08): persisted per-user record queue with single flight and chunks of 100
- b2aa95b feat(BFC-08-08): account record sink via per-user queue and PUT /user/blocks

## Verification

- `bun run src/lib/blocks/block-records.check.ts` (cwd apps/next): ok (all behavior lines plus 08-06 cases)
- `bunx tsc --noEmit -p apps/next/tsconfig.json`: no errors; `bun run check`: exit 0
- Signed-in round trip NOT exercised: migration 0012 is unapplied and the API was not run. Left to the 08-09 human checkpoint.

## Deviations from Plan

None in behavior. Small additions: `useCallback` for the buffer sink (lint exhaustive-deps) and a `number`-typed status for the 400 check (typed route has no 400).

## Self-Check: PASSED
