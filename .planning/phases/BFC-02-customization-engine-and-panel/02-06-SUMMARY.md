---
phase: BFC-02-customization-engine-and-panel
plan: 06
subsystem: ui
tags: [react, vaul, radix-ui, tailwind-css-modules, next.js, use-sync-external-store]

# Dependency graph
requires:
  - phase: BFC-02-customization-engine-and-panel (02-02)
    provides: CustomizePanelBody, CustomizePanelDesktop, useCustomizeActions, CustomizeButton, customize-panel.module.css desktop rules
  - phase: BFC-02-customization-engine-and-panel (02-03)
    provides: data-edge-progress attribute on the timer's edge track/fill
  - phase: BFC-02-customization-engine-and-panel (02-04)
    provides: .bf-chrome idle-fade class on Header/Footer, bare MenuButton default
provides:
  - useMediaQuery hook (useSyncExternalStore, SSR-safe false snapshot)
  - CustomizePanelMobile: non-modal vaul bottom sheet shell with a Tab focus trap
  - Breakpoint switch in CustomizePanel.tsx between dock (>=1024px) and sheet (<1024px)
  - Mobile Customize trigger in the phone menu, replacing DarkModeToggle
  - Mobile chrome fade (header/footer/edge progress) while the sheet is open
affects: [BFC-02-07 (timer rise/scale above the mobile sheet, same wave), BFC-02-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useSyncExternalStore-based media query hook for SSR-safe breakpoint switches"
    - "vaul Drawer.Content/Handle/Title used directly instead of the packages/ui DrawerContent wrapper when a non-modal, scrim-less sheet is required"
    - "Manual Tab-key focus trap (querySelectorAll + offsetParent check) scoped to a single shell, not applied to the whole app"

key-files:
  created:
    - apps/next/src/hooks/useMediaQuery.ts
    - apps/next/src/components/customize/CustomizePanelMobile.tsx
  modified:
    - apps/next/src/components/customize/CustomizePanel.tsx
    - apps/next/src/components/customize/customize-panel.module.css
    - apps/next/src/components/settings/MenuSettingsMobile.tsx
    - apps/next/src/components/settings/MenuSettings.tsx
    - packages/ui/src/globals.css
  deleted:
    - apps/next/src/components/DarkModeToggle.tsx

key-decisions:
  - "Built the sheet on vaul's Drawer.Content/Handle/Title primitives directly rather than packages/ui's DrawerContent, because DrawerContent hard-codes a bg-black/80 overlay, a border and its own handle - all forbidden by D-11/D-20's no-scrim, no-border contract"
  - "Radix Dialog's dev-only missing-Title warning is satisfied with an aria-hidden, sr-only DrawerPrimitive.Title (asChild) rather than a visible second heading, so the panel keeps a single accessible name"
  - "The mobile Tab-trap is implemented as a plain onKeyDown handler over a live querySelectorAll of the shell content, not a third-party focus-trap library, since the requirement is confined to one shell"

patterns-established:
  - "useMediaQuery('(min-width: 1024px)') is the single source of truth for the dock/sheet breakpoint; the same 1023.98px boundary is duplicated as a raw media query in globals.css because CSS cannot read a React hook's state, with a comment cross-referencing the two"

requirements-completed: [UX-04, UX-05, UX-06]

# Metrics
duration: 40min
completed: 2026-09-27
---

# Phase 02 Plan 06: Mobile Sheet Shell and Breakpoint Switch Summary

**Non-modal vaul bottom sheet (60dvh, no scrim, 34px top feather) that swaps in for the desktop dock below 1024px, wired to a new mobile Customize trigger with a confined Tab focus trap and synchronized chrome fade.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-09-27
- **Tasks:** 2
- **Files modified:** 8 (2 created, 5 modified, 1 deleted)

## Accomplishments

- `useMediaQuery` hook (React `useSyncExternalStore`) drives a clean breakpoint switch in `CustomizePanel.tsx` between the existing desktop dock and the new mobile sheet, with no SSR/CSR flash (server snapshot is always `false`).
- `CustomizePanelMobile` renders a fully non-modal, scrim-less vaul sheet sharing `CustomizePanelBody` with the desktop dock, so every control, the Reset/Cancel/Apply footer, and the live dashboard preview behave identically on both shells.
- A manual Tab focus trap keeps keyboard users inside the open sheet (wrapping both directions) without making anything outside `inert`, matching the "confined on mobile, not on desktop" split in the Accessibility Contract.
- `customize-panel.module.css` now shares its fixed/border/blur/backdrop-filter base between `.dock` and a new `.sheet`, with the sheet's own 60dvh height, 34px/64px top feather, 48px mask band, 40x5px grab handle, mobile paddings, and matched `.45s` motion timing (transcribed from `.m[data-dir="D"]` on the design board).
- The phone menu's dark-mode toggle is gone; `CustomizeButton` takes its place (D-07), and `DarkModeToggle.tsx` is deleted with no remaining references.
- Opening the panel below 1024px now fades the header/footer chrome and the edge-progress track/fill to `opacity: 0` via a new globals.css rule scoped to the same breakpoint as the shell switch.

## Task Commits

1. **Task 1: Mobile sheet shell and breakpoint switch** - `b21c44a` (feat)
2. **Task 2: Mobile trigger, DarkModeToggle removal, mobile chrome fade** - `c1afcd7` (feat)

**Plan metadata:** (this commit) - docs: complete plan

## Files Created/Modified

- `apps/next/src/hooks/useMediaQuery.ts` - SSR-safe media query hook built on `useSyncExternalStore`
- `apps/next/src/components/customize/CustomizePanelMobile.tsx` - non-modal vaul sheet shell, Tab focus trap, hidden Radix Title
- `apps/next/src/components/customize/CustomizePanel.tsx` - renders dock or sheet based on `useMediaQuery('(min-width: 1024px)')`; focus-to-heading effect now re-runs on shell swap
- `apps/next/src/components/customize/customize-panel.module.css` - shared `.panel`/`.panel::before` base, `.dock` and `.sheet` geometry, sheet-scoped paddings, reduced-motion rule for the sheet
- `apps/next/src/components/settings/MenuSettingsMobile.tsx` - `<CustomizeButton />` replaces `<DarkModeToggle />`
- `apps/next/src/components/settings/MenuSettings.tsx` - removed the stale commented-out `<DarkModeToggle />` line
- `packages/ui/src/globals.css` - `@media (max-width: 1023.98px)` chrome-fade rule for `html[data-panel='open']`
- `apps/next/src/components/DarkModeToggle.tsx` - deleted (light theme deferred; AccountButton's Light/Dark item is untouched, flagged to the owner)

## Decisions Made

- Used vaul's `Drawer.Content`/`Handle`/`Title` directly instead of the shared `packages/ui/src/components/ui/drawer.tsx` `DrawerContent`, because that wrapper always renders an overlay, a border and its own handle - each forbidden by D-11 (no scrim) and D-20 (no border, custom handle styling). This is a documented deviation from the UI-SPEC's generic "use drawer.tsx" pointer, not from any locked design value.
- Satisfied Radix Dialog's dev warning about a missing Title with an `aria-hidden`, `sr-only` `DrawerPrimitive.Title asChild` rather than adding a second visible heading, keeping "Customize" as the single accessible name (marked with a `// ponytail:` comment explaining why).
- Kept the focus trap as a small local `onKeyDown` handler instead of pulling in a focus-trap dependency, since the scope is a single already-known DOM subtree.

## Deviations from Plan

None beyond the one explicitly called out and pre-authorized by the plan itself (vaul primitives instead of `packages/ui` `DrawerContent` - see Decisions above, and it is exactly what the plan's `<action>` block instructed).

## Issues Encountered

- `agent-browser click @ref` occasionally missed the Apply button's actual click target during the walkthrough (the store stayed dirty after a "successful" click). Dispatching `.click()` on the matched DOM node directly confirmed the app itself works correctly (single toast, look kept) - this was a coordinate-mapping quirk in the browser-automation tool on this page, not a product bug, and required no code change.

## User Setup Required

None - no external service configuration required.

## Mobile/Desktop Walkthrough (agent-browser, dev server on :3100)

All 8 steps from the plan passed:

1. 390x844: tapping Customize in the mobile menu opens the sheet with no scrim, dashboard undimmed above it, header/footer/edge chrome faded, focus lands on the "Customize" heading. Screenshot: `mobile-sheet-open.png`.
2. Tab cycles Close -> Theme chip -> tab panel region -> Cancel (Reset/Apply are legitimately `disabled` while not dirty) and wraps both directions via Shift+Tab; the dashboard iframes/buttons were never reached.
3. Picking "Moss" in Background re-tints the dashboard and the sheet surface live; all five section chips fit inside 390px with no overflow or wrapping. Screenshot: `mobile-moss.png`.
4. Dragging the vaul handle down (`mouse down` + stepped `mouse move` + `mouse up`) closed the sheet, snapped the look back to default, showed exactly one "Changes discarded" toast, and returned focus to the mobile Customize button. Screenshot: `mobile-after-dismiss.png`.
5. Reopening and visiting all five sections (Theme, Background, Type, Color, Style) worked; footer buttons measured 40px tall; Apply kept the picked "Stone" background with one "Look applied" toast. Screenshots: `mobile-after-apply3.png`.
6. 800x900: the desktop-width menu (Customize + Sign In) is visible, but the panel still renders `.sheet` (not `.dock`) since 800 < 1024; Esc discarded a dirty preview with exactly one toast (an Esc with no dirty state correctly produced zero toasts).
7. 1440x900: the desktop dock renders unchanged (right-side feathered `.dock`, 520px width, same layout as prior plans). Screenshot: `desktop-1440.png`.
8. `agent-browser console` and `agent-browser errors` showed no Radix title/description warnings and no hydration errors across the entire session.
9. (Bonus, not in the 8 steps but in the hard rules) confirmed exactly 1024px wide renders `.dock`, not `.sheet`.

Screenshots saved to the session scratchpad: `mobile-before.png`, `mobile-sheet-open.png`, `mobile-moss.png`, `mobile-after-dismiss.png`, `mobile-after-apply.png`/`2`/`3`, `desktop-1440.png`.

## Next Phase Readiness

- The mobile shell and breakpoint switch are in place for 02-07 (same wave) to add the timer rise/scale above the sheet - `CustomizePanel.tsx` and `customize-panel.module.css` are stable integration points, no further changes anticipated there for this plan's scope.
- No blockers.

---
*Phase: BFC-02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

- FOUND: apps/next/src/hooks/useMediaQuery.ts
- FOUND: apps/next/src/components/customize/CustomizePanelMobile.tsx
- FOUND: commit b21c44a
- FOUND: commit c1afcd7
