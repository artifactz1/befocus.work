## Interface check

Layout: (app)/layout.tsx: HydrationBoundary > TimerStoreProvider > CustomizeStoreProvider > children, CustomizePanel, RecordRoom, SessionCard. Guest: app/guest/layout.tsx only renders GuestShell; app/guest/GuestShell.tsx holds TimerStoreProvider(null, guest) > CustomizeStoreProvider > RecordRoom, SessionCard guest.
DashboardShell: absent (grep finds nothing).
Timer: components/timer/Timer.tsx line 42-45, `strip = roomOpen && narrow`; `.under` div at line 281.
Room state: store/useSoundsStore.tsx (def), records/NowPlayingChip.tsx, records/RecordRoomBody.tsx, records/RecordRoom.tsx, records/RecordsButton.tsx, timer/Timer.tsx, customize/useCustomizeActions.ts, and components/settings/useSessionCard.ts (line 14, `setRoomOpen(false)` in closeOthers).

MISMATCH: components/settings/useSessionCard.ts (Phase 8 session card, not listed in the plan's interfaces nor files_modified) also calls `useSoundsStore.getState().setRoomOpen(false)`. Removing roomOpen/setRoomOpen breaks it. Execution stopped after Task 0; no source changes made. The plan needs a revision to add useSessionCard.ts (swap to `useDeckStore.getState().closeDeck()`), and a decision on whether the session card must also close the Tasks card in 09-03. Also note SessionCard is mounted in both layouts and the guest providers live in GuestShell.tsx, not guest/layout.tsx (same behaviour, rename only).
