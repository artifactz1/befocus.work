---
phase: BFC-10-session-logs-and-reflection
plan: 12
subsystem: improve-panel-ui
tags: [react, css-modules, insights]
requires: [10-05, 10-09]
provides: [ImprovePanel]
affects: [10-13]
key-files:
  created:
    - apps/next/src/components/logs/ImprovePanel.tsx
    - apps/next/src/components/logs/improve.module.css
requirements-completed: [LOG-05]
completed: 2026-10-21
---

# Phase BFC-10 Plan 12: What to improve panel Summary

`ImprovePanel({ sessions, now })`: rule-based observations with evidence bars, planned vs focused rows with hatched added time, a 5-week calendar table, and the "Finish 3 sessions" empty state; the Insights / Charts / Both pick persists in `befocus:improve-view`.

## Commits

- 0cfa606 feat(10-12): What to improve panel with insights, charts and calendar

## Verification

- `bunx tsc --noEmit` (apps/next) clean; `TZ=UTC bun run src/lib/logs/insights.check.ts` prints "insights.check OK"; biome check clean on both files.
- Not exercised in a browser (needs 10-13 to mount it). Pending human check: guest with 3+ finished sessions, /log shows the panel, Charts and Both switch and survive reload; under 3 shows the empty state.

## Decisions

- View is read in an effect after mount (SSR and first render show Insights); invalid stored values fall back to Insights via `z.enum` (T-10-33). Observation text is rendered as React text only (T-10-34).
- Phone limits are CSS `:nth-child` under 1024px (3rd observation, chart rows 5-6).
- Evidence "happened" color (spec leaves per-rule choice partly open): `--overtime` for skipped / cut / carried; hatch-light over white 10% for added and deep. "Did not happen" = accent, no data = white 14%.
- Calendar cell screen-reader day text is built from the cell's local date with `makeFormat().day`.
- Chart added tail is drawn inside the fill as `added / focused` of its width, clamped to 100%.
- Tokens (`--overtime`, `--hatch-*`) are declared on the panel root.

## Deviations from Plan

- Tasks 1 and 2 share one file pair and were written together, so they landed as one commit rather than two.

## Known Stubs

None.

## Self-Check: PASSED
