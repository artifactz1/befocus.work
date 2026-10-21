---
phase: BFC-08-focus-blocks-and-added-time
plan: 02
subsystem: timer
tags: [timer, keyboard, ended-state, a11y]
requires: [08-01]
provides:
  - + = - Enter keys in useTimerKeyboard
  - ended group under the desktop digits and the phone ended label and row
affects: [08-04, 08-05]
key-files:
  modified:
    - apps/next/src/hooks/useTimerKeyboard.ts
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/timer/timer-progress.module.css
requirements-completed: [BLK-01, BLK-02]
status: complete on desktop and tablet; phone fit open (see Open Decision)
---

# Phase 8 Plan 02: Ended block UI and keys Summary

At 00:00 the timer shows the ended label, a Start break / Start focus / Finish session button and the ended hints; `+` `=` `-` and Enter drive adding, removing and starting the next block.

## Tasks

| Task | Commit | Notes |
| ---- | ------ | ----- |
| 1 Keys | 38ddc88 | Shift allowed for `+` only; Enter only when ended, native activation kept on live buttons, `aria-disabled` targets fall through to the global handler |
| 2 Ended UI | 2d9781d | desktop group in `.under`, phone label and row, height rules, focus hand-off to the primary |

## Checks

- `bunx tsc --noEmit -p apps/next/tsconfig.json` and `bun run check` clean; SessionCompleteModal.tsx unchanged.
- Browser (chrome-devtools-axi on /guest, focus 5 min, 2 rounds, real wait to 00:00):
  - Label "FOCUS BLOCK DONE · 1 MIN" (final length after -4 min), primary "Start break", hints "+ add 1 min / Enter start break". Primary has no aria-hidden ancestor (true at all widths).
  - `=` at 00:00 resumed the same block at 01:00; `+` while running added a minute; `-` removed one and was refused at 00:51.
  - Enter at 00:00 started the break (04:58). Break end showed "Start focus"; clicking it started the last focus block; its end showed "Finish session" and clicking it opened the all-sessions-complete modal.
  - Desktop rects (primary bottom / hints bottom vs footer button top): 1440x900 738 / 773 vs 809; 1280x720 621 (hints hidden) vs 642; 1024x768 615 vs 686; 844x390 label and hints hidden, primary 268-312 vs 339. All keep at least 16px.
  - Screenshots: scratchpad `ended-1440x900.png`, `ended-1280x720.png`, `ended-1024x768.png`, `ended-844x390.png`, `ended-390x844.png`, `ended-375x667.png`, `ended-last-1440x900.png` (under /private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-1-befocus-work/319a90b8-b7ed-40a0-bfba-385aead0cf6b/scratchpad/).

## Deviations from Plan

**1. [Rule 3] Phone stack height is 1.8em, not 2em.** Each stacked TimerUI is 0.9em tall, so `--stack-size` is `calc(mobileFontSize * 1.8)`.

**2. [Rule 3] Phone elements centred with `left: 50%` + translate.** The Timer root is 0 wide on phone (flex-col `items-center` parent), so `left:0; right:0` collapsed the label and row.

**3. Focus hand-off footer detection.** Footer has no marker, so the effect checks the focused element is inside `.bf-chrome` and follows the Timer root in document order (header excluded). Footer.tsx untouched.

**4. Phone render uses `useMediaQuery('(max-width: 639.98px)')`** so only one primary button exists in the DOM (a single ref and one focus target) instead of a CSS-hidden twin.

## Open Decision (phone fit, needs the planner)

UI-SPEC requires the phone primary to keep 12px clearance above the footer and below the digits. Measured:

- 390x844: stacked digit box 288-639, footer buttons start at 683, so the gap is 44px: the 44px button fits with 0px clearance (touching the footer row, 639-683). The digit ink ends about 625.
- 375x667: the stacked digits (215-553) already overlap the footer buttons (top 517) with no ended UI; the primary (553-597) sits on the footer. The `max-height: 699px` label fallback does not help because the problem is the button row, not the label.

So 12px clearance is not reachable on phone with today's 50vw stacked digits. Options: shrink the phone digits while ended (or always, e.g. 40vw / height-aware clamp), or lay the primary over the lower digit area, or move it into the footer area. The 08-UI-SPEC does not decide this, so I stopped at the measured code. Phone label (16px above the stack) fits at 390x844 but lands over the header grid at 375x667.

## Known Stubs

None.

## Self-Check: PASSED (commits 38ddc88 and 2d9781d exist)
