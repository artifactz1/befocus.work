---
phase: BFC-02-customization-engine-and-panel
plan: 03
subsystem: ui
tags: [react, css-modules, css-custom-properties, zustand, accessibility, keyboard-shortcuts]

requires:
  - phase: BFC-02-customization-engine-and-panel
    provides: "02-01 Look/token contract (--user-accent, --fg, --font-display, --font-mono, --timer-scale, data-progress/data-density/data-panel attributes); 02-02 customize panel shell with data-customize-panel dialog"
provides:
  - "Timer counts real wall-clock seconds (double-tick bug fixed)"
  - "role=timer sr-only readout for assistive tech"
  - "TimerProgressRing deleted; Edge/Ruler/Ink/None progress designs all read one --progress custom property"
  - "Digit sizing follows --timer-scale (density); digits use font-display and text-dash"
  - "useTimerKeyboard: global Space (toggle) / R (reset) shortcuts with full guard set"
  - "useTimerStoreApi escape hatch for effects that need store.getState() without re-binding"
  - "Hints row (Space pause/start, R reset) under desktop digits, fades to 0 opacity while customize panel is open"
affects: [02-04, 02-06, 02-07]

tech-stack:
  added: []
  patterns:
    - "CSS custom property (--progress) as single source of truth for multiple visual designs, toggled by data-progress attribute on html"
    - "Two-layer clip-path overlay as fallback for background-clip:text when the styled element has no direct text nodes"
    - "Zustand vanilla store escape hatch (useXStoreApi returning the store, not selected state) for keydown listeners that must read fresh actions without re-binding on every tick"

key-files:
  created:
    - apps/next/src/components/timer/timer-progress.module.css
    - apps/next/src/hooks/useTimerKeyboard.ts
  modified:
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/store/useTimerStore.tsx
    - biome.json

key-decisions:
  - "Ink design uses a two-layer clip-path overlay instead of background-clip:text (D-16 literal wording), because .digits is a wrapper div with no text nodes of its own - background-clip:text rendered completely blank in browser verification"
  - "Added useTimerStoreApi() to useTimerStore.tsx so useTimerKeyboard can call store.getState() inside the listener; the store is React-context-scoped per request, not a module-level singleton, so the plan's literal getState() call needed this escape hatch"
  - "biome.json: added ignore: [\"global\"] to linter.rules.correctness.noUnknownPseudoClass so CSS Modules' :global() escape hatch doesn't fail bun run check, mirroring the existing noUnknownAtRules tailwind ignore"
  - "Did not add an ink overlay to the mobile digit row - mobile layout was called out in the plan as untouched, and the under/hints block (desktop only) already means mobile never shows progress hints"

patterns-established:
  - "Single --progress CSS variable drives Edge/Ruler/Ink/None; new progress designs should read the same variable rather than adding new state"
  - "useXStoreApi() naming convention for a store's raw vanilla-store escape hatch, alongside the selector-based useXStore()"

requirements-completed: [CTL-07, CTL-12, CTL-08]

duration: ~70min
completed: 2026-09-27
---

# Phase BFC-02 Plan 03: Timer Fixes, Progress Redesign, and Keyboard Shortcuts Summary

**Fixed the timer's double-tick bug, replaced TimerProgressRing with a unified --progress-driven Edge/Ruler/Ink/None system with density scaling, and added global Space/R keyboard shortcuts with hints under the digits.**

## Performance

- **Duration:** ~70 min
- **Completed:** 2026-09-27T21:40:57Z
- **Tasks:** 3
- **Files modified:** 6 (2 created, 3 modified, 1 deleted)

## Accomplishments
- Timer now counts real wall-clock seconds (was ticking too fast due to two independent decrement mechanisms running concurrently)
- `role="timer"` sr-only readout gives assistive tech an accessible countdown
- `TimerProgressRing.tsx` deleted; Edge (fixed bottom bar), Ruler (25 lit ticks), Ink (accent-tinted clip-path overlay), and None all read a single `--progress` CSS custom property set inline on the timer root
- Digit sizing scales with `--timer-scale` (density: compact/comfortable/roomy); digits use `font-display` and `.text-dash`
- Global Space (toggle) / R (reset) keyboard shortcuts work from anywhere safe, guarded against modifiers, repeats, editable targets, dialogs/menus/listboxes, and activatable controls - with an explicit exception keeping the customize panel dialog's R shortcut alive (D-12)
- Hints row ("Space pause/start", "R reset") renders under the desktop digits in JetBrains Mono at 42% foreground, fades to opacity 0 while the customize panel is open

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix double-tick bug, add sr-only readout** - `3177e39` (fix) [committed in a prior session before this summary was written; carried forward as part of this plan's scope]
2. **Task 2: Replace ring with Edge/Ruler/Ink/None via --progress; density and display font** - `85201ac` (feat)
3. **Task 3: Global Space/R keyboard shortcuts and digit hints** - `36320b6` (feat)

_Note: Task 1's commit predates this SUMMARY in the session but is part of the same plan execution; no separate commit was made for it in this session since it landed correctly in prior work._

## Files Created/Modified
- `apps/next/src/components/timer/timer-progress.module.css` - Ruler/Ink/Edge/hints styles, all conditional on `data-progress`/`data-panel` attributes on `html`
- `apps/next/src/hooks/useTimerKeyboard.ts` - Global Space/R handler with D-12 guard set
- `apps/next/src/components/timer/Timer.tsx` - Removed duplicate decrement interval and TimerProgressRing; added `--progress` root style, edge/ruler/ink markup, sr-only readout, hints content, `useTimerKeyboard()` call
- `apps/next/src/store/useTimerStore.tsx` - Added `useTimerStoreApi()` escape hatch returning the raw vanilla store
- `biome.json` - Added `:global()` to the CSS `noUnknownPseudoClass` ignore list
- `apps/next/src/components/dashboard/TimerProgressRing.tsx` - Deleted (D-16)

## Decisions Made
- Ink fallback (two-layer clip-path overlay) instead of literal `background-clip: text`, per the plan's own documented risk/fallback path - see Deviations below
- `useTimerStoreApi()` added to the store module as the cleanest way to satisfy "read via getState() so the listener never re-binds" against a context-scoped (not module-singleton) Zustand store
- No ink overlay added to the mobile digit row - kept mobile markup untouched per the plan's read-first guidance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ink design falls back to two-layer clip-path overlay instead of background-clip:text**
- **Found during:** Task 2
- **Issue:** The plan's primary ink approach (`background-clip: text` on `.digits`) renders completely blank. `.digits` is a wrapper `<div>` with no text nodes of its own - the glyphs live many levels deep inside `TimeUI.tsx`'s rolling-digit `motion.span` structure, so there is no "own text" for the wrapper to clip against. Confirmed via `getComputedStyle` (rule correctly applied) and a screenshot (digits invisible).
- **Fix:** Implemented the plan's own documented fallback: a duplicated digit markup (`DesktopDigits` helper, reused for both the base row and the overlay) mounted as an always-present `.inkOverlay` sibling, tinted with `color-mix(in srgb, var(--user-accent) 32%, transparent)`, revealed via `clip-path: inset(0 calc(100% - var(--progress) * 100%) 0 0)`, and toggled with `display: none/flex` under `data-progress='ink'`.
- **Files modified:** apps/next/src/components/timer/Timer.tsx, apps/next/src/components/timer/timer-progress.module.css
- **Verification:** `getComputedStyle` confirms `clip-path`, `color`, and conditional `display` are correctly wired for all four `data-progress` values; original approach's blank-render was screenshot-verified before building the fallback
- **Committed in:** 85201ac (Task 2 commit)

**2. [Rule 3 - Blocking] biome.json noUnknownPseudoClass blocked :global()**
- **Found during:** Task 2
- **Issue:** Biome's CSS linter flagged CSS Modules' `:global(...)` escape hatch as an unknown pseudo-class, blocking `bun run check`. No prior `:global()` usage existed in the repo to reference.
- **Fix:** Added `ignore: ["global"]` to `linter.rules.correctness.noUnknownPseudoClass` in biome.json, mirroring the existing `noUnknownAtRules.ignore: ["tailwind"]` pattern already in the file.
- **Files modified:** biome.json
- **Verification:** `bun run check` passes
- **Committed in:** 85201ac (Task 2 commit)

**3. [Rule 3 - Blocking] useTimerStore has no module-level getState(); added useTimerStoreApi()**
- **Found during:** Task 3
- **Issue:** The plan instructed reading actions via `useTimerStore.getState()` inside the keydown handler so the listener never re-binds on ticks. `useTimerStore` is a React-context-scoped hook wrapping a per-request `zustand/vanilla` store (`TimerStoreProvider`), not a module-level store with a `getState` static - `tsc` confirmed no such property exists.
- **Fix:** Added `useTimerStoreApi()` to `useTimerStore.tsx`, returning the raw vanilla store instance from context. `useTimerKeyboard` calls this once (a hook, so re-render-safe) and then uses `store.getState()` inside the event listener, achieving the plan's intended effect (fresh actions, no re-binding) within the actual context-based architecture.
- **Files modified:** apps/next/src/store/useTimerStore.tsx, apps/next/src/hooks/useTimerKeyboard.ts
- **Verification:** `bunx tsc --noEmit` passes; manual browser verification of Space/R behavior (see below) confirms actions are read correctly
- **Committed in:** 36320b6 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking issues, one of which was explicitly anticipated and pre-authorized by the plan's own risk/fallback language)
**Impact on plan:** All three were necessary to complete the plan's stated behavior; none constitute scope creep. The ink fallback is the plan's own documented contingency, not an unplanned addition.

## Issues Encountered

- **Double-tick bug root cause:** Two independent mechanisms (a Web Worker `onmessage` handler and a redundant `setInterval` `useEffect`) both called `decrementTime()` every second. Fixed by deleting the redundant `useEffect`, keeping only the Web Worker path (the single shared mechanism, not per-caller patches).
  - Before fix: elapsed-time ratio measurements showed the countdown running roughly 1.13-1.16x faster than wall clock across two runs (methodology note: likely inflated further by CDP-automated background-tab timer throttling interacting with the *redundant* interval, rather than a clean 2x - the two mechanisms don't fire in perfect lockstep).
  - After fix: 22 seconds of displayed countdown drop measured against 22.7 seconds of wall time - within the plan's 1-second tolerance.
- **agent-browser test-harness quirk (not an app bug):** dispatching a `KeyboardEvent` directly on `document` (as an event target) did not reach the `window`-level listener in this headless CDP session, while dispatching on `document.body` (as any real key press naturally would) worked correctly and matched expected behavior in every guard scenario tested. Real user keystrokes always target a focused element inside `document.body`, so this has no bearing on production behavior; it only affected the shape of the verification script.
- **Manual verification performed in browser at 1440x900 and 390x844:**
  - Space starts/pauses the timer without scrolling the page; R resets `timeLeft` to full duration (confirmed via the `role=timer` readout)
  - Shift+R, Meta+R, Ctrl+Space, and any modifier combination are no-ops
  - Typing "r" and Space inside a focused text input are no-ops
  - Opening the command menu (Cmd+J) and dispatching Space/R inside its `[role=dialog]` are no-ops; the timer keeps running uninterrupted
  - With the customize panel open (`[data-customize-panel][role=dialog]`): R still resets the timer (D-12 exception confirmed - reset from 24:x8 to 25:00 verified); Space dispatched on a focused `<input type=range>` inside the panel does not pause the running timer (confirmed by continued decrementing across the dispatch)
  - Hints computed `opacity` is `"0"` while `data-panel="open"`, and `"1"` after closing the panel
  - At 390x844, the edge progress bar's computed `display` is `block` under `data-progress='edge'`

## Next Phase Readiness

- 02-04 (same wave) adds the `.bf-chrome` fade treatment and `aria-keyshortcuts` on the TimerButtons play/pause and reset buttons - the hints container here is already `aria-hidden`, deferring the accessible shortcut announcement to that plan as specified
- 02-07 will apply a `transform` to `[data-timer-clock]` - the edge track/fill elements were deliberately kept as siblings of that wrapper (not children) so their `position: fixed` semantics survive that future transform
- The customize panel's `data-customize-panel` attribute on its `role=dialog` element is already accounted for in `useTimerKeyboard`'s guard selector
- No blockers for downstream plans

---
*Phase: BFC-02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

All created/modified files confirmed present on disk; TimerProgressRing.tsx confirmed absent; all three task commit hashes (3177e39, 85201ac, 36320b6) confirmed in git log.
