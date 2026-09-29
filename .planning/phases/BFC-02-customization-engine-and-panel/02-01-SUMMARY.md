---
phase: 02-customization-engine-and-panel
plan: 01
subsystem: ui
tags: [zustand, zod, next-font, tailwind, css-custom-properties, biome]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: TimerStoreProvider per-request Zustand pattern, useTimerStore.tsx as the shape to copy
provides:
  - "packages/types/look.ts: the single Zod lookSchema, Look type, DEFAULT_LOOK, hexColorSchema, lookEquals"
  - "apps/next/src/lib/customize/catalog.ts: SOLIDS, ACCENTS, FONTS, PROGRESS_STYLES, DENSITIES, lookToTokens"
  - "apps/next/src/store/useCustomizeStore.tsx: CustomizeStoreProvider + useCustomizeStore, mounted on / and /guest"
  - "Token contract painted onto document.documentElement: --bg-solid, --bg-overlay-color, --bg-overlay-opacity, --bg-blur, --user-accent, --text-contrast, --grain-opacity, --font-display, plus data-progress/data-density/data-panel"
affects: [02-02-customization-panel-ui, 02-03-dashboard-token-consumption, 02-04-persistence]

# Tech tracking
tech-stack:
  added: [zod@3.24, sonner@2.0, vaul@1.1]
  patterns:
    - "Per-request Zustand store via createStore-in-useState + React Context + overloaded selector hook (copied from useTimerStore.tsx)"
    - "Single paint effect writes CSS custom properties via element.style.setProperty/removeProperty only, never cssText or template strings"
    - "safeParse-or-DEFAULT_LOOK gate at the only two mutation entry points (createCustomizeStore init, setPreview) so no unvalidated value ever reaches style.setProperty"

key-files:
  created:
    - packages/types/look.ts
    - apps/next/src/lib/customize/catalog.ts
    - apps/next/src/lib/customize/customize.check.ts
    - apps/next/src/store/useCustomizeStore.tsx
  modified:
    - apps/next/package.json
    - bun.lock
    - packages/ui/src/globals.css
    - packages/ui/tailwind.config.ts
    - apps/next/src/app/layout.tsx
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/app/guest/layout.tsx
    - apps/next/src/components/dashboard/AppBackground.tsx
    - .planning/REQUIREMENTS.md

key-decisions:
  - "ENG-01 requirement text corrected from --accent to --user-accent to match D-04 (ShadCN --accent must never be written by the store)"
  - "apps/next/next.config.mjs experimental.externalDir was not needed; the existing @repo/types/* tsconfig path alias resolved packages/types/look.ts cleanly for both tsc and next build"
  - "(auth) route group deliberately has no CustomizeStoreProvider, so navigating from /guest or / to /sign-in unmounts the provider and its cleanup effect strips all tokens/attrs by construction, rather than needing an explicit reset on the auth routes"

requirements-completed: [ENG-01, ENG-03]

duration: 30min
completed: 2026-09-27
---

# Phase 2 Plan 1: Customization Engine and Panel - Look Contract, Store and Token Wiring Summary

**Zod-validated Look schema with a per-request Zustand store (active/preview/persisted) that paints an 8-property CSS custom-property contract plus 3 data attributes onto document.documentElement, replacing AppBackground's hardcoded colors with zero visual change at the defaults.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-27T12:56:00-07:00
- **Completed:** 2026-09-27T13:24:56-07:00
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments
- Single source-of-truth `lookSchema` (discriminated union on `bg.kind`, strict object, range-bounded numbers) with `DEFAULT_LOOK` reproducing today's dashboard exactly
- `useCustomizeStore` mounted on both `/` and `/guest`, exposing distinct `active`/`preview`/`persisted` fields and `openPanel`/`setPreview`/`apply`/`cancel`/`resetPreview` actions
- One paint effect writes the full token set via `setProperty`/`removeProperty` only, verified with devtools against a running dev server
- `AppBackground.tsx`, `globals.css`, and `tailwind.config.ts` now read from the token contract; production build and visual check confirm no regression

## Task Commits

Each task was committed atomically:

1. **Task 1: Look contract, catalog and self-check** - `9d5e4fd` (feat)
2. **Task 2: Customize store and provider mount on dashboard and guest** - `2c95f49` (feat)
3. **Task 3: Token CSS, fonts, Toaster and AppBackground on tokens** - `7e21243` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `packages/types/look.ts` - lookSchema, Look, DEFAULT_LOOK, hexColorSchema, lookEquals
- `apps/next/src/lib/customize/catalog.ts` - SOLIDS/ACCENTS/FONTS/PROGRESS_STYLES/DENSITIES catalog + lookToTokens
- `apps/next/src/lib/customize/customize.check.ts` - node:assert self-check, runs via `bun run`
- `apps/next/src/store/useCustomizeStore.tsx` - CustomizeStoreProvider, useCustomizeStore, paint effect
- `packages/ui/src/globals.css` - token defaults, density attribute rules, .text-dash utility
- `packages/ui/tailwind.config.ts` - `user-accent` color mapped to the raw hex custom property
- `apps/next/src/app/layout.tsx` - self-hosted JetBrains Mono/Fraunces/Space Grotesk via next/font, mounted `<Toaster />`
- `apps/next/src/components/dashboard/AppBackground.tsx` - all four layers read from the token contract
- `apps/next/src/app/(app)/layout.tsx`, `apps/next/src/app/guest/layout.tsx` - nested `CustomizeStoreProvider initialLook={null}`
- `.planning/REQUIREMENTS.md` - ENG-01 corrected to reference `--user-accent`

## Decisions Made
- Corrected ENG-01's requirement text (`--accent` -> `--user-accent`) since the plan's own D-04 forbids writing ShadCN's `--accent`
- Confirmed no `next.config.mjs` change was required for the new `packages/types` import (contrary to the plan's contingency note); the existing path alias was sufficient for both `tsc` and `next build`
- Relied on route-group composition (no provider on `(auth)`) rather than an explicit reset action to guarantee `/sign-in` never carries dashboard tokens

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome CSS formatter required double quotes in attribute selectors**
- **Found during:** Task 3
- **Issue:** `bun run check` failed because Biome's CSS formatter rewrites `html[data-density='comfortable']` to double quotes, differing from the project's single-quote JS/TS convention but consistent with Biome's CSS-specific rule
- **Fix:** Ran `bun x @biomejs/biome format --write` on the touched files to apply the required quoting
- **Files modified:** packages/ui/src/globals.css
- **Committed in:** 7e21243

**2. [Rule 3 - Blocking] Same Biome formatting issue in Task 1's self-check file**
- **Found during:** Task 1
- **Issue:** One multi-line `assert.equal` call in `customize.check.ts` violated Biome's line-wrapping rule
- **Fix:** Ran `bun x @biomejs/biome format --write` on the four Task 1 files
- **Files modified:** apps/next/src/lib/customize/customize.check.ts
- **Committed in:** 9d5e4fd

---

**Total deviations:** 2 auto-fixed (both Rule 3, Biome formatter compliance)
**Impact on plan:** No scope creep; both fixes were mechanical formatting corrections required to pass the plan's own `bun run check` verification gate.

## Issues Encountered
- Port 3000 on the dev machine was occupied by an unrelated project (findmymatcha infra), and port 3001 had a second unrelated dev server (findmymatcha vite) also bound via SO_REUSEPORT, silently intercepting requests. Resolved by running the verification dev server on port 3847 instead.
- `/sign-in` returns 500 in this environment because `packages/api/.dev.vars` is absent (no local API worker secrets configured), so better-auth's session fetch in `middleware.ts` fails. This is a pre-existing environment-setup gap unrelated to this plan's diff. Verified the token-cleanup guarantee statically instead: `apps/next/src/app/(auth)/layout.tsx` does not mount `CustomizeStoreProvider`, so the provider (and its cleanup effect that calls `removeProperty`/`removeAttribute` for every token) is never even present on that route tree.
- Visual regression check on `/guest` at 1440x900 was done as a single post-edit screenshot rather than a true before/after pair, since the Task 3 edits were already applied before dev-server verification began. Confirmed via devtools instead that `--bg-solid` (`hsl(0 0% 6.3%)`), `--user-accent` (`#f5f5f4`), `data-progress` (`edge`), `data-density` (`comfortable`) and `data-panel` (`closed`) all match `DEFAULT_LOOK`'s values, which by D-05 are defined to reproduce the prior hardcoded render exactly, and the screenshot itself shows the same dark background, white timer glyphs and grid with no layout shift.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The token contract, catalog, and store are ready for the customization panel UI (plan 02-02) to read/write via `useCustomizeStore`'s `setPreview`/`apply`/`cancel` actions.
- `persisted` field exists in the store but nothing writes to it yet; plan 02-04 (persistence) is expected to wire it to a backend/local-storage sync.
- No stubs found in this plan's files that block its own goal - the store, catalog, and painted tokens are fully wired end to end for the default look.

---
*Phase: 02-customization-engine-and-panel*
*Completed: 2026-09-27*

## Self-Check: PASSED

All 11 claimed files verified present on disk; all 3 task commit hashes (9d5e4fd, 2c95f49, 7e21243) verified present in `git log`.
