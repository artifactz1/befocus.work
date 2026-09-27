# Phase 2: Customization Engine and Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-09-26
**Phase:** 2-Customization Engine and Panel
**Mode:** Worker-driven. The owner delegated with "you drive it". Gray areas already decided in `.planning/` were resolved from those docs. The one genuine product choice, panel form, went to a Lavish design board.
**Areas discussed:** Panel form, close semantics, preview fidelity, token naming, entry point

---

## Panel form (D-20)

| Option | Description | Selected |
|--------|-------------|----------|
| D - Feathered dock | A's geometry after the owner's reference: borderless 520px aside with a 120px feathered, blurred seam, surface derived from the background, soft fills, blur-in stagger; 60% mobile sheet with a feathered top | Recommended (pending owner) |
| A - Docked side panel | 400px right aside, timer at 72% shifted left; 56% mobile sheet | |
| B - Bottom tray | Full-width 330px tray, section rail, timer 62% centered | |
| C - Floating card | 460px card above footer, height by section, timer 80-42%; 3 mobile snap points | |

Board: `.lavish/customize-panel-directions.html`

The owner shared a reference (an "AI Companion" sidebar posted by bestdesignsonx) mid-review and said they liked its panel design. D was added to the board in response, and the recommendation moved from A to D. The board has a section that analyzes the reference. A follow-up from the owner asked for D's timer to always stay centered. D now keeps it centered and scales it to clear the feather: 42% at 1440x900, up to 72% on wider screens.

---

## Close semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Close = Cancel, no confirm | Matches ENG-04 and ROADMAP "closing the panel snaps back"; the dirty dot is the warning | ✓ |
| Confirm "discard changes?" on close with edits | Safer, but adds a modal to a non-modal flow | |
| Close keeps preview as active | Contradicts ENG-04 | |

## Apply behaviour

| Option | Description | Selected |
|--------|-------------|----------|
| Apply commits and closes | One clear end of an edit | ✓ |
| Apply commits, panel stays open | Faster multi-step tweaking, but the end state is ambiguous | |

## Preview fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| No scrim, non-modal | Dashboard is the preview; dimming falsifies it | ✓ |
| Scrim at 35% (prototype mobile) | Focus, but distorts contrast and background judgement | |

## Accent token name

| Option | Description | Selected |
|--------|-------------|----------|
| New `--user-accent` | ShadCN `--accent` is a hover surface used by 6 primitives | ✓ |
| Overwrite `--accent` per ENG-01 wording | Would tint every hover state with the user colour | |

## Customize entry on mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Replace the sun (DarkModeToggle) | App is dark only; keeps 4 buttons | ✓ |
| Add a 5th button | Crowds a 390px row | |

## Claude's Discretion
- Font loading strategy, mobile shell primitive, transition timing, fade delay, density factors, file split.

## Deferred Ideas
- None new. Persistence, themes, uploads and URL backgrounds are already mapped to Phases 3-6.

## Panel direction (D-20)

Decided on the Lavish board `.lavish/customize-panel-directions.html` on 2026-09-27.

| Option | Description | Selected |
|--------|-------------|----------|
| D - Feathered dock | A's right dock with a feathered, blurred seam, a surface that follows the background, timer kept centered and only scaled | ✓ |
| A - Docked side panel | 400px inset card, timer shifted left and scaled to 72% | |
| B - Bottom tray | Full-width 330px tray, section rail, timer at 62% | |
| C - Floating card | 460px card above the footer, height per section, 3 mobile snap points | |

Owner feedback folded into D before the pick: the timer stays centered with the panel open and only scales, and key hints hide while the panel is open.
