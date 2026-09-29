---
phase: 02-customization-engine-and-panel
plan: 05
subsystem: ui
tags: [react, zustand, css-modules, biome, customize-panel]

requires:
  - phase: 02-02
    provides: Feathered dock panel shell, tab registry pattern, native-input controls kit
  - phase: 02-03
    provides: ThemeSection pattern, CSS custom property token pipeline
  - phase: 02-04
    provides: BackgroundSection pattern, live-preview wiring conventions
provides:
  - TypeSection (4 font pick cards previewing "17:42")
  - ColorSection (12 accent swatches, custom color field, text contrast slider)
  - StyleSection (Progress segmented control, Density segmented control, Grain slider)
  - Full 5-section CUSTOMIZE_SECTIONS registry in locked order (Theme, Background, Type, Color, Style)
affects: [02-06]

tech-stack:
  added: []
  patterns:
    - "SegmentedControl/PickCard/SwatchGroup consumed identically across sections - no new control primitives needed for this plan"
    - "CSS class-per-element instead of bare descendant selectors to avoid Biome noDescendingSpecificity across sibling component groups"

key-files:
  created:
    - apps/next/src/components/customize/sections/TypeSection.tsx
    - apps/next/src/components/customize/sections/ColorSection.tsx
    - apps/next/src/components/customize/sections/StyleSection.tsx
  modified:
    - apps/next/src/components/customize/sections/index.ts
    - apps/next/src/components/customize/controls.tsx
    - apps/next/src/components/customize/customize-panel.module.css

key-decisions:
  - "Wrapped both Style segmented controls (Progress, Density) in ControlGroup with visible labels, matching D-14's 'every control is labelled' requirement, rather than relying on the sr-only legend alone"
  - "Fixed pre-existing noDescendingSpecificity warning by giving swatch dots and segmented labels dedicated classes (.swDot, .segLabel) instead of bare span selectors, removing the cross-component-group specificity collision"
  - "Fixed dock::before z-index (auto -> -1) so the panel's own header/tabs/body/foot content, which is non-positioned in-flow, always paints above the absolutely-positioned blur pseudo-element instead of being caught in its backdrop-filter"

requirements-completed: [CTL-04, CTL-05, CTL-06, CTL-07, CTL-08, CTL-09, UX-03]

duration: ~45min
completed: 2026-09-27
---

# Phase 02 Plan 05: Type, Color, Style Sections Summary

**Completed the 5-section customize panel (Type font picker, Color accent/contrast, Style progress/density/grain), all live-previewing via `useCustomizeStore`, plus a real CSS stacking-order bug fix that was blurring the panel's own heading text.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-09-27
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- Type section: 4 font pick cards, each rendering "17:42" in its own face (Inter Tight, Editorial serif, Mono, Display sans), live-swapping `--font-display` on selection.
- Color section: 12 accent swatches + custom color input + text contrast slider (55-100%), live-updating `--user-accent` and `--text-contrast`.
- Style section: Progress segmented control (Edge/Ruler/Ink/None), Density segmented control (Compact/Comfortable/Roomy), Grain slider (0-100%), live-updating `data-progress`, `data-density`, `--grain-opacity`.
- Registry wired to all 5 sections in locked D-13 order: Theme, Background, Type, Color, Style.
- Fixed a real visual bug: the "Customize" heading's first letter was rendering blurred/faded due to a CSS stacking-order defect in the feathered-dock `::before` blur overlay.
- Fixed a pre-existing Biome `noDescendingSpecificity` lint warning without suppression comments.

## Task Commits

1. **Task 1: Type and Color sections** - `d703343` (feat)
2. **Task 2: Style section, registry, panel fixes** - `2a61318` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `apps/next/src/components/customize/sections/TypeSection.tsx` - 4 font pick cards, "17:42" sample per face
- `apps/next/src/components/customize/sections/ColorSection.tsx` - accent swatches, custom color field, contrast slider
- `apps/next/src/components/customize/sections/StyleSection.tsx` - progress/density segmented controls, grain slider
- `apps/next/src/components/customize/sections/index.ts` - full 5-section `CUSTOMIZE_SECTIONS` registry
- `apps/next/src/components/customize/controls.tsx` - `.swDot`/`.segLabel` classes on swatch dot and segmented label spans
- `apps/next/src/components/customize/customize-panel.module.css` - specificity fix selectors, `.dock::before` `z-index: -1` fix

## Decisions Made
- **ControlGroup wrapping for segmented controls**: Progress and Density SegmentedControls are wrapped in `ControlGroup` with visible labels ("Progress", "Density") rather than left bare with only an sr-only legend, matching D-14 ("every control is labelled") and the visual pattern of the other sections' groups.
- **Specificity fix approach**: rather than reordering CSS blocks (which just moves the collision), gave the previously-bare `span` elements inside `.sw` and `.segItem` their own classes (`.swDot`, `.segLabel`) so Biome's cross-group specificity comparison no longer applies.
- **Heading fade fix approach**: root-caused to CSS paint order, not the intentional 150px blur-ramp width from D-20. `.dock::before` is `position: absolute` with `z-index: auto`, which (per CSS 2.1 stacking rules) paints in the "positioned descendants, stack level 0" layer - after the "non-positioned in-flow descendants" layer that `.head`/`.tabs`/`.body`/`.foot` belong to. That means the blur pseudo-element was compositing on top of the heading text wherever their 30px overlap zone fell (dock-local x 120-150px), and `backdrop-filter` sampled + blurred the heading pixels beneath it. Setting `z-index: -1` on `.dock::before` moves it into the "negative stack level" layer, which paints before (below) `.head` and the rest of the dock's real content, while remaining above `.dock`'s own background (both still inside `.dock`'s existing `position: fixed` stacking context). The 150px width and mask gradient from D-20 are otherwise untouched - the fix only corrects paint order, not geometry.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed noDescendingSpecificity lint warning pre-existing from plan 02-02**
- **Found during:** Task 2 (pre-commit check per hard_rules)
- **Issue:** `.sw input:checked + span` (specificity 0,2,2) appeared before `.segItem span` (specificity 0,1,1) in the CSS file; Biome flagged the later, lower-specificity selector sharing the same bare-`span` trailing compound.
- **Fix:** Added `.swDot` and `.segLabel` classes to the underlying spans in `controls.tsx`, updated all corresponding selectors in `customize-panel.module.css` to target the classes instead of bare `span`, eliminating the cross-group collision entirely.
- **Files modified:** `controls.tsx`, `customize-panel.module.css`
- **Verification:** `bun run check` warning count went from 1 to 0.
- **Committed in:** `2a61318`

**2. [Rule 1 - Bug] Fixed Customize heading text rendering blurred/faded**
- **Found during:** Task 2 (hard_rules-flagged visual investigation)
- **Issue:** `.dock::before`'s backdrop-blur pseudo-element painted on top of (not behind) the panel's own heading due to CSS positioned-vs-non-positioned paint order, causing the first ~30px of the "Customize" heading (the "C") to visibly blur/fade.
- **Fix:** Set `z-index: -1` on `.dock::before` to correct its paint order relative to the dock's real content while keeping it inside the existing `.dock` stacking context.
- **Files modified:** `customize-panel.module.css`
- **Verification:** `document.elementFromPoint()` at the "C" glyph's coordinates now returns the `<h2>` itself (was previously occluded); `getComputedStyle` on the heading shows `filter: none`; screenshot confirms crisp, undimmed heading text.
- **Committed in:** `2a61318`

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs, both explicitly called out for investigation in the plan's hard_rules)
**Impact on plan:** Both fixes were flagged for investigation by the orchestrator itself; no scope creep beyond what was requested.

## Issues Encountered
None beyond the two deviations above.

## Walkthrough Verification (Task 2, 7 steps)

Performed live in `agent-browser` against the dev server at `http://localhost:3100/guest`, viewport 1440x900:

1. Opened panel, confirmed 5 tabs in order Theme/Background/Type/Color/Style (`step1-theme-open.png`).
2. Type tab: selected Editorial serif font card, confirmed `--font-display` and timer face update live (`step2-type-editorial.png`).
3. Color tab: selected an accent swatch, confirmed `--user-accent`, progress ring, and Customize icon `<svg>` all recolor live (`step3-color-accent.png`); dragged contrast slider, confirmed `--text-contrast` and digit dimming update live (`step3-color-contrast.png`).
4. Style tab: cycled Progress (Edge/Ruler/Ink/None), Density (Compact/Comfortable/Roomy), and Grain slider, confirmed `data-progress`, `data-density`, `--grain-opacity` all update live on `document.documentElement` (`step4-style.png`).
5. Clicked Cancel: confirmed all previewed changes revert, "Changes discarded" toast shown.
6. Reopened panel, repeated a change, clicked Apply: confirmed change persists, "Look applied" toast shown.
7. Keyboard-only pass: Tab through chips, ArrowRight roving tabindex across tablist, confirmed global Space/R shortcuts are guarded (do not fire) while focus is on a radio/range/color input.

All 7 steps passed. Screenshots stored in the session scratchpad directory (not committed - ephemeral verification artifacts).

## Known Stubs
None.

## Threat Flags
None - all inputs (font id, accent hex, contrast, progress id, density id, grain) route through `lookSchema` Zod validation before touching CSS custom properties, per the existing threat model T-02-18/19/20; no new surface introduced.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 customize panel sections are complete and live-preview correctly; CTL-04 through CTL-09 and UX-03 are satisfied.
- Plan 02-06 still owns the `<1024px` bottom-sheet breakpoint switch and the timer-scale-while-panel-open behavior (`scale = min(0.72, ...)` per D-20) - confirmed out of scope here, not touched.
- The `.dock::before` z-index fix should be kept in mind by 02-06 if it touches the feathered dock's stacking/paint order for the bottom-sheet variant.

---
*Phase: 02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED
All created files found on disk; commits d703343 and 2a61318 found in git log.
