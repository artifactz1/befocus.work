---
phase: BFC-02-customization-engine-and-panel
plan: 07
subsystem: ui
tags: [react, nextjs, timer, layout-transform, useLayoutEffect, resizeobserver]

requires:
  - phase: BFC-02-customization-engine-and-panel (02-01 through 02-06)
    provides: Look contract, catalog, CustomizePanel (desktop dock + mobile sheet), useCustomizeStore panelOpen state
provides:
  - Pure computeTimerTransform() geometry function (D-20 formula) with desktop centred/fallback branches and mobile rise-above-sheet branch
  - Timer.tsx wired to measure the real digit block and apply the transform live while the Customize panel is open
  - Roomy-density overflow fix at 1440x900 (flagged by 02-04)
affects: [02-08]

tech-stack:
  added: []
  patterns:
    - "Pure geometry function + useLayoutEffect measure/apply pattern for DOM-driven inline transforms (ResizeObserver + resize listener, cleaned up on close/unmount)"

key-files:
  created:
    - apps/next/src/lib/customize/timer-scale.ts
  modified:
    - apps/next/src/lib/customize/customize.check.ts
    - apps/next/src/components/timer/Timer.tsx

key-decisions:
  - "Timer.tsx root div changed from fixed h-[70vh] to flex-1 min-h-0 to fix Roomy-density overflow at 1440x900 (assigned deviation fix, verified across Compact/Comfortable/Roomy)"
  - "Real desktop digit width (measured live, ~1038px at 1440x900) is larger than the plan's illustrative test value (838px), because Timer.tsx sizes desktop digits from 25vw (not vh) unless useIsMobileLandscape fires (small-mobile-landscape only). This makes 1440x900 legitimately take the narrow-desktop fallback branch instead of the UI-SPEC's illustrative ~0.42 centred reference. UX-05 (never under the feather/controls) still holds - out of scope to change 02-03's font-sizing, so documented as a deviation rather than 'fixed'"

requirements-completed: [UX-05]

duration: 90min
completed: 2026-09-27
---

# Phase BFC-02 Plan 07: Timer D-20 Transform Summary

**Pure D-20 geometry function wired into Timer.tsx via useLayoutEffect + ResizeObserver, scaling/translating the real timer digits live while the Customize panel is open, with a fixed Roomy-density overflow bug along the way**

## Performance

- **Duration:** ~90 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `computeTimerTransform()` in `apps/next/src/lib/customize/timer-scale.ts` implements the full D-20 geometry contract: desktop centred scale, narrow-desktop fallback (translate left of the feather, capped at 0.72), and mobile rise-above-sheet, with a `MIN_SCALE=0.2` floor and identity when closed/unmeasured.
- TDD RED then GREEN cycle: 9 assertions added to `customize.check.ts` covering closed panel, all 5 contract viewports, zero-width/zero-height edge cases, and a tiny-viewport floor case. All pass (`bun run src/lib/customize/customize.check.ts` -> `customize.check OK`).
- `Timer.tsx` measures the visible `[data-timer-digits]` block on `panelOpen` change, applies `translate()/scale()` to `[data-timer-clock]` with a 450ms cubic-bezier transition (`motion-reduce:transition-none`), and re-measures on window resize + ResizeObserver, cleaning both up when the panel closes or on unmount.
- Fixed the Roomy-density overflow bug (flagged by 02-04): root wrapper `h-[70vh]` -> `flex-1 min-h-0`, verified no overflow at 1440x900 across Compact/Comfortable/Roomy (`document.documentElement.scrollHeight === innerHeight === 900` in all three).

## Task Commits

1. **Task 1a: RED - failing timer-scale assertions** - `3414ea2` (test)
2. **Task 1b: GREEN - computeTimerTransform implementation** - `77b6e6c` (feat)
3. **Task 2: wire transform into Timer.tsx + Roomy overflow fix** - `1fd7e79` (feat)

**Plan metadata:** (final commit, see below)

## Files Created/Modified

- `apps/next/src/lib/customize/timer-scale.ts` - Pure `computeTimerTransform()` and D-20 constants (`DOCK_WIDTH`, `SHEET_FRACTION`, `DESKTOP_MIN_WIDTH`, `TIMER_GUTTER`, `TIMER_MAX_SCALE`, `CENTERED_MIN_SCALE`)
- `apps/next/src/lib/customize/customize.check.ts` - 9 new assertions for `computeTimerTransform` (closed, 5 viewports, 2 zero-size edge cases, 1 tiny-viewport floor case)
- `apps/next/src/components/timer/Timer.tsx` - `useLayoutEffect` measure/apply wiring (refs, ResizeObserver, resize listener), transition classes, and the `h-[70vh]` -> `flex-1 min-h-0` root fix

## Decisions Made

- See `key-decisions` in frontmatter. Both decisions are documented deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Assigned deviation - Rule 1 bug fix] Roomy-density overflow at 1440x900**
- **Found during:** Task 2 (assigned explicitly in plan instructions, not discovered independently)
- **Issue:** Timer.tsx's root wrapper used a fixed `h-[70vh]`, which combined with Header/Footer at Roomy density could overflow the `h-screen` container at 1440x900.
- **Fix:** Changed root div className from `flex h-[70vh] items-center justify-center` to `flex min-h-0 flex-1 items-center justify-center`. Verified against `app/(app)/layout` and `app/guest/page.tsx`'s shared `flex h-screen w-screen flex-col` container - Timer now consumes remaining space after Header/Footer instead of a hardcoded viewport fraction.
- **Files modified:** `apps/next/src/components/timer/Timer.tsx`
- **Verification:** `agent-browser` at 1440x900, Compact/Comfortable/Roomy densities - `document.documentElement.scrollHeight === innerHeight === 900` for all three (no overflow). Screenshots: see below.
- **Committed in:** `1fd7e79`

### Notes (not a code fix - documented for the owner)

**2. Real 1440x900 desktop behavior takes the narrow-desktop fallback branch, not the UI-SPEC's illustrative ~0.42 centred reference**
- **Found during:** Task 2 browser verification at 1440x900
- **What happened:** The UI-SPEC's confirmed reference point says "~0.42 centred" at 1440x900 using an illustrative `timerW=838`. The real `[data-timer-digits]` block, measured live with the panel open, is `offsetWidth=1038` at that viewport (desktop digits are sized from `25vw`, not viewport height, except on small-mobile-landscape per `useIsMobileLandscape` - which never fires on a real 1440x900 desktop). Plugging the real width into the D-20 formula gives `centered ~= 0.339`, which is below `CENTERED_MIN_SCALE=0.4`, so the code correctly takes the fallback branch: `tx=-260, scale=0.72` (measured live: `centerX=460`, `rect.width/offsetWidth=0.72`).
- **Why not fixed:** The formula and constants are the locked D-20 contract and are implemented exactly as specified (verified by the passing pure-function tests using the plan's own illustrative numbers). The gap is between the plan's illustrative test value and this codebase's real (larger) digit rendering width, which comes from 02-03's `25vw` font-sizing - explicitly out of scope for this plan ("do not touch anything else 02-03 built").
- **Functional impact:** None on UX-05 - the actual requirement ("the timer is never under the feather or the controls column") is satisfied either way: at 1440x900 `rect.right=833.79 <= featherStart=920`. The only divergence is cosmetic (off-center + capped at 0.72 instead of centred at ~0.42).
- **Flag for owner:** If the ~0.42-centred cosmetic target at 1440x900 matters, either lower `CENTERED_MIN_SCALE` or change desktop digit sizing to be vh-based (a 02-03-scope change) - a future plan decision, not this one's.

---

**Total deviations:** 1 auto-fixed (Rule 1, assigned), 1 documented note (design-vs-real-DOM divergence, no code change)
**Impact on plan:** No scope creep - the fallback branch is functioning exactly as the locked D-20 formula specifies given real inputs.

## Issues Encountered

- `agent-browser eval` requires `--json` before the subcommand and a parenthesized IIFE expression (not `--stdin` heredoc, which silently returned `{}` this session) - all measurements below used the working form.
- The customize panel's "Customize" trigger button does not toggle closed on a second click in this UI; closing requires `Escape` (matches `CustomizePanel.tsx`'s `discard()` on Escape) - used for the glide-back verification.

## Verification Results (agent-browser, http://localhost:3100/guest)

All rects measured live with the panel open, transform applied via the real `useLayoutEffect`:

| Viewport | Branch | tx | ty | scale | rect.right vs featherStart | Screenshot |
|---|---|---|---|---|---|---|
| 1440x900 | fallback | -260 | 0 | 0.72 | 833.79 <= 920 | `1440x900-open.png` |
| 1920x1080 | centred | 0 | 0 | 0.6055 | 1375.94 <= 1400 | `1920x1080-open.png` |
| 1024x640 | fallback | -260 | 0 | 0.72 | 456.73 <= 504 | `1024x640-open.png` |
| 1280x800 | fallback | -260 | 0 | 0.72 | 713.54 <= 760 | `1280x800-open.png` |
| 390x844 (mobile) | rise-above-sheet | 0 | -277.9 | 0.72 | rect.bottom=295.16 <= sheet top 337.6 | `390x844-open.png` |

Screenshots saved to `/private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-2-befocus-work/0d0aa5bf-0ecf-4d58-985c-dc512d54dd15/scratchpad/02-07/` (session scratchpad, not committed - ephemeral verification evidence per plan's output spec).

Additional checks, all passing:
- **Panel-close glide-back** (1440x900): closing via Escape clears the inline `transform` (identity), CSS transition handles the glide back over 450ms.
- **Reduced motion**: with `prefers-reduced-motion: reduce` emulated, `getComputedStyle(clock).transitionProperty === 'none'` (Tailwind's `motion-reduce:transition-none` applied) - transform still jumps to the correct value instantly.
- **Live resize while open** (1440x900 -> 1920x1080, panel stays open): transform recomputes via the resize listener/ResizeObserver, moving from the fallback branch (`tx=-260, scale=0.72`) to the centred branch (`tx=0, scale=0.6055`) as the feather headroom grows - no stale/stuck transform.
- **Density overflow fix** (1440x900, panel closed): Compact, Comfortable, Roomy all measure `document.documentElement.scrollHeight === innerHeight === 900` - no overflow at any density. Screenshots: `1440x900-compact.png`, `1440x900-comfortable.png`, `1440x900-roomy.png`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Timer transform wiring is complete and verified end-to-end at all 5 contract viewports plus close/reduced-motion/resize/density edge cases.
- Owner should decide whether the 1440x900 fallback-vs-centred cosmetic divergence (see Deviations note 2) needs a follow-up plan touching 02-03's digit font-sizing, or whether the fallback behavior is acceptable as-is (UX-05 itself is satisfied either way).
- No blockers for 02-08.

---
*Phase: BFC-02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

- FOUND: apps/next/src/lib/customize/timer-scale.ts
- FOUND: .planning/phases/BFC-02-customization-engine-and-panel/02-07-SUMMARY.md
- FOUND commits: 3414ea2, 77b6e6c, 1fd7e79
