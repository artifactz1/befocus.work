---
phase: BFC-08-focus-blocks-and-added-time
plan: 06
subsystem: timer
tags: [guest, localStorage, block-records]
requires: [08-01]
provides:
  - Guest block record storage (read, merge by id, append with 500 cap)
  - TimerStoreProvider mode prop and swappable record sink
  - pagehide record for a block still started when the tab closes
affects: [08-08]
key-files:
  created:
    - apps/next/src/lib/blocks/block-records.ts
    - apps/next/src/lib/blocks/block-records.check.ts
  modified:
    - apps/next/src/store/useTimerStore.tsx
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/app/guest/GuestShell.tsx
key-decisions:
  - Sink lives in a ref so 08-08 can set the account sink without recreating the store
  - pagehide only (no beforeunload/unload); store state untouched so bfcache restore resumes
requirements-completed: [BLK-03, BLK-04]
duration: 25 min
completed: 2026-10-20
---

# Phase BFC-08 Plan 06: Guest Block Records Summary

Guests keep one up-to-date record per started block in localStorage (`befocus.blockRecords`), upserted by id, capped at 500, with invalid entries dropped on read.

## Commits

- 3a88421 feat(BFC-08-06): guest block record storage with merge by id and 500 cap
- d000bc5 feat(BFC-08-06): timer provider mode prop, guest record sink and pagehide record

## Verification

- `bun run src/lib/blocks/block-records.check.ts` (cwd apps/next): ok
- `bunx tsc --noEmit -p apps/next/tsconfig.json`: no errors; `bun run check`: exit 0
- Dev check (chrome-devtools-axi on the running dev server, /guest):
  - start, 3 s, R: one record `reset`, actualSeconds 4
  - reload while running after 5 s: new record `reset`, actualSeconds 6
  - reload while paused (about 6 s): new record `reset`, actualSeconds 7
  - Focus 5 min, `-` x4, wait to end: `914e finished planned 300 added -240 actual 60`
  - `+`, wait to end: same id `914e finished added -180 actual 120` (updated in place)
  - reload: 4 records still present

## Deviations from Plan

None - plan executed exactly as written. The RED step for Task 1 was folded into writing the check and module together (module missing is the trivially red state).

## Notes

- The dev server on port 3000 was already running (another executor's); I used it instead of starting a second one.
- Account mode has no sink yet; 08-08 sets `sinkRef.current`.

## Self-Check: PASSED
