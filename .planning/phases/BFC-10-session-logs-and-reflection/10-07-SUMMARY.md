---
phase: BFC-10-session-logs-and-reflection
plan: 07
subsystem: tasks-later-flag
tags: [tasks, later, list-tab, guest-storage]
requires: [10-01, 10-03, 10-04]
provides: [setLater, keepLinks, Later group]
key-files:
  modified:
    - apps/next/src/lib/tasks/tasks-storage.ts
    - apps/next/src/hooks/useTasks.ts
    - apps/next/src/lib/server/getUserTasks.ts
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/tasks.module.css
requirements-completed: [LOG-07, LOG-06]
completed: 2026-10-21
---

# Phase BFC-10 Plan 07: Later flag on the client Summary

Later flag round-trips for guests and accounts, `setLater` / `archive` take `keepLinks`, and the Tasks List tab shows a Later group with a dashed box, relative date and Bring back.

## Commits

- 3fb4d29 feat(10-07): later flag in storage, mapping and setLater
- d61d03f feat(10-07): Later group in the Tasks List tab

## Verification

- `bunx tsc --noEmit` (apps/next): no errors in my files. The only errors were in `src/lib/logs/history.check.ts` (plan 10-05, another executor, module not yet written).
- `browser-storage.check.ts` prints ok; biome check clean on my 5 files.
- Human check (guest: Later in break modal, refresh, Bring back) is pending until 10-09.

## Decisions

- `update` strips `laterAt` before the PUT (server stamps it, T-10-22). Guest schema validates `later` / `laterAt` per item (T-10-21).
- Later section is the existing `.later` spacing helper on the header inside a new `.laterGroup` wrapper; the helper class is unchanged.

## Deviations from Plan

None - plan executed as written.

## Self-Check: PASSED
