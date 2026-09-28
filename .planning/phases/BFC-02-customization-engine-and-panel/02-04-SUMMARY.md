---
phase: 02-customization-engine-and-panel
plan: 04
subsystem: ui
tags: [nextjs, tailwind, react, design-tokens, accessibility]

requires:
  - phase: 02-01
    provides: --user-accent, --fg, --text-contrast, --pad-x/--pad-y, --timer-scale, data-density customization token contract
provides:
  - Contribution-grid session tracker (.bf-cell) driven purely by data-state attributes
  - Chrome idle-fade system (useChromeIdle hook + .bf-chrome utility + data-chrome-idle attribute)
  - Density-aware Header/Footer spacing (h-[calc(11vh+var(--pad-y))])
  - MenuButton appearance prop (bare default, outline) replacing raw shadcn variant on dashboard triggers
affects: [02-05, 02-06, 02-07, 02-08]

tech-stack:
  added: []
  patterns:
    - "data-state attribute + CSS color-mix() for grid cell theming instead of component-level conditional classes (D-03: components don't read the look)"
    - "Idle-fade via html[data-chrome-idle] CSS selector combined with :not(:has(:focus-visible)) and :not([data-panel=open]) guards, driven by a single useChromeIdle hook mounted once in Header"
    - "MenuButton wraps shadcn Button with Omit<ButtonProps, 'variant'> + appearance union prop to force every caller off raw variant strings at compile time"

key-files:
  created:
    - apps/next/src/hooks/useChromeIdle.ts
  modified:
    - apps/next/src/components/sessions/SessionsUI.tsx
    - apps/next/src/components/sessions/SessionTitleDisplay.tsx
    - apps/next/src/components/sessions/SessionMobileCount.tsx
    - apps/next/src/components/Header.tsx
    - apps/next/src/components/Footer.tsx
    - packages/ui/src/globals.css
    - apps/next/src/components/helper/MenuButtons.tsx
    - apps/next/src/components/timer/TimerButtons.tsx
    - apps/next/src/components/AccountButton.tsx
    - apps/next/src/components/to-do-list/ToDoListMobile.tsx
    - apps/next/src/components/settings/SoundSettingsMobile.tsx
    - apps/next/src/components/settings/SessionSettingsMobile.tsx
    - apps/next/src/components/settings/SoundSettings.tsx
    - apps/next/src/components/DarkModeToggle.tsx

key-decisions:
  - "useChromeIdle mounted once in Header (not a shared provider) since Header is the only component both (app) and guest pages mount"
  - "MenuButton appearance defaults to bare; TimerButtons opt into appearance='outline' to keep the transport pill visually distinct per D-19"
  - "AccountButton's Light/Dark DropdownMenuItem left untouched - full theming beyond dark mode is out of Phase 2 scope, owner flag below"
  - "Did not touch Timer.tsx's fixed h-[70vh] wrapper despite a pre-existing Roomy-density flexbox squeeze - out of this plan's files_modified scope"

requirements-completed: [CTL-11, CTL-13, CTL-08]

duration: 55min
completed: 2026-09-27
---

# Phase 2 Plan 4: Contribution grid, chrome idle-fade, bare menu buttons Summary

**Session tracker rebuilt as a borderless contribution grid, header/footer chrome fades to 0 opacity 2s into a running session, and dashboard menu buttons switched from outlined shadcn variants to a bare/outline MenuButton abstraction.**

## Performance

- **Duration:** ~55 min
- **Tasks:** 3
- **Files modified:** 15 (14 planned + 1 SessionsUI.tsx a11y fix)

## Accomplishments
- Session tracker is a `.bf-cell` contribution grid: done cells use `--user-accent`, the current cell uses accent at 45% mixed over foreground-8%, upcoming cells sit at foreground-8%, all via `data-state` attributes and `color-mix()` (no component reads the look to style itself)
- `useChromeIdle` hook sets `html[data-chrome-idle]` 2s after last pointer/key activity while a session is running; `.bf-chrome` on Header/Footer fades to opacity 0 unless the customize panel is open or a keyboard focus ring is visible
- Header/Footer height and padding now follow `--pad-y`/`--pad-x` density tokens (`h-[calc(11vh+var(--pad-y))]`) instead of a hardcoded `15vh`
- `MenuButton` gained an `appearance` prop (`'bare' | 'outline'`, default `'bare'`) and `Omit<ButtonProps, 'variant'>` to force every caller off the raw shadcn `variant` string; transport buttons in `TimerButtons` opt into `appearance='outline'` to keep their pill distinct
- Dashboard menu triggers (AccountButton, DarkModeToggle, ToDoListMobile, SoundSettingsMobile, SessionSettingsMobile) converted from `Button variant='outline'` to bare `MenuButton`
- `SoundSettings` tab list hardcoded hex (`bg-[#d0d1d0] dark:bg-[#2A2523]`) replaced with `bg-muted`

## Task Commits

Each task was committed atomically:

1. **Task 1: Contribution grid and display-font session text** - `f331a05` (feat)
2. **Task 2: Chrome fades while running, header/footer follow density** - `239e895` (feat)
3. **Fix: drop invalid aria-label on session count `<p>`** - `352b01b` (fix, Rule 1 - found during Task 3's `bun run check`, traced to Task 1's SessionsUI.tsx)
4. **Task 3: Bare menu buttons, outlined transport, token fixes** - `4e574f2` (feat)

## Files Created/Modified
- `apps/next/src/hooks/useChromeIdle.ts` - sets `data-chrome-idle` on `<html>` after 2s of no pointer/key activity during a running session
- `apps/next/src/components/sessions/SessionsUI.tsx` - contribution-grid cells via `data-state`, display-font session count
- `apps/next/src/components/sessions/SessionTitleDisplay.tsx` / `SessionMobileCount.tsx` - display-font classes, idle opacity via Framer Motion
- `apps/next/src/components/Header.tsx` / `Footer.tsx` - `bf-chrome` class, density-driven height/padding, `useChromeIdle()` call
- `packages/ui/src/globals.css` - `.bf-cell`, `.bf-chrome` utilities and idle-fade selector
- `apps/next/src/components/helper/MenuButtons.tsx` - `appearance` prop, `Omit<ButtonProps, 'variant'>`
- `apps/next/src/components/timer/TimerButtons.tsx` - `appearance='outline'`, aria-label/aria-keyshortcuts on all four transport buttons
- `apps/next/src/components/AccountButton.tsx` - bare MenuButton trigger, dead commented JSX removed
- `apps/next/src/components/to-do-list/ToDoListMobile.tsx`, `settings/SoundSettingsMobile.tsx`, `settings/SessionSettingsMobile.tsx` - drawer triggers switched from `Button variant='outline'` to bare `MenuButton`
- `apps/next/src/components/settings/SoundSettings.tsx` - `bg-muted` replaces hardcoded hex tab-list background
- `apps/next/src/components/DarkModeToggle.tsx` - bare MenuButton trigger

## Decisions Made
- `useChromeIdle` lives in Header rather than a shared context/provider - Header is the only component both `(app)` and `guest` routes mount, so no provider plumbing was needed (ponytail: skip abstraction until a second mount point exists)
- MenuButton callers updated due to the `variant` prop type removal: `TimerButtons.tsx` (x4 buttons), `AccountButton.tsx`, `DarkModeToggle.tsx`, `ToDoListMobile.tsx`, `SoundSettingsMobile.tsx`, `SessionSettingsMobile.tsx`

## Owner Flags

**AccountButton Light/Dark toggle:** the dropdown still exposes a `Light Mode`/`Dark Mode` `DropdownMenuItem` calling `next-themes`' `setTheme`. This is intentionally untouched - full light-theme support is deferred per 02-CONTEXT.md's `<deferred>` section (Phase 2 only ships dark mode); whichever future plan implements the light theme owns wiring or removing this control.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid `aria-label` on session-count `<p>`**
- **Found during:** Task 3's `bun run check` (biome lint caught it; introduced in Task 1)
- **Issue:** `lint/a11y/useAriaPropsSupportedByRole` - a `<p>` element's implicit ARIA-in-HTML role does not support `aria-label`
- **Fix:** Removed the attribute; the element's visible text (`{currentSession} / {sessions}`) already conveys the same information to screen readers
- **Files modified:** `apps/next/src/components/sessions/SessionsUI.tsx`
- **Verification:** `bun run check` passes clean afterward
- **Committed in:** `352b01b`

**2. [Rule 1 - Bug] Fixed biome format violations (arrow-fn parens, multi-line JSX collapse)**
- **Found during:** Task 3's `bun run check`
- **Issue:** `DarkModeToggle.tsx` (Task 3 edit) and `SessionsUI.tsx` (Task 1, pre-existing) failed `format:check`
- **Fix:** Ran `bunx @biomejs/biome format --write` on both files
- **Files modified:** `apps/next/src/components/DarkModeToggle.tsx`, `apps/next/src/components/sessions/SessionsUI.tsx`
- **Verification:** `bun run check` format step passes
- **Committed in:** `352b01b` (SessionsUI.tsx), `4e574f2` (DarkModeToggle.tsx)

---

**Total deviations:** 2 auto-fixed (both Rule 1, both surfaced by the verify command, not new bugs introduced beyond formatting/lint gaps in Task 1/3 output)
**Impact on plan:** No scope creep - both fixes are corrections to this plan's own output, required to pass the plan's stated verification gate.

## Issues Encountered

- Pre-existing `customize-panel.module.css:307` `lint/style/noDescendingSpecificity` warning remains in `bun run check` output. Not touched by this plan (file not in `files_modified`), not a regression from this plan's changes, and it is a warning (not an error) so it does not fail the check script. Left as-is per scope boundary.
- At Roomy density (`--pad-y: 7vh`) on a 1440x900 viewport, Header+Timer+Footer sum to 954px against a 900px non-scrolling `h-screen` container, because `Timer.tsx`'s wrapper uses a fixed `h-[70vh]` regardless of density while Header/Footer are now density-aware (this plan's Task 2 change). Default browser flexbox shrink absorbs the 54px (6vh) overflow; verified via screenshot that this produces no visible clipping or layout defect at Roomy density. Comfortable and Compact densities do not exhibit any overflow. Not fixed here because `Timer.tsx` is outside this plan's `files_modified` scope and is owned by other plans (02-03/02-07); flagged here for whichever plan next touches `Timer.tsx`'s height formula.

## Next Phase Readiness

- `.bf-cell` and `.bf-chrome` utilities and the `useChromeIdle` hook are now available for later plans to reuse for any other density/opacity-driven chrome
- `MenuButton`'s `appearance` prop is the sole path for dashboard-trigger styling going forward; any new dashboard trigger should use it instead of raw shadcn `Button variant`
- Known Roomy-density Timer height squeeze flagged above for the plan that next owns `Timer.tsx`

---
*Phase: 02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

All 13 claimed created/modified files verified present on disk. All 4 commit hashes (f331a05, 239e895, 352b01b, 4e574f2) verified present in git log.
