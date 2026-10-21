---
phase: BFC-09-tasks-and-time-blocks
plan: 11
subsystem: ui
tags: [phone, progress-slot, now-line, grid-pill, mini-strip, css-modules]
requires:
  - phase: BFC-09-tasks-and-time-blocks
    provides: now line, Tasks sheet and deck store (09-07 to 09-10)
provides:
  - Phone Strip and Now progress views (390 wide and landscape)
  - Phone now line placement under the stacked digits
  - Grid pill that opens the Tasks sheet on Plan
  - Mini strip above the Tasks sheet
affects: [phase 9 verification]
tech-stack:
  added: []
  patterns: [combined media query for phone plus landscape phone, :has() spacing for the pill]
key-files:
  created: [apps/next/src/components/progress/MiniStrip.tsx]
  modified:
    - apps/next/src/components/progress/ProgressSlot.tsx
    - apps/next/src/components/progress/progress.module.css
    - apps/next/src/components/tasks/NowLine.tsx
    - apps/next/src/components/tasks/tasks.module.css
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/timer/timer-progress.module.css
key-decisions:
  - "Phone views use (max-width: 639.98px), (max-height: 500px) so landscape phones at 844x390 get 24px Strip and 32px Now"
  - "Phone now pick popover uses avoidCollisions={!phone} so it never flips over the digits"
requirements-completed: [TSK-05]
duration: long
completed: 2026-10-21
---

# Phase 9 Plan 11: Phone progress views, now line, Grid pill, mini strip Summary

Phone Strip and Now views, a Grid pill that opens the Tasks sheet on Plan, a mini strip above the sheet, landscape sizing and phone popover sizing, all verified in guest mode.

## Commits

- 72628b0 phone Strip and Now progress views, landscape sizes, mini strip
- f054f6d phone now line placement, Grid pill, popover sizing

Both tasks touch Timer.tsx and progress.module.css edits that were interleaved, so files were grouped per commit rather than per task hunk.

## Verification (guest mode, chrome-devtools-axi, dev server killed by recorded PID)

Rects (px):
- 390 Strip: slot 32,88 to 358,158; digits start well below (about 250). Switcher open: 32,166 to 372,379, fits the width, overlays the digits only while open.
- 390 now line: top 613 with digits box bottom 589, a 24px gap per spec. Now pick popover 35,669 to 355,828, below the digits (bottom 589).
- 390 Grid: pill 109,630 to 281,674 (44px high); transport row starts at 683, clear.
- 390 sheet: sheet top 132, mini strip 40,104 to 350,112 (8px high), visible above the sheet.
- 844x390: Strip blocks 24px, Now bar 32px, slot bottom 80, digits start about 150. Unobstructed.
- 1440x900: regression view intact, now line and strip as before.

Idle opacities (computed): slot 0.35, now line and pill 0.55, footer 0, at both 390 and 1440. With the now pick open or the timer paused chrome returns to 1.

Screenshots in /private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-2-befocus-work/566cefbe-65d6-42d2-aebb-cae16c757709/scratchpad/shots/:
09-11-strip-390.png, 09-11-now-390.png, 09-11-grid-pill-390.png, 09-11-sheet-mini-390.png, 09-11-nowpick-390.png, 09-11-landscape-844.png, 09-11-idle-1440.png, 09-11-regression-1440.png. Extras: 09-11-switcher-390.png, 09-11-idle-390.png, 09-11-nowpick-1440.png.

Typecheck, `bun run check` pass.

## Deviations from Plan

1. [Rule 1 - Bug] Grid pill overlapped the transport row by 7px at 390 (the taller Grid slot pushes the digits down). Added `data-grid-pill` and `.phoneNow:has([data-grid-pill]) { margin-top: 8px }`. Pill now clears the transport row.
2. [Rule 1 - Bug] At 844x390 the slot was clipped above the viewport (top -14) because width 844 is not phone. Phone query in ProgressSlot is now `(max-width: 639.98px), (max-height: 500px)`; slot sits at top 22.
3. Now pick popover: `avoidCollisions={!phone}` so Radix does not flip it over the digits on phone.
4. `openDeck('tasks', 'plan')` passes no opener argument (the plan's grep requires the literal call).
5. Phase 8 file touched as the plan requires: ProgressSlot.tsx, progress.module.css, Timer.tsx.

## Deferred

Dialog Start path bug (new session and block ids make the plan stay "planning" forever). Logged in deferred-items.md. Not caused by this plan.

## Known Stubs

None.

## Self-Check: PASSED

Files exist, commits 72628b0 and f054f6d present, git status clean.
