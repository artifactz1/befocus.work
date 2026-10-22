---
phase: BFC-08-focus-blocks-and-added-time
plan: 05
subsystem: timer
tags: [timer, footer, gesture, a11y]
requires: [08-04]
provides:
  - useHoldPress (tap vs 400 ms hold, slide-to-cell)
  - AdjustTray (role=menu 1 / 5 / 10, keyboard path, hint storage helpers)
  - desktop first-run hint "+ - 1 min, hold for more"
affects: [08-09]
key-files:
  created:
    - apps/next/src/hooks/useHoldPress.ts
    - apps/next/src/components/timer/AdjustTray.tsx
    - apps/next/src/components/timer/adjust-tray.module.css
  modified:
    - apps/next/src/components/timer/TimerButtons.tsx
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/helper/MenuButtons.tsx
requirements-completed: [BLK-02]
status: complete
---

# Phase 8 Plan 05: Hold tray and keyboard path Summary

Holding -1 / +1 for 400 ms (or ArrowUp / ArrowDown on the focused button) opens a 1 / 5 / 10 tray above it; slide-release, tap on a cell, or keyboard apply the amount, taps still stack, and a desktop hint teaches it until the first tray open.

## Tasks

| Task | Commit | Notes |
| ---- | ------ | ----- |
| 1 Hook and tray | db63e71 | `setPointerCapture`, coordinate leave check, click suppression after pointer gestures, roving arrows, Escape / outside-pointerdown listeners only while open |
| 2 Footer wiring and hint | 51eb3a2 | `AdjustSlot` per side, one `openTray` state, close on status change or when the trigger dims, hint via `readAdjustHintSeen` + `befocus:adjust-hint-seen` event |

## Checks

- `bunx tsc --noEmit -p apps/next/tsconfig.json` and `bun run check` clean.
- Browser (chrome-devtools-axi, `bun run web`, /guest, 1440x900 and `emulate 390x844x1,mobile,touch`). The CLI cannot press-and-hold, so pointer gestures were dispatched as in-page `PointerEvent`s (pointerdown, 450 ms wait, pointermove, pointerup) followed by the click the browser would send; keyboard used real `press`.
  - Hint "+ -" shown while running on a fresh profile; after the first tray open `localStorage['befocus.adjustHintSeen'] === 'true'` and it stays gone after reload.
  - Two taps: badge +2 (no double apply). Hold, slide to +5, release: +5 applied (+7), tray gone, activation class on the +5 cell while hovered.
  - Remove tray at 01:22: -1 live, -5 / -10 `aria-disabled`; sliding onto a dimmed cell does not activate it. Trays at 1440: -1 at x 85-309, +1 at x 370-604; phone 390: +1 tray 137-311, -1 tray 79-253, all inside the viewport.
  - Keyboard at 04:44: ArrowUp on -1 focuses "Remove 1 minute" cell, `[null, "true", "true"]`; ArrowRight reaches dimmed cells, wraps; Enter on enabled applies and returns focus to the trigger; Enter on a dimmed cell keeps the tray open; Escape and Tab close with focus on the trigger (Tab then moves to Pause).
  - ArrowUp on +1 under 1:00, wait to 00:00: tray gone, `aria-expanded=false`, focus on "Start break" (08-03 hand-off), not `<body>`. At 00:00 the +1 tray opens with all add cells live; -1 and Play stay dimmed, no -1 tray.
  - `contextmenu` on -1 / +1 is `defaultPrevented`; no OS menu.
- Not exercised: real touch long-press on a device (OS menu suppression is `preventDefault` plus `-webkit-touch-callout: none`), reduced motion (CSS only), real pointer capture (synthetic ids cannot be captured; hook swallows that error).

Screenshots (all under `/private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-1-befocus-work/319a90b8-b7ed-40a0-bfba-385aead0cf6b/scratchpad/`):

- `p05-desktop-tray-minus-dimmed-1440.png` (-1 tray at 01:08, -5 / -10 dimmed, -1 trigger held)
- `p05-desktop-tray-plus-ended-1440.png` (+1 tray at 00:00)
- `p05-phone-tray-plus-390.png`, `p05-phone-tray-minus-390.png`

## Deviations from Plan

**1. [Rule 3 - Blocking] `MenuButton` now forwards its ref.** The tray needs the trigger node (focus return, outside-click check) and Radix `asChild` triggers also expect it; React 18 function components drop `ref`. Wrapped in `forwardRef` in `components/helper/MenuButtons.tsx`, no other change.

**2. [Rule 2] `setPointerCapture` wrapped in try/catch** so a pointer that cannot be captured does not break the press.

**3. Held look without `!important`.** Biome flags it; `button.held` (specificity 0,1,1) wins over the Tailwind utilities.

**4. Focus return on external close.** A tray removed by a status change returns focus to the trigger only if focus was inside it and ended on `<body>`; otherwise (08-03 already moved it) it is left alone.

## Known Stubs

None.

## Threat Flags

None. T-08-15 (z.boolean read), T-08-16 (fixed amounts, `adjust` bounds, inert dimmed cells) and T-08-17 (listeners only while open) are implemented as planned.

## Observations (not changed)

- The idle chrome fade can hide the footer (and the open tray inside it) after a few seconds without movement; the tray stays mounted but invisible until activity. The UI-SPEC is silent; worth a decision if it matters.

## Self-Check: PASSED (commits db63e71 and 51eb3a2 exist; dev server stopped by PID, :3000 free)
