---
phase: BFC-08-focus-blocks-and-added-time
plan: 04
subsystem: timer
tags: [timer, footer, progress, a11y]
requires: [08-03]
provides:
  - state-driven footer (-1 / +1 while running or ended, aria-disabled dimming)
  - net badge, planned-end notch, hatch (Edge, Ruler) and ink line
  - one listener announcing every adjustment in [data-timer-live]
affects: [08-05]
key-files:
  modified:
    - apps/next/src/components/timer/TimerButtons.tsx
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/timer/timer-progress.module.css
requirements-completed: []
status: complete
---

# Phase 8 Plan 04: Footer adjust, badge and progress extension Summary

The footer adds and removes a minute by pointer while a block runs or has ended, the digits carry the net badge, Edge / Ruler / Ink rescale to planned + added and mark the planned end, and every adjustment is announced once in the single live region.

## Tasks

| Task | Commit | Notes |
| ---- | ------ | ----- |
| 1 Footer slots | ff1e6cf | -1 / +1 text, `aria-disabled` dimming, tooltips closed when dimmed, 44px coarse min-height |
| 2 Badge, progress, announcements | 501a1ee | `data-adjust-badge`, `--notch`, `data-extended`, `data-adjusting` (400 ms), live copy |

## Checks

- `bunx tsc --noEmit -p apps/next/tsconfig.json` and `bun run check` clean; exactly one `aria-live` in Timer.tsx; no native `disabled` in TimerButtons.tsx.
- Browser (chrome-devtools-axi, `bun run web`, /guest, desktop 1440x900x1 and `emulate 390x844x1,mobile,touch`):
  - Footer while running: `[-1, Pause, Reset, +1]` with labels "Remove 1 minute" / "Add 1 minute". Under 1:00 (00:51) `-1` has `aria-disabled=true`. At 00:00: `-1` and Play dimmed, Reset and `+1` live.
  - Badge: `+3` after three adds, `-4` after four removes (U+2212), null after reset and at idle. Live text: "Added 2 minutes" (two synchronous clicks batch), "Removed 1 minute", "Added 1 minute. Block resumed." (footer click and `=`). Reset leaves no new announcement.
  - Notch fraction 0.8929 for 25 + 3 (25/28) and 0.8333 for 25 + 5; Edge hatch starts at x=1200 of 1440 (25/30) and ends at the right edge. Ruler shows striped extension ticks and the 7px dot; Ink shows the 4px line at the planned x (about 1065, digits box 225-1225). Net negative: no notch, no hatch.
  - Focus hand-off not exercised before 08-04: with focus on `[data-ended-primary]` at 00:00, `=` resumed the block at 00:59 and moved focus to slot 4 ("Add 1 minute"). Verified.
  - `data-adjusting` present right after an adjustment, gone by 1.4 s.
  - Theme: the app hardcodes `dark` on `<html>`, so all shots are the dark theme.
- Not exercised in browser: reduced motion (CSS only), coarse-pointer 44px beyond the phone emulation (footer buttons rendered 58x44 there), positive-net ended state (needs a 5+ minute wait; negative-net ended was captured).

Screenshots (all under `/private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-1-befocus-work/319a90b8-b7ed-40a0-bfba-385aead0cf6b/scratchpad/`):

- `p04-desktop-running-edge-added5-1440.png`, `p04-desktop-running-ruler-added5-1440.png`, `p04-desktop-running-ink-added5-1440.png`
- `p04-desktop-running-footer-added5-1440.png` (footer -1 / Pause / Reset / +1, badge +5, Edge hatch)
- `p04-desktop-running-removed4-under1min-1440.png`, `p04-desktop-ended-removed4-1440.png` (badge -4, -1 and Play dimmed, +1 live)
- `p04-desktop-running-edge-added1-1440.png` is not saved; `p04-desktop-running-ruler-added1-1440.png` and `p04-desktop-running-ink-added1-1440.png` are leftovers from an idle page and should be ignored.
- `p04-phone-running-edge-added3-390.png`, `p04-phone-running-removed4-390.png`, `p04-phone-ended-removed4-390.png`

## Deviations from Plan

**1. [Rule 1 - Bug] Phone badge breathed with the digits.** On phone the badge sits inside the digits container that carries the ended breathing, so it pulsed. Added `.breatheKids` which animates every child except the badge. Desktop badge is a sibling and was never affected.

**2. Badge fade-out is instant.** Appearing fades over 160 ms (keyframe); disappearing (net back to 0, reset) is immediate because the span is unmounted. The UI-SPEC lists opacity fade both ways; judged not worth keeping a ghost element.

**3. Repeated announcements.** An identical message sent twice is not re-read by screen readers, so alternate announcements carry a trailing nbsp. Visible text is otherwise exactly the contract copy.

**4. Badge top on desktop** is `calc(50% - var(--digit-size) / 2 - 12px)` (12px above the glyph row), not `top: -12px` of the 70vh box, which would sit 15vh above the digits.

## Known Stubs

None.

## Threat Flags

None. Footer buttons only call `adjust`, dimmed buttons return early.

## Self-Check: PASSED (commits ff1e6cf and 501a1ee exist)
