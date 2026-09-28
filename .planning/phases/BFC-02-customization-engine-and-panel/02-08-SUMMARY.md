---
phase: 02-customization-engine-and-panel
plan: 08

subsystem: ui
tags: [nextjs, framer-motion, radix-ui, vaul, biome, tailwind, accessibility]

requires:
  - phase: 02-01..02-07
    provides: The full customize store, panel shell (desktop dock + mobile sheet), all five
      control sections, D-20 timer transform, and their individual plan-level verifications
provides:
  - Integrated-build verification of the whole customize story (ENG-02, ENG-04, UX-05, UX-06)
    across five viewports and a full keyboard/screen-reader walkthrough
  - Root-cause fix for a real Escape-key defect in the panel's primary keyboard close path
  - Three orchestrator-requested cleanup fixes (Tailwind build warning, stray debug log, em dashes)
affects: [phase-verify-work, any future phase touching CustomizeButton.tsx or Timer.tsx]

tech-stack:
  added: []
  patterns:
    - "Radix Tooltip.Root forced closed (`open={condition ? false : undefined}`) while a sibling
      overlay is open, to pre-empt its DismissableLayer's lingering document-capture Escape listener"

key-files:
  created:
    - .planning/phases/BFC-02-customization-engine-and-panel/deferred-items.md
  modified:
    - apps/next/src/components/customize/CustomizeButton.tsx
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/timer/timer-progress.module.css
    - apps/next/src/components/SessionCompleteModal.tsx
    - apps/next/src/app/(auth)/sign-in/page.tsx

key-decisions:
  - "Root-caused the customize panel's broken Escape-to-close path to Radix Tooltip's DismissableLayer, which keeps a document-capture Escape listener mounted after the trigger is clicked/focused; fixed by forcing the tooltip closed the instant panelOpen becomes true, rather than patching the panel's own Escape handler."
  - "Left bun run check-deps deferred (documented pre-existing breakage since Phase 1); fixed the other three findings (Tailwind ambiguous-class warning, stray console.log, em dashes) on this branch per an explicit orchestrator course-correction mid-execution."
  - "Did not fix the mouse-unreachable 'click the trigger again to close' path: it is fully keyboard-reachable and correct behaviourally (verified via focus()+Enter); the only gap is that the panel's own opaque z-40 surface physically covers the trigger's screen position while open, which is the same accepted D-20 opaque-coverage tradeoff as the UI-SPEC's documented no-fade-under-panel rule. Flagged for the owner instead of raising the trigger's z-index, which would create an unreliable floating click target over live panel controls."

patterns-established:
  - "When a Radix primitive (Tooltip, Popover, DropdownMenu) shares screen space with a custom
    non-Radix overlay that has its own Escape handling, force the Radix primitive's `open` prop
    closed while the custom overlay is open to avoid DismissableLayer's global Escape interception."

requirements-completed: [ENG-02, ENG-04, UX-05, UX-06]

duration: 70min
completed: 2026-09-27
---

# Phase 02 Plan 08: Integrated Customize Panel Verification Summary

**Integrated build/lint/type/customize.check gates all green; found and root-caused a real Escape-key defect (Radix Tooltip's DismissableLayer swallowing the panel's Escape handler) via capture-phase event bisection, plus three orchestrator-requested cleanup fixes (Tailwind arbitrary-value build warning, stray debug log, em dashes) - owner visual review (Task 3) is the only remaining gap before phase close.**

## Performance

- **Duration:** ~70 min (spans a context compaction; investigation-heavy, few commits until the Escape root cause was found)
- **Completed:** 2026-09-27
- **Tasks:** 2 of 3 (Task 3 is a blocking human-verify checkpoint, intentionally not run)
- **Files modified:** 5 source files + 1 new deferred-items.md

## Accomplishments

- Ran the full integrated gate chain (`bun run --cwd apps/next build`, `bun run check`, `tsc --noEmit`, `customize.check.ts`) clean, and the full cross-plan consistency sweep from Task 1 (breakpoint literals, `--accent` write guard, em-dash scan, `setInterval` guard, stray-console-log scan) with every check passing or its one real finding fixed.
- Walked the entire ENG-02/ENG-04 live-preview-and-revert cycle at 1440x900: every one of the five sections previews live, and all four close paths (X, Esc, Cancel, route change) restore the exact pre-open snapshot with exactly one "Changes discarded" toast; Apply persists with exactly one "Look applied" toast and Reset-to-default still requires Apply.
- Verified UX-05 (timer never obstructed) at all five required viewports (1440x900, 1920x1080, 1280x800, 1024x640, 390x844), cross-checking the corrected `CENTERED_MIN_WIDTH=336` pixel threshold (02-07 commit `0f500cb`) against real centered-vs-narrow-fallback branch behaviour at each size.
- Ran the full UX-06 keyboard/screen-reader walkthrough (C1-C6): dialog naming and focus-on-open (verified by code inspection - see Known Testing-Environment Caveat), tab wrap with arrow keys, Space/R timer shortcuts correctly guarded on inputs, non-modal Tab-exit on desktop, Tab-wrap trap inside the mobile sheet, and reduced-motion instant open/close.
- Found, root-caused, and fixed a real defect: pressing Escape right after opening the panel did not close it, because Radix Tooltip's `DismissableLayer` (mounted by the `CustomizeButton` trigger's tooltip) keeps a document-capture-phase Escape listener alive after the trigger is clicked, and that listener's `preventDefault()` beat the panel's own `!event.defaultPrevented`-guarded Escape handler to the punch.
- Fixed three additional items on explicit orchestrator instruction mid-execution (originally logged as out-of-scope/deferred, then pulled back in-scope): the Tailwind ambiguous-arbitrary-value build warning in `Timer.tsx`, the stray `console.log('CHECKK', ...)` in `SessionCompleteModal.tsx`, and four em dashes in the sign-in page copy.

## Task Commits

1. **Task 1: Integrated gates and consistency sweep** - no code fix commit required; all sweep items passed on first run except the three items the orchestrator later asked to be fixed (see below). Findings recorded live in `deferred-items.md` (`df6eee8`, since superseded).
2. **Task 2: End-to-end behaviour, viewport and keyboard walkthrough** - `f0882c1` (fix: force customize tooltip closed while panel is open)

**Orchestrator-requested fixes (mid-execution course correction, Task 1 scope):**
- `944e145` - fix(02-08): move timer clock transition into CSS module (Tailwind ambiguous-class build warning)
- `1777ac0` - fix(02-08): remove stray debug console.log from SessionCompleteModal
- `2af3003` - fix(02-08): replace em dashes with plain dashes on sign-in page

**Docs commits:**
- `df6eee8` - docs(02-08): record out-of-scope findings from the integrated gate sweep
- `e1dc6dc` - docs(02-08): update deferred-items after orchestrator-requested fixes

_Note: `0e1b1a6` (docs: normalize em dashes in STATE.md) was committed at the start of this plan's Task 1, in the prior (pre-compaction) portion of this same execution session._

## Files Created/Modified

- `apps/next/src/components/customize/CustomizeButton.tsx` - Tooltip forced closed while `panelOpen` (root-cause Escape fix)
- `apps/next/src/components/timer/Timer.tsx` - clock transition classes moved to CSS module
- `apps/next/src/components/timer/timer-progress.module.css` - new `.clockTransition` rule with its own reduced-motion override
- `apps/next/src/components/SessionCompleteModal.tsx` - stray debug log removed
- `apps/next/src/app/(auth)/sign-in/page.tsx` - four em dashes replaced with plain dashes
- `.planning/phases/BFC-02-customization-engine-and-panel/deferred-items.md` - new; tracks the one remaining out-of-scope item (`check-deps`)

## Gate Outputs (Task 1)

- `bun run --cwd apps/next build`: PASS, zero warnings (after the Tailwind fix; previously two ambiguous-class warnings on `Timer.tsx`)
- `bun run check` (format + lint + organize-imports): PASS, clean on all 187 files
- `bunx tsc --noEmit -p apps/next/tsconfig.json`: PASS, no errors
- `customize.check.ts`: PASS (`customize.check OK`)
- `grep -rn "DarkModeToggle\|TimerProgressRing" apps/next/src`: no matches (pass)
- `grep -rn "'--accent'" apps/next/src/lib/customize apps/next/src/store`: no matches (pass - the look never writes ShadCN `--accent`)
- `grep -n "setInterval" apps/next/src/components/timer/Timer.tsx`: no matches (pass - the 02-03 double-tick fix holds)
- Em-dash scan (`git diff --name-only master... | xargs grep -l <em-dash>`): originally flagged `apps/next/src/app/(auth)/sign-in/page.tsx` (pre-existing content only touched by unrelated Biome 2 commits); now fixed, scan is clean
- Breakpoint/width constant consistency: `DOCK_WIDTH=520` (timer-scale.ts) matches `.dock { width: 520px }` (customize-panel.module.css); `DESKTOP_MIN_WIDTH=1024` matches the `(min-width: 1024px)` switch in `CustomizePanel.tsx` and the `1023.98px` mobile-CSS boundary in `globals.css`; `SHEET_FRACTION=0.6` matches `height: 60dvh`
- `bun run check-deps`: still fails (`check-dependency-version-consistency: command not found`, exit 127) - pre-existing since Phase 1, explicitly excluded from this phase's scope per the plan's `<interfaces>` section

## Walkthrough Pass/Fail Table (Task 2)

| Step | Description | Result |
|------|-------------|--------|
| A1 | Pre-open snapshot of `--bg-solid`, `--user-accent`, `--font-display`, `--text-contrast`, `--grain-opacity`, `data-progress`, `data-density` | PASS |
| A2 | Every section's control changes its matching var/attribute live, before Apply (Moss bg, overlay 40%, blur 10, second font, third accent, contrast 70%, Ruler, Compact, grain 30%) | PASS |
| A3 - X | Close via X button restores snapshot exactly, exactly one "Changes discarded" toast | PASS |
| A3 - Esc | Close via Escape restores snapshot exactly, exactly one toast | PASS (after fix `f0882c1`; previously blocked by the Tooltip DismissableLayer defect - see Deviations) |
| A3 - Cancel | Close via Cancel button restores snapshot exactly, exactly one toast | PASS |
| A3 - trigger again | Clicking the trigger again while open reverts and closes | PASS via keyboard (focus + Enter); mouse click cannot physically reach the trigger while the opaque panel covers its screen position - see Owner Flags |
| A3 - route change | Navigating away (e.g. to /sign-in) and back discards the pending preview | PASS |
| A3 - no-op | Closing with no changes made shows no toast | PASS |
| A4 | Apply shows exactly one "Look applied" toast; values persist across reopen; Apply is disabled at rest; Reset-to-default fills defaults and still requires Apply | PASS |
| B - 1440x900 | Timer left of `innerWidth - 520` (desktop, centered branch, centeredWidth=352) | PASS |
| B - 1920x1080 | Timer left of `innerWidth - 520` (desktop, centered branch) | PASS |
| B - 1280x800 | Timer left of `innerWidth - 520` (desktop, narrow-fallback branch, centeredWidth=192) | PASS |
| B - 1024x640 | Timer left of `innerWidth - 520` (desktop, narrow-fallback branch, centeredWidth=-64) | PASS |
| B - 390x844 | Timer above `innerHeight * 0.4` (mobile sheet, no scrim) | PASS |
| C1 | Tab to Customize, Enter opens, focus moves to heading; snapshot shows dialog "Customize", tablist "Customize sections" with 5 named tabs, named radios/sliders/buttons | PASS by code inspection (see Known Testing-Environment Caveat) |
| C2 | Arrow keys wrap across the five tabs; Space on a tab does not toggle the timer | PASS |
| C3 | Space/R reach the timer from the heading; blocked from a range or radio | PASS |
| C4 - Tab exit | Tab can leave the panel into the dashboard (non-modal) | PASS |
| C4 - Esc | Esc closes and returns focus to the Customize trigger | PASS (after fix `f0882c1`) |
| C5 | Tab wraps inside the mobile sheet at 390x844 (both directions) | PASS |
| C6 | Reduced motion: open/close functional state is instant (no stagger/ping) | PASS by code inspection + functional-state runtime check (see Known Testing-Environment Caveat) |
| D | Console/errors clean on `/` and `/guest` throughout | PASS (after removing the stray `CHECKK` log) |

## Screenshots

All under the session scratchpad `02-08/`:

- `1440x900-closed-v2.png`, `1440x900-open-v2.png` - clean, PR-ready
- `1920x1080-closed.png`, `1920x1080-open.png` - clean, PR-ready
- `1280x800-closed.png`, `1280x800-open.png` - clean, PR-ready
- `1024x640-closed.png`, `1024x640-open.png` - clean (narrow-fallback branch), secondary reference
- `390x844-closed.png`, `390x844-open.png` - clean, PR-ready
- `1440x900-closed.png`, `1440x900-open.png`, `1440x900-dirty-before-close.png` - earlier-session captures from the original pixel-suspect investigation, superseded by the `-v2` pair above
- `signin-fix-check.png`, `signin-fix-check2.png`, `guest-fix-check.png`, `guest-fix-check2.png` - ad hoc verification shots for the three orchestrator-requested fixes, not curated for the PR

**Recommended for the PR:** the six `-v2`/plain pairs at 1440x900, 1920x1080, and 390x844, plus either `1280x800` or `1024x640` for the narrow-desktop-fallback branch.

## Pixel Suspect Outcomes (carried over from the earlier 1440x900 panel-open investigation)

All four originally-flagged suspects were resolved as intentional design characteristics matching the UI-SPEC, not defects - no code changes were made for any of them:

1. **Wordmark/footer buttons covered by the opaque panel** - Intentional. The UI-SPEC's D-20 direction specifies an opaque `.dock` with no separate opacity/fade rule for elements it covers; this matches the reference board exactly.
2. **Partial element visibility through the blur feather zone** - Intentional. The feather is a directional blur gradient, not a hard edge; partial visibility of underlying content within that gradient band is the documented effect, not a clipping bug.
3. **Narrow-desktop fallback timer position at 1280x800/1024x640** - Intentional per 02-07's documented UX-05 finding: the real desktop digit width is wider than the plan's illustrative test value, so the D-20 formula correctly takes the narrow-fallback branch below ~1423px wide instead of the reference ~0.42 centered ratio.
4. **Mouse-unreachable "click the trigger again to close"** - Not a pixel defect; a click-target reachability gap, fully functional via keyboard, tied to the same accepted opaque-coverage tradeoff as suspect #1. Flagged for the owner rather than fixed (see Owner Flags below).

## Decisions Made

- Root-caused the Escape-key defect to Radix Tooltip's `DismissableLayer` rather than patching the panel's own Escape handler (which was already correctly written); fixed at the source by forcing the tooltip's `open` prop to `false` while the panel is open.
- Applied the orchestrator's mid-execution course correction to fix three items in-scope (Tailwind build warning, stray console.log, em dashes) rather than leaving them in `deferred-items.md`; `check-deps` remains the one deferred item, per the plan's explicit pre-existing-breakage carve-out.
- Left the mouse-unreachable "trigger again" close path as an owner-facing flag instead of raising the trigger's z-index above the panel, since that would create an unreliable floating click target over live panel controls that could not be fully vetted for visual overlap across all five tabs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Escape did not close the customize panel due to a lingering Radix Tooltip DismissableLayer**
- **Found during:** Task 2, step C4 (Esc-closes-and-returns-focus assertion)
- **Issue:** Clicking/focusing the Customize trigger opens its Radix `Tooltip`. The tooltip's `DismissableLayer` registers a document-capture-phase `keydown` listener for Escape that calls `preventDefault()` and stays mounted for a short window after the click. If Escape is pressed in that window, the panel's own Escape handler (`if (event.key === 'Escape' && !event.defaultPrevented) discard()`) correctly declines to act (by design, to avoid double-handling), so the panel never closes. Confirmed via capture-phase event bisection (`window`-capture showed `defaultPrevented: false`, the very next phase `document`-capture already showed `true`) and by ruling out `CustomizePanelDesktop.tsx` (confirmed to be a plain Framer Motion `motion.aside`, not a Radix Dialog/Popover) as the source.
- **Fix:** `CustomizeButton.tsx` now passes `open={panelOpen ? false : undefined}` to the `Tooltip` root, forcing it (and its `DismissableLayer`) closed the instant the panel opens.
- **Files modified:** `apps/next/src/components/customize/CustomizeButton.tsx`
- **Verification:** Re-ran the capture-phase bisection after the fix - `defaultPrevented: false` at both `window` and `document` capture; `aria-expanded` flips to `false` and focus returns to the trigger button after Escape.
- **Committed in:** `f0882c1`

**2. [Rule 2 - orchestrator-directed, originally Rule-1-adjacent] Tailwind ambiguous-arbitrary-value build warning in Timer.tsx**
- **Found during:** Task 1, integrated build gate
- **Issue:** `duration-[450ms]` and `ease-[cubic-bezier(.2,.7,.2,1)]` triggered Tailwind's ambiguous-class-vs-content warning during `next build`. Introduced in 02-07 (commit `1fd7e79`), out of this plan's original file scope; initially logged to `deferred-items.md` as out-of-scope, then the orchestrator explicitly asked for it to be fixed on this branch.
- **Fix:** Moved the transition into a new `.clockTransition` rule in `timer-progress.module.css` (matching the file's existing transition conventions and its own `prefers-reduced-motion` override), and swapped the Tailwind arbitrary-value classes for the CSS module class on the `clockRef` element in `Timer.tsx`.
- **Files modified:** `apps/next/src/components/timer/Timer.tsx`, `apps/next/src/components/timer/timer-progress.module.css`
- **Verification:** `bun run --cwd apps/next build` now completes with zero warnings; re-verified the timer renders correctly at rest via a fresh browser screenshot.
- **Committed in:** `944e145`

**3. [Rule 2 - orchestrator-directed] Stray debug console.log in SessionCompleteModal.tsx**
- **Found during:** Task 2, step D (console/errors check)
- **Issue:** `console.log('CHECKK', currentSession, sessions)` fired on every guest page load. Pre-existing since 2025-05-29, unrelated to Phase 2; initially logged to `deferred-items.md`, then the orchestrator asked for it to be fixed.
- **Fix:** Removed the line.
- **Files modified:** `apps/next/src/components/SessionCompleteModal.tsx`
- **Verification:** Re-ran `agent-browser console` on `/guest` - `CHECKK` no longer appears; only HMR/React DevTools informational logs remain.
- **Committed in:** `1777ac0`

**4. [Rule 2 - orchestrator-directed] Em dashes in sign-in page copy**
- **Found during:** Task 1, consistency sweep (em-dash scan)
- **Issue:** Four em dashes in `apps/next/src/app/(auth)/sign-in/page.tsx`, pre-existing content only touched by unrelated Biome 2 tooling commits; initially logged to `deferred-items.md` per the hard constraint to report-not-rewrite files not meaningfully touched by this phase, then the orchestrator asked for them to be fixed on this branch.
- **Fix:** Replaced all four em dashes with plain `-`.
- **Files modified:** `apps/next/src/app/(auth)/sign-in/page.tsx`
- **Verification:** Em-dash grep against the branch diff is now clean; re-ran `bun run check`, tsc, and the full build - all pass.
- **Committed in:** `2af3003`

---

**Total deviations:** 4 auto-fixed (1 Rule-1 bug with a genuine root-cause fix, 3 orchestrator-directed cleanup items that were originally scoped out and pulled back in mid-execution)
**Impact on plan:** The Escape fix is necessary for UX-06's "operable by keyboard alone" requirement and would otherwise have been a real accessibility regression at ship time. The three orchestrator-directed fixes are cosmetic/hygiene and carry no functional risk; all gates were re-verified green after each.

## Known Testing-Environment Caveat

Two sub-checks (C1's rAF-driven focus effect, and part of C6's CSS transition itself) could not be observed firing at runtime in this session, because the `agent-browser`/CDP-controlled tab is backgrounded (`document.hidden: true`, `document.visibilityState: "hidden"`), and Chromium throttles/suspends `requestAnimationFrame` entirely for hidden tabs - confirmed by monkey-patching `requestAnimationFrame`/`cancelAnimationFrame` and observing zero fires even after 500ms, including for a bare `requestAnimationFrame` call completely outside the app's code. Both were verified correct by direct code inspection instead:
- C1: `CustomizePanel.tsx`'s heading-auto-focus effect is a correctly-scoped `requestAnimationFrame(() => document.getElementById('customize-heading')?.focus())`, targeting a heading with `tabindex="-1"`.
- C6: `CustomizePanelDesktop.tsx`'s `duration = reducedMotion ? 0 : 0.45` is correctly wired via framer-motion's `useReducedMotion()` hook, and `matchMedia('(prefers-reduced-motion: reduce)').matches` was confirmed `true` in the test session; the panel's functional state (aria-expanded, heading presence) updated correctly even though the CSS opacity tween itself was visibly stalled by the same rAF-throttling.

This is a testing-environment limitation, not an application defect. No code was changed as a result.

## Known Stubs

None newly introduced. The Theme tab's "Presets and saved themes arrive later" placeholder (from an earlier plan) is an intentional future-phase stub, not a defect introduced or touched by this plan.

## Threat Flags

None. This plan added no new network endpoints, auth paths, file access patterns, or schema changes - the only source change (`CustomizeButton.tsx`) is a client-side Radix prop change with no trust-boundary impact.

## Issues Encountered

- A `next build` run (for gate verification) collided with the live `next dev` server sharing the same `.next` output directory on port 3100, breaking the dev server with a `Cannot find module './295.js'` error. Not an application defect - resolved by killing and restarting only the port-3100 dev server process (left the unrelated processes on ports 3000/3001 untouched, per the hard constraint).
- Several `agent-browser eval` selector/focus issues during the investigation (invalid `:has-text` pseudo-selector, ambiguous `aria-label=Customize` matching both mobile and desktop trigger variants, native `.click()` not triggering Radix Tabs) were all resolved by adjusting the eval scripts; none were application defects.

## Owner Flags (for Task 3 / the PR)

Carried over from earlier plans plus this plan's new finding, per the plan's Task 3 `<how-to-verify>` list:
- Narrow-desktop fallback: below ~1423px wide, the timer takes the D-20 narrow-fallback transform branch instead of the reference ~0.42 centered ratio (02-07 finding, still valid - UX-05 holds either way).
- The AccountButton Light/Dark toggle is unchanged; full theming beyond dark mode is deferred (02-04 flag).
- The mobile sheet uses vaul primitives directly, not `packages/ui`'s `DrawerContent`, to satisfy the no-scrim contract (D-11/D-20).
- Native range inputs are used instead of `packages/ui`'s `slider.tsx`.
- Progress-style order is Edge/Ruler/Ink/None.
- Toasts are now visible app-wide (not just inside the panel).
- The timer double-tick fix from 02-03 still holds (verified again this plan via the `setInterval` sweep).
- `bun run check-deps` is still broken (pre-existing since Phase 1, not this phase's responsibility).
- **New:** the "click the trigger again to close" path is mouse-unreachable while the panel is open (the opaque panel physically covers the trigger's screen position); fully functional via keyboard. X, Esc, and Cancel remain fully mouse-reachable close paths.

## Next Phase Readiness

- ENG-02, ENG-04, UX-05, and UX-06 are demonstrated end to end in a real browser across all required viewports and keyboard flows.
- All gates (build, check, tsc, customize.check) are green.
- Task 3 (owner visual review against Direction D) is the only remaining item before this phase can be marked complete. This plan does not mark the phase complete - that is gated on the owner's response.

**Owner review: pending (surfaced in the PR)**

---
*Phase: 02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

All files and commit hashes referenced in this SUMMARY were verified present in the working tree and git log.

## Orchestrator follow-up (post-checkpoint pixel review)

Found while reviewing the PR screenshots, fixed and re-verified live on :3100 plus build, check, tsc and customize.check:

| Fix | File | How it was caught |
|---|---|---|
| Key hints sat below the 70vh digit box, over the footer, so "Space" was clipped by the transport buttons at 1440x900. `.under` now anchors to the glyph row via `--digit-size` (hints at y 664-683, footer at 809). The Ruler style shares the anchor. | `Timer.tsx`, `timer-progress.module.css` | 1440x900 closed screenshot |
| The focus-return effect ran on mount, so every page load focused Customize and opened its tooltip. It now fires only on an open -> closed transition; Esc still returns focus to Customize. | `CustomizePanel.tsx` | Fresh-load screenshot showed the tooltip; `document.activeElement` was the trigger |
| The heading (tabindex -1 focus target) showed a browser focus ring on open. The outline is now removed on that heading only. | `customize-panel.module.css` | 1440x900 open screenshot |

Pre-existing and left alone: the soft dark footer backdrop behind the transport buttons (present in `.lavish/assets/guest-desktop.png` before this phase), the Next.js dev indicator at bottom-left (dev only), and the `next build` tooling warnings about the dual lockfile (swc patch) and stale browserslist data.
