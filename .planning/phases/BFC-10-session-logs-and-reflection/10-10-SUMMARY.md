---
phase: BFC-10-session-logs-and-reflection
plan: 10
subsystem: session-summary-ui
tags: [summary, export, done-list, block-rows]
requires: [10-04, 10-06, 10-09]
provides: [useSummaryModel, SummaryHandlers, ExportMenu, DoneList, BlockRows, SessionSummary]
affects: [10-11, 10-13]
key-files:
  created:
    - apps/next/src/hooks/useSummary.ts
    - apps/next/src/components/logs/ExportMenu.tsx
    - apps/next/src/components/logs/DoneList.tsx
    - apps/next/src/components/logs/BlockRows.tsx
    - apps/next/src/components/logs/SessionSummary.tsx
    - apps/next/src/components/logs/summary.module.css
requirements-completed: [LOG-03, LOG-07, LOG-08, LOG-02]
completed: 2026-10-21
---

# Phase BFC-10 Plan 10: Session summary view Summary

One presentational `SessionSummary` (headline, stat chips, Done / Not done / Later, block rows with inline-editable logs, Next time) plus `useSummaryModel` (optimistic logs, note and ticks over `buildSummary`) and the Export menu; the stage (10-11) and /log (10-13) only supply data, handlers and action rows.

## Commits

- dabdaa4 feat(10-10): summary model hook and export menu
- 6b44137 feat(10-10): done list and block rows
- 21d54c6 feat(10-10): session summary layout

## Verification

- `bunx tsc --noEmit` (apps/next) clean; `bunx biome check` clean on all plan files.
- `export.check`, `summary.check`, `logs-storage.check` print OK (TZ=UTC).
- Acceptance greps pass (copy strings present, no `dangerouslySetInnerHTML`, `@media (min-width: 1024px)` present).
- Root `bun run check` fails only on `apps/next/.impeccable/hook.cache.json` (tooling cache file written by the design hook, not part of this plan); not touched.
- Not exercised in a browser: nothing mounts the view until 10-11 / 10-13.

## Decisions

- `SummaryHandlers` (exported from useSummary.ts) has optional `setFate`; the stage supplies it, /log omits it (read-only tags). DoneList derives tick/untick block ids from `summary.blocks`, so `setTicks(items)` stays the only tick API.
- Overrides are kept after a successful save (the source catches up) and rolled back only on failure.
- `ExportMenu` styles its trigger and menu with Tailwind classes (tailwind-merge overrides the shadcn defaults, portal content cannot see module tokens). Downloads append a trailing newline.
- Layout is CSS only: `.scroll` is one column below 1024px (fade masks), a two-column grid above; `.deskOnly` / `.phoneLine` swap the desktop and phone copy variants. The root fills its parent (`height: 100%`), so the stage must give it a sized container.
- Past sessions render Done / Not done boxes as decorative static boxes; the add row and X are live-only.

## Deviations from Plan

None - plan executed as written. Not built (not in the plan): the polite live-region announcements from the UI-SPEC accessibility table; log saves surface only the existing toasts.

## Known Stubs

None.

## Self-Check: PASSED
