---
phase: BFC-08-focus-blocks-and-added-time
plan: 03
subsystem: timer
tags: [timer, alarm, a11y, ended-state]
requires: [08-02]
provides:
  - useEndedCues hook (single alarm owner, nudges, input cancel, tab title)
  - polite live region [data-timer-live] reused by 08-04
  - data-transport / data-slot hooks on the footer buttons
affects: [08-04, 08-05]
key-files:
  created:
    - apps/next/src/hooks/useEndedCues.ts
  modified:
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/timer/TimerButtons.tsx
    - apps/next/src/components/timer/timer-progress.module.css
requirements-completed: []
status: complete
---

# Phase 8 Plan 03: Ended cues Summary

At 00:00 the alarm rings once, nudges at +30 s and +60 s (keyed off the block's `endedAt`), stops on any key or pointer press, sets the tab title, breathes the digits and announces the end once.

## Tasks

| Task | Commit | Notes |
| ---- | ------ | ----- |
| 1 useEndedCues | 365c82c | Timer no longer creates an Audio element; capture-phase keydown/pointerdown only clear timeouts |
| 2 Live region, breathing, focus | 5401b7d | one aria-live in Timer, `.breathe`, `data-slot` 1-4 |

## Checks

- `bunx tsc --noEmit -p apps/next/tsconfig.json` and `bun run check` clean; useChromeIdle.ts (keys on isRunning) and SessionCompleteModal.tsx unchanged.
- Browser (chrome-devtools-axi on /guest, focus 5 min, `-` x4, play() wrapped, no input):
  - Plays at 68 s, 98 s, 128 s (end, +30, +60): 3 plays, no fourth.
  - Keypress ~10 s after end (second block): 1 play only, no nudges through +60 s.
  - Title while ended "Time's up · Be Focus"; after Enter restored to the original (empty) title.
  - `[data-timer-live]`: "Time's up. Focus block done, 1 minute." and "Time's up. Break done, 1 minute."; cleared on leaving ended.
  - Focus on slot 2 when the break ended: moved to `[data-ended-primary]`; Enter then left focus on `[data-slot="2"]`.
  - Breathing: computed animation `bf-breathe`, opacity oscillating (0.93, 0.53 sampled) on desktop and phone; stops after leaving ended.
  - Desktop 1440x900 and phone `emulate 390x844x1,mobile,touch` ended layouts match 08-02 (phone row bottom 655, digits shrunk). Screenshots in scratchpad `d1440.png`, `p390.png`.
- Not exercised in browser: `+` while focus is on the primary (focus to slot 4) and reduced-motion; both are code paths only. Slot 4 is still Skip next until 08-04/05 add +1.

## Deviations from Plan

**1. [Rule 3] Desktop breathing target.** The first digit copy was a `display: contents` div, and the digits wrapper also contains the ended group (button, label), so pulsing the wrapper would dim the button. Replaced the `contents` div with an equivalent flex div (`h-full items-center justify-center`) carrying `.breathe`; the ink overlay carries it too. Layout unchanged.

**2. Focus on entering ended** keeps the 08-02 detection (focus inside `.bf-chrome` after the Timer root) instead of `[data-transport]`; `data-transport` is added and used for the leaving-ended focus query.

## Known Stubs

None.

## Self-Check: PASSED (commits 365c82c and 5401b7d exist)
