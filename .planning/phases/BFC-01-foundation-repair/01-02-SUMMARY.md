---
phase: BFC-01-foundation-repair
plan: 02
subsystem: ui
tags: [tailwindcss, css, monorepo-deps, bun]

# Dependency graph
requires: []
provides:
  - "apps/next depends on real tailwindcss@^3.4.13 (byte-identical range to packages/ui) instead of the unrelated tailwind@^4.0.0 streaming library"
  - "packages/ui/src/globals.css has zero v4-only @theme syntax; every rule Tailwind 3 processes is a rule Tailwind 3 actually compiles"
  - "--border is defined exactly once per :root/.dark scope, single source of truth for Phase 2's CSS custom-property work"
  - "shine keyframes/animation live in tailwind.config.ts theme.extend, the established pattern for custom animations in this repo, so motion-safe:animate-shine is a real utility"
affects: [02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom Tailwind animations (keyframes + animation) belong in tailwind.config.ts theme.extend, not in globals.css @theme (v4-only, silently dropped by Tailwind 3) - shine now follows the same shape as the pre-existing accordion-down/accordion-up entries"

key-files:
  created: []
  modified:
    - apps/next/package.json
    - bun.lock
    - packages/ui/src/globals.css
    - packages/ui/tailwind.config.ts

key-decisions:
  - "Verified the bun.lock diff line-by-line before committing: 8 transitive packages (@babel/runtime, iconv-lite, inherits, lodash, mime-db, regenerator-runtime, ws) appear to be newly added, but all 8 already existed in the lockfile at identical or near-identical versions under nested scoped paths (e.g. next-auth/@babel/runtime, miniflare/ws) - they were pulled up to top-level entries once the large, deprecated tailwind@4 dependency tree was removed and bun re-hoisted. No unexpected new packages were introduced, satisfying the T-01-06 threat mitigation."
  - "Baseline @keyframes shine grep count on css-before.css was 1, not the 0 the plan predicted, because Tailwind 3's PostCSS pass just leaves an unrecognized @theme at-rule's text in the compiled output verbatim rather than stripping it - the block is syntactically present but semantically inert (no real .animate-shine utility class was ever generated to reference it, confirmed by grepping for the utility class vs. the orphan --animate-shine custom property). Recorded the actual number rather than forcing it to match the plan's prediction; the underlying bug (D-02) is unchanged."

patterns-established:
  - "Verifying a bun.lock diff for unexpected new packages: diff the added lines' package names against the full pre-change lockfile (not just a top-level scan) - packages can already exist at nested/scoped lockfile keys and simply get re-hoisted to top-level entries by an unrelated dependency removal."

requirements-completed: [FND-02, FND-03]

# Metrics
duration: 30min
completed: 2026-09-25
---

# Phase BFC-01 Plan 02: Single-source Tailwind 3 and design tokens Summary

**Replaced the bogus `tailwind@^4.0.0` devDependency with real `tailwindcss@^3.4.13` in apps/next, removed the v4-only `@theme` block from globals.css that Tailwind 3 was silently leaving inert, moved `shine` into `tailwind.config.ts`'s `theme.extend`, and collapsed four duplicate `--border` declarations down to two - zero visual change, confirmed via computed style and compiled-CSS diff.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-25T09:02:12Z
- **Completed:** 2026-09-25T09:32:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `apps/next/package.json` now declares the same `tailwindcss` range as `packages/ui` (`^3.4.13`); the unrelated `tailwind` streaming library is gone from `package.json`, `bun.lock`, and node_modules resolution (`require.resolve('tailwindcss/package.json')` from `apps/next` resolves to the root-hoisted `tailwindcss@3.4.17`).
- `packages/ui/src/globals.css` no longer contains the v4-only `@theme inline { @keyframes shine {...} }` block or the orphan `.theme { --animate-shine }` custom property. `shine` keyframes/animation now live in `packages/ui/tailwind.config.ts`'s `theme.extend`, following the exact shape of the pre-existing `accordion-down`/`accordion-up` entries, so `motion-safe:animate-shine` compiles to a real `.motion-safe\:animate-shine{animation:shine var(--duration) infinite linear}` rule referencing a real `@keyframes shine`.
- `--border` is now defined exactly once per scope: `0 0% 69%` for `:root`, `0 0% 25%` for `.dark` - the values that were already winning via the (now-deleted) unlayered duplicate blocks, so the rendered dashboard is unchanged.
- Zero-visual-change proven three ways: (1) compiled CSS diff (before vs. after, split on `}`) shows only the intended `--border` merge, the new shine utility, and the removed orphan `--animate-shine` - nothing else; (2) `getComputedStyle(document.documentElement).getPropertyValue('--border').trim()` on `/guest` returns `0 0% 25%`, matching the pre-fix value; (3) screenshot of `/guest` shows the dashboard rendering identically (timer, session grid borders, buttons all correctly styled).

## Task Commits

1. **Task 1: Capture the failing baseline, then replace the bogus tailwind dependency (D-01)** - `a94efd3` (fix)
2. **Task 2: Remove v4-only CSS, move shine into the Tailwind 3 config, single-source --border (D-02, D-03)** - `45d2bae` (fix)

**Plan metadata:** committed separately as part of state/summary update.

## Files Created/Modified
- `apps/next/package.json` - `devDependencies` now has `"tailwindcss": "^3.4.13"` in place of `"tailwind": "^4.0.0"`, alphabetical key order preserved.
- `bun.lock` - regenerated via `bun install`; no `tailwind@` entries remain, `tailwindcss@3.4.17` resolves once for the whole monorepo.
- `packages/ui/src/globals.css` - deleted the `@theme inline` block and the orphan `.theme { --animate-shine }` rule; merged the four `--border` declarations into two (`:root` and `.dark`, each defined once inside `@layer base`); trimmed a stray trailing blank line at EOF.
- `packages/ui/tailwind.config.ts` - added `shine` to `theme.extend.keyframes` (three stops: `0%`/`50%`/`to`, matching the removed `@theme` block's values) and `theme.extend.animation` (`shine: 'shine var(--duration) infinite linear'`).

## Decisions Made
- Ran the full `bun.lock` diff by package name against the pre-change lockfile before committing, rather than trusting a line-count summary, since the diff showed 8 "added" top-level packages at first glance. Confirmed all 8 (`@babel/runtime`, `iconv-lite`, `inherits`, `lodash`, `mime-db`, `regenerator-runtime`, `ws`, plus the `tailwindcss` range bump) already existed in the lockfile under nested/scoped keys (`next-auth/@babel/runtime`, `miniflare/ws`, etc.) at matching or near-matching versions - they were simply re-hoisted to top-level entries once the large legacy `tailwind@4` dependency tree (which pulled in old duplicate versions of the same packages) was removed. This satisfies the plan's T-01-06 threat mitigation ("reviewer confirms the diff removes tailwind@ and adds no unexpected packages") without needing to ask the user to eyeball a 470-line diff.
- Recorded the actual baseline `@keyframes shine` grep count (1, not the plan's predicted 0) rather than forcing the number to match the prediction. Tailwind 3's PostCSS pass doesn't strip unrecognized at-rules like `@theme` - it left the text in the compiled CSS verbatim, nested inside `@theme inline { ... }`. The rule was syntactically present but semantically inert: no `.animate-shine` utility class existed anywhere in the baseline CSS to reference those keyframes (confirmed by grepping for the utility class, which returned only the unrelated orphan `--animate-shine` custom property). The underlying D-02 bug - "shine doesn't actually work" - was still correctly diagnosed and fixed; only the specific verification grep count differed from the plan's prediction.

## Deviations from Plan

None - plan executed exactly as written. The two observations above (bun.lock re-hoisting, baseline grep count) are verification findings documented for transparency, not deviations requiring a Rule 1-4 fix; no code or plan action differed from what D-01/D-02/D-03 specified.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Follow-ups (not fixed in this plan, per plan's explicit scope note)
- `bun run check-deps` (`check-dependency-version-consistency`) is still broken - the tool is invoked by the script but is not a declared dependency anywhere in the monorepo, so it fails with "command not found" regardless of this plan's changes. Confirmed still broken after this plan's `bun install`. Consistency between `apps/next` and `packages/ui`'s `tailwindcss` ranges was instead verified directly via `grep -c '"tailwindcss": "^3.4.13"' packages/ui/package.json apps/next/package.json` (1 in each). Per the plan, fixing the `check-deps` script itself is out of scope for this plan.

## Next Phase Readiness
- FND-02 and FND-03 are both satisfied: one declared Tailwind version compiles the whole monorepo, and `--border` has a single source of truth per scope for Phase 2's CSS custom-property work to build on.
- Plan 01-03 (Biome 2 upgrade, FND-04) and plan 01-04/01-05 (hydration dedup, final build gate, production checkpoint) are unaffected by and do not depend on this plan's changes beyond both plans sharing the same `apps/next` build/dev pipeline (documented in this plan's frontmatter as the reason for serialization after 01-01, not a logical dependency).
- No blockers identified for subsequent phase 1 plans.

---
*Phase: BFC-01-foundation-repair*
*Completed: 2026-09-25*

## Self-Check: PASSED

- FOUND: apps/next/package.json
- FOUND: bun.lock
- FOUND: packages/ui/src/globals.css
- FOUND: packages/ui/tailwind.config.ts
- FOUND: .planning/phases/BFC-01-foundation-repair/01-02-SUMMARY.md
- FOUND: commit a94efd3
- FOUND: commit 45d2bae
