---
phase: BFC-10-session-logs-and-reflection
plan: 04
subsystem: session-summary-logic
tags: [pure-functions, export, tdd]
requires: [10-01]
provides: [buildSummary, defaultFate, fateOps, makeFormat, finishedRecords, toHistoryLinks, toMarkdown, toText, escapeMd, exportFileName]
affects: [10-10, 10-12]
key-files:
  created:
    - apps/next/src/lib/logs/summary.ts
    - apps/next/src/lib/logs/summary.check.ts
    - apps/next/src/lib/logs/export.ts
    - apps/next/src/lib/logs/export.check.ts
    - apps/next/src/lib/logs/fixture.ts
requirements-completed: [LOG-03, LOG-07, LOG-08]
completed: 2026-10-21
---

# Phase BFC-10 Plan 04: Session summary model and export text Summary

Pure, tested `buildSummary` / `fateOps` / `makeFormat` and `toMarkdown` / `toText` (Markdown-escaped user text) that the live stage and `/log` render without re-deriving anything.

## Commits

- 00bf003 test(10-04): add failing summary checks
- 8e82a34 feat(10-04): session summary model
- 1a86121 test(10-04): add failing export checks
- a06da14 feat(10-04): markdown and text export

## Verification

- `TZ=UTC bun run src/lib/logs/summary.check.ts` prints "summary.check OK"; `export.check.ts` prints "export.check OK".
- `bunx tsc --noEmit` (apps/next) clean; `bun run check` clean, no biome warnings.
- RED confirmed for both checks (missing module) before GREEN.

## Decisions

- Links are scoped to the session's own records (a task linked only to a block with no record is ignored).
- `Format` also exposes `stamp(ms)` (digits-only `YYYY-MM-DD-HHMM`, locale independent) used by `exportFileName`, so file names never depend on locale or user text.
- Shared fixture lives in `fixture.ts` (the plan's allowed alternative), plus a `must()` helper to avoid non-null assertions.
- Markdown has no trailing newline (byte-for-byte with the sample); the download code in 10-10/10-12 may append one.

## Deviations from Plan

**1. [Spec inconsistency] Weekday in the #mdtext sample.** UI-SPEC prints "Tue 21 Oct 2026" but 21 Oct 2026 is a Wednesday, and the plan also pins the file name to 2026-10-21. The check's expected string therefore reads "Wed 21 Oct 2026" (everything else verbatim). Likewise the `since` asserts use the real calendar relative to Wed 21 Oct 2026 ("since Sun" for 3 days ago, "since 11 Oct" for 10 days ago) instead of "since Mon" / "since 14 Oct". Behavior is unchanged: under 7 days shows the weekday, otherwise day and month.

**2. [Minor] Date format without comma.** `Intl` en-GB renders "Wed, 21 Oct"; `day` and `dayWithYear` strip the comma to match the spec's "Tue 21 Oct".

## Known limits

- Escaping covers the nine characters in the plan; a log line that starts with "- " or "1." is indented under its list item and may render as a nested list in some viewers.
- Past-session Later list is empty by design (`live: false`).

## Known Stubs

None.

## Self-Check: PASSED
