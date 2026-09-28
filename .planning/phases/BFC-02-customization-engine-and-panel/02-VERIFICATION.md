---
phase: BFC-02-customization-engine-and-panel
verified: 2026-09-28T00:36:02Z
status: human_needed
score: 28/28 must-haves verified (5 ROADMAP success criteria + 23 requirement IDs)
overrides_applied: 0
human_verification:
  - test: "Owner visual review of the customize panel against Direction D (Feathered dock), per 02-08-PLAN.md Task 3 - open the panel at desktop and mobile viewports and compare against .lavish/customize-panel-directions.html"
    expected: "Panel geometry, feather gradient, animation, and section layout match the accepted Direction D reference; owner signs off or requests changes"
    why_human: "Explicitly deferred by the phase plan itself (02-08 Task 3 is the blocking owner checkpoint, to be requested in the PR per the task's known context) - visual/aesthetic fidelity is not programmatically verifiable"
  - test: "Confirm the mouse-unreachable 'click the trigger again to close' path (owner flag in 02-08-SUMMARY.md) is an acceptable tradeoff"
    expected: "Owner accepts that the opaque panel covering the trigger's screen position is intentional (per D-20/D-11's opaque-dock contract), with Esc/Cancel/X remaining fully mouse-reachable close paths"
    why_human: "A design tradeoff decision, not a code defect - already functional via keyboard, needs a product/UX judgment call"
  - test: "Live rAF-driven focus-to-heading effect (C1) and the CSS opacity/blur tween itself (part of C6) on open, in a foreground (non-backgrounded) browser tab"
    expected: "Focus visibly and audibly (for screen reader users) lands on the 'Customize' heading when the panel opens; the panel's entrance animation plays smoothly at 0.45s eased, and is skipped entirely under prefers-reduced-motion"
    why_human: "02-08-SUMMARY.md documents these two sub-checks as PASS by code inspection only - the CDP-controlled test tab was backgrounded and Chromium throttled requestAnimationFrame entirely, so the actual runtime behavior was never observed firing"
---

# Phase 2: Customization Engine and Panel Verification Report

**Phase Goal:** A user can open a customize panel from the dashboard and change every one of the
ten customizable surfaces, seeing the dashboard react the instant a control moves, then commit
with Apply or throw it away with Cancel. Nothing survives a refresh yet; Phase 3 adds that.

**Verified:** 2026-09-28T00:36:02Z
**Status:** human_needed
**Re-verification:** No - initial verification

**Note on `mode: mvp`:** ROADMAP.md tags this phase `mvp`, but its goal is written as a plain
declarative sentence with five numbered, testable Success Criteria - not the `As a ___, I want to
___, so that ___.` user-story shape the MVP-mode verification path expects. The task's explicit
instructions named the ROADMAP success criteria, the 23 requirement IDs, and D-01..D-20 as the
verification target, so standard goal-backward verification was applied against those numbered
criteria rather than refusing to verify. This is a documentation-shape mismatch, not a phase
defect - flagged here for the record, not treated as a gap.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Panel opens from the dashboard, organized into Theme/Background/Type/Color/Style, every control pre-shows the active value | VERIFIED | `apps/next/src/components/customize/sections/index.ts` declares `CUSTOMIZE_SECTIONS` in exactly that order; `CustomizeButton.tsx` triggers `openPanel()` which copies `active -> preview`; all five section components render controls bound to `preview` state via `useCustomizeStore` |
| 2 | Moving any of the 10 controls (solid swatch, overlay tint, overlay opacity, blur, font, accent, contrast, progress style, density, grain) updates the dashboard immediately, pre-commit | VERIFIED | `useCustomizeStore.tsx`'s `setPreview` validates via `lookSchema.safeParse` and writes to `preview`; `selectPaintedLook = panelOpen ? preview : active`; the store's single `useEffect` paints `lookToTokens(paintedLook)` onto `document.documentElement` on every state change. All 10 surfaces confirmed present as live-bound controls in `BackgroundSection.tsx`, `ColorSection.tsx`, `StyleSection.tsx`, `TypeSection.tsx` |
| 3 | Apply keeps the new look; Cancel/close reverts exactly to the pre-open look | VERIFIED | `apply()`: `active = preview; panelOpen = false`. `cancel()`: `preview = active; panelOpen = false`. `useCustomizeActions.ts` wires these to the Apply/Cancel buttons, Escape key, and route-change discard; 02-08-SUMMARY's A3/A4 test rows independently confirm this behaviorally (PASS) |
| 4 | One Reset action returns every control and the dashboard to default | VERIFIED | `resetPreview()`: `preview = DEFAULT_LOOK` (structural default from `packages/types/look.ts`); wired to `CustomizePanelBody.tsx`'s "Reset to default" button, `disabled={isDefault}` guards no-op resets |
| 5 | On phone, every control reachable/usable in a bottom sheet; timer stays usable at every viewport; whole panel keyboard-driven with screen-reader-labelled controls | VERIFIED (code) / see human_verification | `CustomizePanelMobile.tsx` uses a non-modal vaul `Drawer` with a manual Tab-trap (`onKeyDown` cycling first/last tabbable element); `controls.tsx` uses fieldset/legend, `aria-label`, `aria-live='polite'`; `timer-scale.ts`'s `computeTimerTransform` repositions/rescales the timer per viewport (desktop centered/narrow-fallback branches, mobile rise-above-sheet branch); 02-08-SUMMARY.md's C1-C6 test matrix independently confirms all keyboard/SR checks PASS or PASS-by-code-inspection (two sub-checks could not fire in the backgrounded test tab - see human_verification) |

**Score:** 5/5 ROADMAP success criteria verified in code.

### Requirements Coverage (23 Phase-2 IDs)

| Requirement | Description (abridged) | Status | Evidence |
|---|---|---|---|
| ENG-01 | Store writes full token set + data attrs onto document root | SATISFIED | `catalog.ts` `lookToTokens()`; `useCustomizeStore.tsx` paint effect |
| ENG-02 | Any control updates dashboard live, pre-persist | SATISFIED | `setPreview` + `selectPaintedLook` |
| ENG-03 | Three distinct states: active/preview/persisted | SATISFIED | `useCustomizeStore.tsx` state shape (`active`, `preview`, `panelOpen`); persisted state is Phase 3 scope, not required yet |
| ENG-04 | Apply commits preview; Cancel/close reverts, no persist | SATISFIED | `apply()`/`cancel()` in `useCustomizeStore.tsx` |
| CTL-01 | 8 solid preset swatches, no image backgrounds | SATISFIED | `catalog.ts` `SOLIDS` (8 entries); no image-kind UI wired |
| CTL-02 | Custom solid color picker | SATISFIED | `BackgroundSection.tsx` `ColorField` for custom hex |
| CTL-03 | Overlay tint, opacity, blur | SATISFIED | `BackgroundSection.tsx` overlay controls; tokens `--bg-overlay-color/-opacity/-blur` |
| CTL-04 | 4 typography families | SATISFIED | `catalog.ts` `FONTS` (4 entries); `TypeSection.tsx` pick cards |
| CTL-05 | Accent color swatches + custom picker | SATISFIED | `catalog.ts` `ACCENTS` (12) + `ColorSection.tsx` custom `ColorField` |
| CTL-06 | Foreground text contrast adjustment | SATISFIED | `ColorSection.tsx` `RangeField` bound to `contrast` |
| CTL-07 | Progress style Edge(default)/Ruler/Ink/None, ring removed | SATISFIED | `StyleSection.tsx` segmented control; `TimerProgressRing.tsx` confirmed deleted, zero references |
| CTL-08 | Layout density compact/comfortable/roomy | SATISFIED | `StyleSection.tsx` segmented control; `globals.css` density CSS block |
| CTL-09 | Atmospheric grain intensity | SATISFIED | `StyleSection.tsx` `RangeField` bound to `grain`; `--grain-opacity` token |
| CTL-10 | One-action reset to default | SATISFIED | `resetPreview()` + footer button |
| CTL-11 | Session tracker as accent contribution grid (no outlines), chrome idle fade | SATISFIED | `SessionsUI.tsx` `.bf-cell` grid with `data-state`; `useChromeIdle.ts` wired into `Header.tsx`/`Footer.tsx` via `bf-chrome` class |
| CTL-12 | Keyboard hints under digits, Space/R shortcuts | SATISFIED | `Timer.tsx` hints markup; `useTimerKeyboard.ts` guard-scoped handler |
| CTL-13 | Bare menu buttons (no outline, muted icons, accent customize icon) | SATISFIED | `MenuButtons.tsx` `appearance='bare'`; `CustomizeButton.tsx` `text-user-accent` icon |
| UX-01 | Open/close panel from dashboard | SATISFIED | `CustomizeButton.tsx` toggles `panelOpen` |
| UX-02 | Panel opens showing active theme's current values | SATISFIED | `openPanel()` copies `active -> preview` before showing |
| UX-03 | Organized into Theme/Background/Type/Color/Style | SATISFIED | `sections/index.ts` `CUSTOMIZE_SECTIONS` order |
| UX-04 | Mobile: every control reachable/usable in bottom sheet | SATISFIED (code) | `CustomizePanelMobile.tsx` tab-trap + vaul sheet; 02-08 C5 test PASS |
| UX-05 | Panel doesn't obstruct timer to unusability at any viewport | SATISFIED (code) | `timer-scale.ts` `computeTimerTransform`; 02-08 "B" viewport matrix all PASS |
| UX-06 | Keyboard navigable, controls labelled for screen readers | SATISFIED (code) | `controls.tsx` ARIA primitives; `CustomizePanelDesktop.tsx`/`Mobile.tsx` `role='dialog'`/`aria-labelledby`; 02-08 C1-C6 matrix PASS/PASS-by-inspection |

**No orphaned requirements** - all 23 IDs mapped to Phase 2 in REQUIREMENTS.md appear in plan frontmatter and are addressed above. `ENG-05` and `SYN-01..05` are correctly scoped to Phase 3 (`[ ]` unchecked in REQUIREMENTS.md) and out of this phase's responsibility.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/types/look.ts` | Look schema + DEFAULT_LOOK + lookEquals | VERIFIED | `.strict()` Zod schema, exact field set per D-05 |
| `apps/next/src/store/useCustomizeStore.tsx` | Zustand store, 3-state model, DOM painter | VERIFIED | safeParse-gated actions, single paint effect, cleanup removes tokens/attrs on unmount |
| `apps/next/src/lib/customize/catalog.ts` | Solids/accents/fonts/progress/density catalogs + token mapper | VERIFIED | `lookToTokens()` matches D-04 token set exactly, never writes `--accent` |
| `apps/next/src/components/customize/CustomizePanel.tsx` | Breakpoint switch, focus mgmt, Escape/route-change discard | VERIFIED | `useMediaQuery('(min-width: 1024px)')`; focus effects fixed per 02-08 follow-up (no longer fires on mount) |
| `apps/next/src/components/customize/CustomizePanelDesktop.tsx` | Feathered dock, `role=dialog aria-modal=false` | VERIFIED | Framer Motion `motion.aside`, 520px dock, 120px feather, reduced-motion 0-duration |
| `apps/next/src/components/customize/CustomizePanelMobile.tsx` | Non-modal vaul bottom sheet, 60dvh, tab-trap | VERIFIED | `modal={false} shouldScaleBackground={false} handleOnly`, manual focus-cycle handler |
| `apps/next/src/components/customize/sections/*.tsx` (5 files) | Theme/Background/Type/Color/Style content | VERIFIED | All match D-13 content spec; Theme's "arrives later" note is a declared Phase-4 stub, not a defect |
| `apps/next/src/components/customize/controls.tsx` | Accessible control primitives | VERIFIED | fieldset/legend, aria-label, aria-live |
| `apps/next/src/components/timer/Timer.tsx` | Tokens-driven timer, no double-tick, viewport-aware transform | VERIFIED | Web Worker-only decrement; `computeTimerTransform` wired via ResizeObserver |
| `apps/next/src/lib/customize/timer-scale.ts` | Pure geometry function | VERIFIED | Matches D-20 formula (dock/sheet/gutter/max-scale constants); self-checked by `customize.check.ts` |
| `apps/next/src/hooks/useChromeIdle.ts` | 2s idle-fade, wake on interaction | VERIFIED | Wired into `Header.tsx`/`Footer.tsx` via `bf-chrome` |
| `apps/next/src/components/sessions/SessionsUI.tsx` | Accent contribution grid, no outlines | VERIFIED | `.bf-cell` with `data-state`, desktop+mobile layouts |
| `apps/next/src/components/dashboard/TimerProgressRing.tsx` | Should be deleted (D-16) | VERIFIED (absent) | File does not exist; zero references anywhere in `apps/next/src` |
| `apps/next/src/components/DarkModeToggle.tsx` | Should be deleted (D-07) | VERIFIED (absent) | File does not exist; zero references anywhere in `apps/next/src` |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `CustomizeButton.tsx` | `useCustomizeStore` | `openPanel()` call on click | WIRED | Confirmed in both `MenuSettings.tsx` (desktop) and `MenuSettingsMobile.tsx` (mobile) |
| Section controls (`BackgroundSection.tsx` etc.) | `useCustomizeStore.setPreview` | `onChange` handlers via `controls.tsx` primitives | WIRED | Every control traced to a `setPreview({...preview, field: value})` call |
| `useCustomizeStore` painted look | `document.documentElement` | `root.style.setProperty` / `removeProperty` in the store's `useEffect` | WIRED | Confirmed no `cssText`/template-string writes, matching the token-set contract |
| `catalog.ts` tokens | `AppBackground.tsx` / `globals.css` / `timer-progress.module.css` | CSS custom property consumption | WIRED | `--bg-solid`, `--bg-overlay-*`, `--user-accent`, `--text-contrast`, `--grain-opacity`, `--font-display`, `data-progress`, `data-density` all consumed where declared |
| `CustomizePanel.tsx` Escape handler | `useCustomizeActions.discard` | `window` keydown listener, `!event.defaultPrevented` guard | WIRED | 02-08 fix (`f0882c1`) forces the Radix Tooltip closed so it no longer swallows the Escape event first |
| `useTimerKeyboard.ts` guard | `[data-customize-panel]` | `GUARDED_CONTAINER_SELECTOR` exclusion | WIRED | Confirmed Space/R still reach the timer while panel controls (inputs/radios) correctly block them (D-12) |
| `Timer.tsx` `useLayoutEffect` | `timer-scale.ts` `computeTimerTransform` | `ResizeObserver` + resize listener measuring `[data-timer-digits]` | WIRED | Verified live measurement path, not a static/hardcoded transform |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `AppBackground.tsx` | CSS custom properties (`--bg-solid`, `--bg-overlay-*`, `--user-accent`, `--grain-opacity`) | `useCustomizeStore`'s paint effect, driven by user control interaction | Yes - values change on every control move, verified via store action tracing | FLOWING |
| `Timer.tsx` progress markup | `elapsed`/`nowIndex` (Edge/Ruler/Ink) | `timeLeft`/`workDuration`/`breakDuration` from `useTimerStore`, computed inline | Yes - not static | FLOWING |
| `Timer.tsx` clock transform | `transform` state | `computeTimerTransform()` fed by live `ResizeObserver` measurements, not hardcoded viewport constants | Yes | FLOWING |
| `SessionsUI.tsx` grid cells | `data-state` per cell | Session/task store state (pre-existing, untouched data source) | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Type-checking across the app compiles clean | `bunx tsc --noEmit -p apps/next/tsconfig.json` | "No errors found" (exit 0) | PASS |
| Format/lint/organize-imports clean | `bun run check` | exits clean (exit 0) | PASS |
| Pure geometry function self-check (`computeTimerTransform`) | `cd apps/next && bun run src/lib/customize/customize.check.ts` | `customize.check OK` (exit 0) | PASS |
| `next build` | N/A | SKIPPED - explicitly forbidden by task instructions (dev server on :3100 would be corrupted) | SKIP |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention exists in this repo, and neither the PLAN nor SUMMARY files for this phase declare any probe scripts. SKIPPED (no runnable probes declared or found).

### Anti-Patterns Found

Scanned all customize-related files touched across 02-01 through 02-08 (per SUMMARY key-files and `git log` diff) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/`console.log`-only-implementations/empty-return stubs.

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `apps/next/src/components/customize/sections/ThemeSection.tsx` | - | "Presets and saved themes arrive later." placeholder text | INFO | Intentional, declared Phase-4 stub per ROADMAP note ("Build the section so Phase 4 fills it rather than restructures the panel"); not a defect |

No blocker-level debt markers (unreferenced TBD/FIXME/XXX) found in any phase-touched file. `bun run check-deps` remains broken, but this is documented pre-existing Phase-1 breakage per the task's explicit exemption and `deferred-items.md` - not scored against this phase.

### Human Verification Required

### 1. Owner visual review against Direction D

**Test:** Open the customize panel at desktop (dock) and mobile (bottom sheet) viewports and compare against the accepted `.lavish/customize-panel-directions.html` reference.
**Expected:** Panel geometry, feather gradient, animation timing, and section layout match the accepted direction; owner signs off or requests changes.
**Why human:** This is 02-08-PLAN.md's Task 3, the phase's own blocking checkpoint - explicitly not yet run, to be requested in the PR. Visual/aesthetic fidelity to a design reference cannot be verified by grep or static analysis.

### 2. Mouse-unreachable "click trigger again to close" tradeoff

**Test:** With the panel open, attempt to close it by clicking the Customize trigger button again with a mouse.
**Expected:** Owner accepts this is intentionally not the primary close path (the opaque dock covers the trigger's screen position by design per D-11/D-20); Esc, Cancel, and the panel's own close (X) button remain the supported mouse-driven close paths.
**Why human:** Documented product/UX tradeoff decision (02-08-SUMMARY.md "Owner Flags"), not a code defect. Needs explicit owner acceptance.

### 3. rAF-driven focus effect and entrance animation, foreground tab

**Test:** With a normal (non-automation-controlled, foreground) browser tab, open the customize panel and observe whether keyboard focus visibly/audibly lands on the "Customize" heading, and whether the panel's entrance animation plays smoothly.
**Expected:** Focus moves to the heading (screen readers announce it); the panel animates in over ~0.45s with the documented easing, or skips animation entirely under `prefers-reduced-motion`.
**Why human:** 02-08-SUMMARY.md's own testing notes state these two sub-checks (C1, part of C6) were only verified by code inspection, because the CDP-controlled test tab was backgrounded and Chromium suspended `requestAnimationFrame` for the entire session - the actual runtime behavior was never observed firing.

### Gaps Summary

No gaps found. Every ROADMAP success criterion, all 23 mapped requirement IDs, and every decision
D-01 through D-20 in `02-CONTEXT.md` were cross-checked directly against source files (not against
SUMMARY.md narration) and confirmed implemented as specified:

- Engine/state model (D-01..D-06): `look.ts`, `useCustomizeStore.tsx`, `catalog.ts` all match spec exactly, including the `.strict()` schema, the three-state active/preview/persisted model, and the constraint that `--accent` (ShadCN's own token) is never written by the customize system.
- Panel behavior (D-07..D-15): trigger placement, Apply/Cancel/Reset semantics, toast behavior, section order/content, and accessible control primitives all confirmed in code.
- Dashboard chrome (D-16..D-19): `TimerProgressRing.tsx` and `DarkModeToggle.tsx` confirmed deleted with zero remaining references; idle-fade, bare menu buttons, and the SoundSettings hardcoded-hex fix all confirmed.
- Feathered dock (D-20): desktop 520px dock / mobile 60dvh sheet geometry, feather gradients, and the viewport-aware timer transform formula all match the transcribed spec in `customize-panel.module.css` and `timer-scale.ts`.
- All three permitted verification commands (`bun run check`, `bunx tsc --noEmit`, `customize.check.ts`) pass cleanly.
- Working tree is clean aside from an unrelated `package-lock.json` diff and an untracked `.impeccable/` directory - no uncommitted source changes.

The only reason this report is not `status: passed` is the one still-outstanding item the phase
plan itself defers to the PR: **02-08 Task 3, the owner's visual sign-off against Direction D**,
plus two smaller items surfaced during that same review (a mouse-reachability tradeoff and two
rAF-throttled sub-checks that could only be verified by code inspection, not live observation).
None of these are code defects - they are exactly the human-judgment items the phase's own plan
called out as pending.

---

_Verified: 2026-09-28T00:36:02Z_
_Verifier: Claude (gsd-verifier)_
