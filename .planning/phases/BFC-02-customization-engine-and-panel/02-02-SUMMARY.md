---
phase: BFC-02-customization-engine-and-panel
plan: 02
subsystem: ui
tags: [react, nextjs, framer-motion, radix-tabs, zustand, css-modules, sonner]

# Dependency graph
requires:
  - phase: BFC-02-customization-engine-and-panel/02-01
    provides: useCustomizeStore (active/preview/persisted look state, panelOpen, openPanel/setPreview/apply/cancel/resetPreview), CSS custom-property painting effect, DEFAULT_LOOK, catalog (SOLIDS)
provides:
  - Direction D "Feathered dock" CSS module (520px right aside, 120px feather, 10px backdrop blur, bf-in/bf-ping keyframes, reduced-motion overrides)
  - controls.tsx presentational kit (ControlGroup, SwatchGroup, ColorField, RangeField, SegmentedControl, PickCard, Hint) built on native radio/color/range inputs
  - CUSTOMIZE_SECTIONS registry with Theme and Background sections wired to setPreview
  - Shared CustomizePanelBody (header, Radix Tabs section switcher, Reset/Cancel/Apply footer)
  - useCustomizeActions hook (open/apply/discard/toggle) with sonner toasts
  - CustomizePanelDesktop (framer-motion dialog shell, role=dialog aria-modal=false) and CustomizePanel (focus management, Esc, route-change discard)
  - CustomizeButton trigger wired into MenuSettings, panel mounted in both (app) and guest layouts
affects: [BFC-02-customization-engine-and-panel/02-05, BFC-02-customization-engine-and-panel/02-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Radix primitive + CSS module coexistence: pass twMerge-conflicting Tailwind reset strings (e.g. bg-transparent, rounded-none) ahead of the CSS module class so twMerge dedupes the primitive's own utility classes and the module's plain CSS wins"
    - "Ping-once dirty indicator: a useRef tracks whether the dot has already pinged this open, reset to false when isDirty goes false, so data-ping only fires on the first false-to-true transition"
    - "Focus-return-by-attribute: on close, focus the first visible [data-customize-trigger] element (offsetParent check) rather than trusting document.activeElement, since Safari does not focus buttons on click"

key-files:
  created:
    - apps/next/src/components/customize/controls.tsx
    - apps/next/src/components/customize/customize-panel.module.css
    - apps/next/src/components/customize/sections/index.ts
    - apps/next/src/components/customize/sections/ThemeSection.tsx
    - apps/next/src/components/customize/sections/BackgroundSection.tsx
    - apps/next/src/components/customize/useCustomizeActions.ts
    - apps/next/src/components/customize/CustomizePanelBody.tsx
    - apps/next/src/components/customize/CustomizePanelDesktop.tsx
    - apps/next/src/components/customize/CustomizePanel.tsx
    - apps/next/src/components/customize/CustomizeButton.tsx
  modified:
    - apps/next/src/components/settings/MenuSettings.tsx
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/app/guest/layout.tsx

key-decisions:
  - "Used twMerge-conflicting reset utility strings (LIST_RESET, TAB_RESET) to force the CSS module's D-20 styling over Radix Tabs' default Tailwind classes, since both apply equal-specificity styling and cascade order is unpredictable"
  - "CustomizePanelBody keeps its own local useState<CustomizeSectionId>('theme') rather than indexing CUSTOMIZE_SECTIONS[0].id, avoiding a TS possibly-undefined error under noUncheckedIndexedAccess"

requirements-completed: [UX-01, UX-02, UX-03, UX-06, ENG-02, ENG-04, CTL-01, CTL-02, CTL-03, CTL-10]

# Metrics
duration: 28min
completed: 2026-09-27
---

# Phase BFC-02 Plan 02: Customize Panel Shell and Live Background Preview Summary

**Feathered-dock customize panel (Direction D) wired end-to-end: Theme/Background sections live-preview onto the dashboard via CSS custom properties, with Apply/Cancel/Reset/Esc/route-change all funneling through one useCustomizeActions hook and sonner toasts.**

## Performance

- **Duration:** 28 min (commit span; includes an unplanned dev-server cache repair)
- **Started:** 2026-09-27T13:40:33-07:00
- **Completed:** 2026-09-27T14:08:57-07:00
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments
- Direction D "Feathered dock" CSS module transcribed pixel-exact from the UI spec (520px width, 120px feather, 10px backdrop blur, bf-in/bf-ping keyframes, reduced-motion overrides) and verified visually against the Lavish board at 1440x900
- Theme and Background sections are live: picking a swatch, custom color, overlay tint/opacity or blur updates the dashboard on the same frame, before Apply
- Full open/apply/discard/reset/Esc/route-change flow implemented in one useCustomizeActions hook, verified end-to-end in a real browser walkthrough (all 8 steps)
- Customize trigger wired into the desktop menu and the panel mounted in both the authenticated dashboard and guest layouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Controls kit, dock CSS module, section registry, Theme and Background sections** - `8721881` (feat)
2. **Task 2: Shared body, desktop dock shell and the open/apply/discard flow** - `58626c1` (feat)
3. **Task 3: Customize trigger in the desktop menu, panel mounted on both dashboards, browser walkthrough** - `52781e3` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified
- `apps/next/src/components/customize/controls.tsx` - Native-input presentational kit (ControlGroup, SwatchGroup, ColorField, RangeField, SegmentedControl, PickCard, Hint)
- `apps/next/src/components/customize/customize-panel.module.css` - Direction D "Feathered dock" surface, feather blur, groups, chips, swatches, segmented control, pick cards, bf-in/bf-ping animations, reduced-motion overrides
- `apps/next/src/components/customize/sections/index.ts` - `CUSTOMIZE_SECTIONS` registry (theme, background, with type/color/style ids reserved for plan 02-05)
- `apps/next/src/components/customize/sections/ThemeSection.tsx` - Current-look row and "arrives later" placeholder
- `apps/next/src/components/customize/sections/BackgroundSection.tsx` - Swatches, custom color, overlay tint/opacity, blur, all writing `setPreview`
- `apps/next/src/components/customize/useCustomizeActions.ts` - `{ open, apply, discard, toggle }` hook with sonner toasts
- `apps/next/src/components/customize/CustomizePanelBody.tsx` - Shared header/tabs/footer body used by the desktop shell
- `apps/next/src/components/customize/CustomizePanelDesktop.tsx` - framer-motion `role=dialog aria-modal=false` shell
- `apps/next/src/components/customize/CustomizePanel.tsx` - Focus management, Esc, route-change discard, single mount point
- `apps/next/src/components/customize/CustomizeButton.tsx` - Palette icon trigger with tooltip, `data-customize-trigger`
- `apps/next/src/components/settings/MenuSettings.tsx` - Renders `CustomizeButton` before `AccountButton`
- `apps/next/src/app/(app)/layout.tsx` - Mounts `CustomizePanel` inside `CustomizeStoreProvider`
- `apps/next/src/app/guest/layout.tsx` - Mounts `CustomizePanel` inside `CustomizeStoreProvider`

## Decisions Made
- Used twMerge-conflicting reset strings ahead of the CSS module class names to force Radix Tabs' Tailwind defaults out of the cascade, letting the D-20 module CSS apply cleanly.
- Fixed a TypeScript `possibly undefined` error on `CUSTOMIZE_SECTIONS[0].id` by seeding local tab state with the literal `'theme'` instead of an index lookup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Repaired a corrupted shared `.next` dev cache preventing hydration**
- **Found during:** Task 3 (browser walkthrough)
- **Issue:** The shared dev server on port 3100 (started by a concurrent sibling plan in the same wave) served stale webpack-style hashed chunk filenames (`main-app-<hash>.js`) while its process was running `next dev --turbo`, which expects unhashed Turbopack chunk names. Every request for `main-app.js` / `app-pages-internals.js` / `layout.css` 404'd, so the client bundle never hydrated - the guest page rendered fully opaque-zero (stuck at `opacity: 0`), no click handlers fired, and `aria-expanded` never changed. Root cause: a sibling process had run `next build` against the shared `.next` directory, contrary to this plan's own "do not run next build (shared .next)" note, corrupting the dev-mode manifest for every plan in the wave, not just this one.
- **Fix:** Stopped the two dev-server processes (the `next dev` wrapper and `next-server`), deleted `apps/next/.next`, and restarted `bun run --cwd ./apps/next dev` (still `next dev --turbo --port 3100`, matching the package.json `dev` script, not a `next build`). Confirmed Turbopack-named chunks now return 200 and the guest page hydrates (`opacity: 1`, click handlers active).
- **Files modified:** None (build-cache only, no source changes)
- **Verification:** `getComputedStyle(document.querySelector('main')).opacity` returned `"1"`; clicking the Customize trigger toggled `aria-expanded` and `document.documentElement.data-panel` as expected; full 8-step walkthrough completed successfully afterward
- **Committed in:** N/A (no file changes; environmental repair only)

---

**Total deviations:** 1 auto-fixed (1 blocking, dev-server/build-cache repair, no source code affected)
**Impact on plan:** No scope creep - the fix restored a shared resource to the state the plan already assumed ("Reuse a dev server already answering... do not run next build"); it did not touch any plan-owned file. Sibling plans (02-03/02-04) benefit from the repair since the corruption affected the whole shared `.next` directory, not just this plan's routes.

## Issues Encountered
- The dev-server's browser tab was reset to `about:blank` twice mid-walkthrough by what appears to be concurrent `agent-browser` usage from a sibling wave plan sharing the same browser automation session. Recovered each time by reopening `http://localhost:3100/guest` and resuming from the last confirmed step; no plan work was lost.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The registry, shared body, controls kit and dock shell are all built so plan 02-05 only needs to add three more section files (Type, Color, Style) without restructuring.
- The `<1024px` bottom sheet and breakpoint switch are explicitly out of scope here and owned by plan 02-06.
- `apps/next/src/components/helper/MenuButtons.tsx`'s forced `variant='outline'` override and the stale `{/* <DarkModeToggle /> */}` comment in `MenuSettings.tsx` are left untouched, per plan note, for plan 02-04/02-06 to resolve.
- The shared dev server on port 3100 is now healthy for the remainder of the wave; any future `next build` against this checkout will corrupt it again for all concurrent plans.

---
*Phase: BFC-02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

All 14 created/modified files verified present on disk; all 3 task commit hashes (8721881, 58626c1, 52781e3) verified present in git log.
