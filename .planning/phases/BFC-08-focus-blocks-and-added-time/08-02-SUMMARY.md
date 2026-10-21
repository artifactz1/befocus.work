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
status: complete
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

## Phone fit decision (captain, option a) - commit b8c0c7e

Phone stacked digits shrink while ended only. The Timer root is now a size container; ended phone font-size is `min(50vw * scale, (100cqh - 118px) / 1.8)`, the stage is inset 40px top and 78px bottom, the label sits 16px above the stack box and the primary row is 44px tall, 22px above the root bottom. Measured with `emulate --viewport "WxHx1,mobile,touch"`, real wait to 00:00:

| Viewport | Header bottom | Label | Stack box | Primary | Footer buttons top | Clearances |
| -------- | ------------- | ----- | --------- | ------- | ------------------ | ---------- |
| 390x844 | 249 | 261-273 | 289-599 | 611-655 | 683 | label-to-stack 16, header-to-label 12, digits-to-primary 12, primary-to-footer 28 |
| 375x667 | 242 | 254-266 | 282-449 | 461-505 | 517 | label-to-stack 16, header-to-label 12, digits-to-primary 12, primary-to-footer 12 |

The label fallback (`max-height: 699px`) was not needed. No transition on the shrink (jumps at 00:00). Desktop idle re-checked unchanged. Screenshots: scratchpad `ended-390x844.png`, `ended-375x667.png` (replace the earlier phone ones), `idle-1440x900.png`. 08-UI-SPEC.md phone section updated.

## Known Stubs

None.

## Self-Check: PASSED (commits 38ddc88 and 2d9781d exist)
