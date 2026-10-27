---
phase: BFC-10-session-logs-and-reflection
plan: 06
subsystem: logs-data-layer
tags: [guest-storage, hooks, tanstack-query, tdd]
requires: [10-01, 10-03, 10-04]
provides: [GUEST_LOGS_KEY, GUEST_NOTES_KEY, parseGuestLogs, parseGuestNotes, upsertGuestLog, upsertGuestNote, guestHistory, useLogActions, useHistory]
affects: [10-09, 10-10, 10-13]
key-files:
  created:
    - apps/next/src/lib/logs/logs-storage.ts
    - apps/next/src/lib/logs/logs-storage.check.ts
    - apps/next/src/hooks/useLogs.ts
requirements-completed: [LOG-02, LOG-06]
completed: 2026-10-21
---

# Phase BFC-10 Plan 06: Client data layer for logs Summary

Guest block logs and session notes in browser storage (per-item Zod parse, caps 500 / 200) plus one `useLogActions` / `useHistory` hook pair that saves and reads logs for guests and signed-in users in the same `History` shape.

## Commits

- eb07ae3 test(10-06): add failing guest log storage checks
- 1e712a4 feat(10-06): guest log storage
- 542829c feat(10-06): useLogs hook for logs, ticks, notes and history

## Verification

- `TZ=UTC bun run src/lib/logs/logs-storage.check.ts` prints "logs-storage.check OK" (RED confirmed: missing module first).
- `bunx tsc --noEmit` (apps/next) clean for my files; the only errors are other executors' in-progress `*.check.ts` files (history, insights).
- `bunx biome check` clean on my three files. useToDoStore.tsx not touched.
- No runner exists; the hook was not exercised in a browser (no consumer UI yet).

## Decisions

- `TasksStoreApi` is not exported by useToDoStore.tsx (which this wave must not edit), so useLogs.ts exports it derived from `createTasksStore`.
- `guestHistory` window takes `before` as epoch ms. A session is in the window when its latest record started inside it and then comes back whole; `nextBefore` is set when a session older than the window exists (more exact than "older records exist", which could yield an empty next page).
- Guest "older" pages grow the window (`days = 35 * n`) instead of a cursor; same set as concatenated pages.
- Guest re-reads are driven by a module-level version + `useSyncExternalStore`, so any mounted `useHistory` refreshes after any guest save, and by store `links` changes.
- `saveLog` skip rule for accounts checks the cached `['history']` pages for an existing log.
- Guest ticks: store present patches live links and tasks (store persists tasks); ticks on links outside the live plan, and all ticks without a store, go to `befocus.taskLinkHistory` (created as worked when missing); without a store `befocus.tasks` is rewritten directly.

## Deviations from Plan

None - plan executed as written. `saveLog` takes the block number as its second argument as specified.

## Known Stubs

None.

## Self-Check: PASSED
