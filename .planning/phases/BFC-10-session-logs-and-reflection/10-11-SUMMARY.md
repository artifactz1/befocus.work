---
phase: BFC-10-session-logs-and-reflection
plan: 11
subsystem: stage-summary
tags: [stage, summary, fates, confetti]
requires: [10-06, 10-07, 10-08, 10-10]
provides: [Stage]
key-files:
  created:
    - apps/next/src/components/logs/Stage.tsx
  modified:
    - apps/next/src/app/(app)/page.tsx
    - apps/next/src/app/guest/page.tsx
    - apps/next/src/components/sessions/SessionTitleDisplay.tsx
    - apps/next/src/components/progress/ProgressSlot.tsx
    - apps/next/src/lib/blocks/blocks.ts
  deleted:
    - apps/next/src/components/SessionCompleteModal.tsx
requirements-completed: [LOG-03, LOG-07, LOG-02]
completed: 2026-10-21
---

# Phase BFC-10 Plan 11: Live summary in the stage Summary

`Stage` shows the timer, or the live `SessionSummary` of the session that just ended in the same place, with Not done fates applied to tasks, the note saved on entry, one confetti burst, a Done mode word and a finished header strip. The old completion modal is gone.

## Commits

- f04c9ee feat(10-11): stage with live session summary and fates
- 795d218 feat(10-11): pages render Stage, remove SessionCompleteModal
- fbd0c55 feat(10-11): Done mode word and finished strip

The `SessionCompleteModal.tsx` deletion (`git rm`) was staged by me but landed in the concurrent plan 10-13 commit cd67927, because both executors share one index. The file is gone either way.

## Verification

- `bunx tsc --noEmit` (apps/next) clean; `TZ=UTC bun run src/lib/logs/summary.check.ts` prints "summary.check OK".
- `bunx biome check` clean on all touched files. Root `bun run check` fails only on `apps/next/.impeccable/hook.cache.json` (tooling cache, not mine; same as 10-10).
- Acceptance greps pass: no `SessionCompleteModal` or `Congratulations!` under apps/next/src, `assignTask(taskId, null)` only under `if (planReady)`, `setLater(taskId, true` / `archive(taskId` both carry `keepLinks: !planReady`.
- Not exercised in a browser. Pending human checks from the plan (guest finish and reload, signed-in Later/Next with migration 0015 applied by the captain, blocked `PUT /user/task-links` / `DELETE /user/plan`) are still open.

## Decisions

- `LiveSummary` (inside Stage.tsx) holds all hooks and mounts only while the summary shows, keyed by the ended session id, so its mount effect is the "once per session" point (default fates, note save, confetti).
- Confetti: skipped when the summary is already showing at Stage mount, under reduced motion, and fired at most once per mount. Accent is read from `--user-accent` (a hex value, no `hsl()` wrap), falling back to `#f5f5f4`.
- Entry animation is `opacity 0 -> 1, y 8 -> 0` over 0.45s, skipped under reduced motion. The digits fade-out (0.2s) was not built: Timer unmounts at once.
- Action buttons reuse `session-card.module.css` `.ghost` / `.primary` with an inline 40px height on desktop; the phone bar and tail use the 44px rules from summary.module.css.
- Header: `finishedView` builds a `SessionView` from `finished.records` and `endedLinks`; the strip label gets a new optional `label` prop.

## Deviations from Plan

**1. [Minor] No separate `saveNote(...)` call in the mount effect.** `handlers.setCarried(...)` already persists the note through `saveNote` (via `writeNote`), so a second PUT would be a duplicate. The note is therefore still saved on mount, independent of the plan; a comment names `saveNote()`. Start new session and Open log still call `saveNote(handlers.note())` before `resetAll()`.

**2. [Rule 3 - blocking] `blocks.ts` comment.** One doc comment on `completed` named `SessionCompleteModal`, which broke the "no file mentions SessionCompleteModal" criterion; reworded.

**3. [Minor] Focus handoff.** `SessionSummary` (10-10) already focuses its headline when `live`, so Stage does not repeat it with `document.getElementById`.

## Known limits

- If `endedLinks` is still null when the summary mounts (usePlanSync not mounted, e.g. account plan load error), the summary shows no Not done tasks and applies no default fates; the note is still saved.
- A task defaulted to Later and then ticked Done in the summary keeps its Later flag.

## Known Stubs

None.

## Self-Check: PASSED
