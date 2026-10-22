---
phase: BFC-10-session-logs-and-reflection
plan: 13
subsystem: log-page-ui
tags: [route, history, detail, footer]
requires: [10-02, 10-05, 10-06, 10-10, 10-12]
provides: [LogPage, HistoryList, LogButton, /log route]
affects: []
key-files:
  created:
    - apps/next/src/app/log/page.tsx
    - apps/next/src/components/logs/LogPage.tsx
    - apps/next/src/components/logs/HistoryList.tsx
    - apps/next/src/components/logs/LogButton.tsx
    - apps/next/src/components/logs/log.module.css
  modified:
    - apps/next/src/components/settings/MenuSettings.tsx
    - apps/next/src/components/settings/MenuSettingsMobile.tsx
requirements-completed: [LOG-04, LOG-08, LOG-06, LOG-02, LOG-05]
completed: 2026-10-21
---

# Phase BFC-10 Plan 13: Log page and entry point Summary

`/log` lists past sessions by day (mini strip, first log line) under the What to improve panel and opens the selected session in the same `SessionSummary` (fates read-only, logs and Next time editable, Export only); a footer `LogButton` links to it between sessions.

## Commits

- 1693eca feat(10-13): /log route and footer Log button
- a955874 feat(10-13): log history list, improve panel and page states
- cd67927 feat(10-13): session detail and phone list to detail switch
- 22fd3b7 docs(BFC-10-13): summary (also carries a one-word comment fix in LogPage.tsx)

## Verification

- `bunx tsc --noEmit` (apps/next) clean; `bunx biome check src/components/logs` and the other touched files clean.
- `TZ=UTC bun run src/lib/logs/history.check.ts` prints "history.check OK".
- Acceptance greps pass (copy strings, `x-befocus-mode`, `useHistory(mode, null)`, no `dangerouslySetInnerHTML`, no `setFate` or "Start new session" in LogPage.tsx).
- Not exercised in a browser (no dev server run: needs env files and, for signed in, migration 0015). Pending human check as listed in the plan Task 3.

## Decisions

- Summary desktop layout is re-flowed for the /log panel from log.module.css with structural selectors on `[data-session-summary]` (head across, list left, blocks and Next time right), so summary.module.css stays untouched. These selectors depend on the child order in SessionSummary.tsx.
- Phone export bar: the single ExportMenu takes `col-span-full` via its `className`.
- List scroll top is stored on row tap and restored (plus row focus) in an effect when the view returns to list; detail entry focuses the title. The 24px slide-in is CSS and off under reduced motion.
- LogButton uses `MenuButton asChild` around `next/link`; when live it is an `aria-disabled` button at 40% opacity.
- `LookPaintScript` gets `null` tokens for guests and `lookToTokens(settings?.look ?? DEFAULT_LOOK)` for accounts. No page title was added (no other route sets one).

## Deviations from Plan

None - plan executed as written.

## Known Stubs

None.

## Self-Check: PASSED
