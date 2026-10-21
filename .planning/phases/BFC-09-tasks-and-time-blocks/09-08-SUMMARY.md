---
phase: BFC-09-tasks-and-time-blocks
plan: 08
subsystem: ui
tags: [look, customize, progress-slot, strip, popover]
requires: [09-07]
provides:
  - sessionProgress Look key (strip | now | grid, default strip) and commitKey in the customize store
  - stripWidths (pure) and ProgressSlot with Strip, Now, Grid, switcher popover, idle dim
affects: [09-09, 09-11]
key-files:
  created:
    - apps/next/src/lib/plan/strip.ts
    - apps/next/src/lib/plan/strip.check.ts
    - apps/next/src/components/progress/ProgressSlot.tsx
    - apps/next/src/components/progress/progress.module.css
  modified:
    - packages/types/look.ts
    - apps/next/src/lib/customize/catalog.ts
    - apps/next/src/lib/customize/customize.check.ts
    - apps/next/src/lib/storage/browser-storage.ts
    - apps/next/src/store/useCustomizeStore.tsx
    - apps/next/src/store/useDeckStore.ts
    - apps/next/src/components/customize/sections/StyleSection.tsx
    - apps/next/src/components/customize/sections/index.ts
    - apps/next/src/components/sessions/SessionsUI.tsx
    - apps/next/src/components/Header.tsx
    - packages/ui/src/globals.css
requirements-completed: [TSK-04]
completed: 2026-10-21
---

# Phase 9 Plan 08: Live progress slot Summary

The top-left slot is now a switchable progress slot (Strip default, Now, Grid) driven by a persisted `sessionProgress` Look key, with a switcher popover that also opens the Session card, a matching Customize > Style control, and a 35% idle dim.

## Seam map

Preference persistence: account looks go through `PUT /user/themes/active` (packages/api/src/routes/themes/themes.route.ts, body `{ look: lookSchema }`) into the active theme row's `look` JSON, read back by user.handler.ts with `lookSchema.safeParse`; guests use `readGuestLook` / `writeGuestLook` (apps/next/src/lib/customize/guest-look.ts, validated by `lookSchema`). Server, guest and client all import the shared `packages/types/look.ts`, so the new `.default('strip')` key parses older stored looks everywhere.
Save trigger: `saveLook(next: Look): void` on the customize store (useCustomizeStore.tsx); account goes through `createLookSaver`, guest through `writeGuestLook`. `apply()` calls it only when preview differs from active. `commitKey` calls `saveLook` explicitly.
Block list: `useSessionView()` over the timer store `blocks` / `currentBlockId` (09-07). `sessions` / `currentSession` in the timer store do NOT follow plan add/remove, so the Grid view gets counts from the view (`focusCount`, focus position) through optional `SessionsUI` props. No MISMATCH.

## Deviations from Plan

**1. [Rule 1 - Type] `readStored` schema type widened** (`ZodType<T, ZodTypeDef, unknown>`) in lib/storage/browser-storage.ts. A schema with `.default()` has a different input type, which broke `guest-look.ts` typecheck. No runtime change.
**2. [Minor] `SessionsUI` root `<main>` became a `<div>`.** It now sits inside the slot button (a second `main` landmark inside a button is invalid). `data-sessions-ui` moved to the slot as planned.
**3. [Minor] No new live region.** 09-07's `usePlanSync` already announces "Block N of M started" / "Break started" through the tasks-store region, so the slot adds none.
**4. [Minor] Customize helper line uses inline styles** (13px, line-height 1.4, margin-top 8px, 60% opacity) rather than a new class in the customize module.
**5. [Minor] First-frame paint script not extended** with `data-session-progress`: the slot reads the look from the store, nothing styles on the attribute yet.
**6. [Coordinator rule] Browser checks and the four screenshots not run** (need wrangler and env files); Task 3's screenshot verify clause was not run as written.
**7. Phase 3 file touched:** `useCustomizeStore.tsx` (new `commitKey`, attribute paint), `look.ts`, `catalog.ts` per plan.

## Behavior notes

- Under 640px or with no plan, the slot renders the existing grid for every view (phone Strip/Now arrive in 09-11).
- `openDeck(card, tab?, opener?)` stores `opener`; `useDeckCard` focuses it on close if connected and visible, else the footer trigger. `toggleDeck` clears it.
- Idle: `.bf-chrome-dim` opacity `var(--idle-opacity, 0.35)`; open switcher keeps all chrome awake via the `:has([data-session-switcher], [data-now-pick])` clause on both rules; also hidden under the phone sheet rule.
- Strip: widths from ResizeObserver on the row; overflow scrolls with mask and scrolls the current block into view.

## Verification

- `bun run src/lib/plan/strip.check.ts`: `strip.check OK`; `customize.check OK`; `persistence.check ok`; `plan.check OK`
- `bunx tsc --noEmit` for apps/next and packages/api: exit 0
- `bun run check`: exit 0; no `dangerouslySetInnerHTML` under components/progress

## Pending human checks

Needs the dev server (not run here):
- 1440: planning label "6 blocks  2 h 55 min · N tasks planned"; start a short session: Strip fills, add time shows hatch and "+N min added".
- Idle 3s: slot computed opacity 0.35, footer 0; open switcher: chrome stays awake.
- Pick Now, Grid, Strip; "Open session card" opens Tasks on Plan and focus returns to the slot on close.
- Customize > Style shows Session progress right after Timer progress and previews live.
- Reload: a switcher pick alone persists (guest: browser storage; signed in: network log shows `PUT /user/themes/active`).
- Pixel review and screenshots `09-08-strip-1440`, `09-08-now-1440`, `09-08-switcher-1440`, `09-08-idle-1440`.

## Commits

- 42b4494 feat(BFC-09-08): sessionProgress Look key, commitKey and Customize control
- ad8a33b feat(BFC-09-08): switchable progress slot with Strip, Now, Grid and idle dim

## Known Stubs

None. (`[data-now-pick]` clause is forward-looking for 09-09.)

## Threat Flags

None beyond the plan's threat model (T-09-24 enum default in strict schema, T-09-25 attribute only from enum, T-09-26 names rendered as React text).

## Self-Check: PASSED
