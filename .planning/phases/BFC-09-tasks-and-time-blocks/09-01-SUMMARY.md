---
phase: BFC-09-tasks-and-time-blocks
plan: 01
subsystem: ui
tags: [zustand, quiet-deck, record-room]
requires: []
provides:
  - useDeckStore (single open-card value), useDeckRootAttrs, useDeckCard
affects: [09-03]
tech-stack:
  added: []
  patterns: [single open-card value for exclusive deck cards]
key-files:
  created: [apps/next/src/store/useDeckStore.ts]
  modified:
    - apps/next/src/store/useSoundsStore.tsx
    - apps/next/src/components/records/RecordRoom.tsx
    - apps/next/src/components/records/RecordRoomBody.tsx
    - apps/next/src/components/records/RecordsButton.tsx
    - apps/next/src/components/records/NowPlayingChip.tsx
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/customize/useCustomizeActions.ts
    - apps/next/src/components/settings/useSessionCard.ts
    - apps/next/src/components/settings/MenuSettings.tsx
    - apps/next/src/components/settings/MenuSettingsMobile.tsx
  deleted: [apps/next/src/components/to-do-list/ (4 files)]
key-decisions:
  - "Deck value lives in its own store, not useSoundsStore"
  - "Escape guard excludes [data-deck-card] dialogs instead of [data-record-room] so 09-03 only needs the attribute"
requirements-completed: [TSK-01]
duration: n/a
completed: 2026-10-21
---

# Phase 9 Plan 01: Quiet Deck single open-card value Summary

Record room now runs on `useDeckStore.deck` ('records' | 'tasks' | null) with shared card effects in `useDeckCard`; the old to-do-list popover and drawer are gone.

## Interface check

Layout: (app)/layout.tsx: HydrationBoundary > TimerStoreProvider > CustomizeStoreProvider > children, CustomizePanel, RecordRoom, SessionCard. Guest: app/guest/layout.tsx renders GuestShell; GuestShell.tsx holds TimerStoreProvider(null, guest) > CustomizeStoreProvider > RecordRoom, SessionCard guest.
DashboardShell: absent (grep finds nothing).
Timer: components/timer/Timer.tsx, `strip` computed near line 45; `.under` div near line 281.
Room state: useSoundsStore.tsx (def), NowPlayingChip, RecordRoomBody, RecordRoom, RecordsButton, Timer, useCustomizeActions, and settings/useSessionCard.ts (not in the plan).

## Deviations from Plan

**1. [Coordinator-authorized] useSessionCard.ts edited** - Phase 8 file called `setRoomOpen(false)`; replaced with `useDeckStore.getState().closeDeck()` (same behaviour). Commit 9254543.

**2. [Rule 3] Local variable rename** - `roomOpen`/`setRoomOpen` locals in records components renamed to `isOpen`/`setOpen` so the acceptance grep for `roomOpen` is empty.

**3. Added `data-deck-card`** on the room's dialog/sheet (alongside `data-record-room`) so the shared Escape guard is card-agnostic.

## Commits

- 9254543 feat(BFC-09-01): move the Quiet Deck to one open-card value
- e52897f refactor(BFC-09-01): remove the old to-do-list popover and drawer

## Verification

- `bunx tsc --noEmit -p apps/next/tsconfig.json`: exit 0
- `bun run check`: exit 0
- `grep roomOpen apps/next/src`: empty; to-do-list directory removed; menus have no to-do-list imports

## Deferred / human checks

The Task 2 browser regression (1440 and 390, `09-01-records-*.png`) was NOT run: it needs `bun run api`, which runs wrangler and reads `.dev.vars`, both forbidden for this executor. Human check pending: room open sets `data-room=open`/`data-deck=records`, Escape closes and returns focus to the Records button, Customize and room exclude each other, chip opens the room, footer has no to-do button, phone timer drops to the 132px strip.

## Known Stubs

None. The footer has no Tasks entry until 09-03 (intentional).

## Self-Check: PASSED
