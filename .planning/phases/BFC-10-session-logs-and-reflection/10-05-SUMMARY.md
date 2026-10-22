---
phase: BFC-10-session-logs-and-reflection
plan: 05
subsystem: history-and-insights-logic
tags: [pure-functions, rules, tdd]
requires: [10-01, 10-04]
provides: [splitSessions, sessionDigest, groupSessions, improveState, observations, planVsActual, calendar]
affects: [10-12, 10-13]
key-files:
  created:
    - apps/next/src/lib/logs/history.ts
    - apps/next/src/lib/logs/history.check.ts
    - apps/next/src/lib/logs/insights.ts
    - apps/next/src/lib/logs/insights.check.ts
requirements-completed: [LOG-04, LOG-05]
completed: 2026-10-21
---

# Phase BFC-10 Plan 05: History grouping and improve rules Summary

Pure, tested Log list grouping (Today / Yesterday / "Mon 20 Oct", by session end day) and five rule-based improve observations with evidence bars, plan-vs-actual rows and a 35-cell calendar.

## Commits

- b20adaa test(10-05): add failing history checks
- a449141 feat(10-05): history grouping
- 364b266 test(10-05): add failing insights checks
- 576a477 feat(10-05): improve rules and chart data

## Verification

- `TZ=UTC bun run src/lib/logs/history.check.ts` prints "history.check OK"; `insights.check.ts` prints "insights.check OK".
- RED confirmed for both (missing module) before GREEN.
- `bunx tsc --noEmit` (apps/next) clean; biome check clean on the four files; no `fetch(` or `api.` in insights.ts.

## Decisions

- API shapes the UI plans consume: `sessionDigest(session, fmt)` (also returns `endClock`, `start`); `planVsActual(...)` returns `{ rows, scale }` with rows `{ day, label, plannedMinutes, focusedMinutes, addedMinutes }`; `Observation` also carries `strength` (n / m, used for ordering).
- Carried-tasks rule fires when at least 3 distinct tasks have fate 'next' in 3 or more notes (the "at least 3 matching occurrences" gate applied to tasks). Bars: one per carried task.
- Deep time of day: nearest-rank 75th percentile of Deep block start times, hour after, via `fmt.clock`. Occurrences looked at for bars/strength = all focus blocks.
- Added time tip: block 1 reads "first block", other blocks "Try a {x} min block {b}."; x = (mean planned + mean added for that block) rounded to 5 min, minimum 5.
- `calendar(sessions, now)` has no format argument (per plan) so it uses the runtime local timezone; other functions use `fmt`. Same in the browser.
- `planVsActual` and `calendar` include stopped sessions (their focus time is real); rules and `improveState` use finished sessions only.

## Deviations from Plan

None - plan executed as written.

## Known limits

- A Deep p75 start at 23:xx reads "before 00:00" (marked with a `ponytail:` comment).

## Known Stubs

None.

## Self-Check: PASSED
