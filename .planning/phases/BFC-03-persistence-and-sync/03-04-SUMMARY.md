---
phase: 03-persistence-and-sync
plan: 04
subsystem: ui
tags: [zustand, first-paint, next]
provides:
  - "useCustomizeStore: mode, saveLook, apply that saves, guest hydration, unmount apply"
  - "LookPaintScript server component, wired into (app) and guest layouts"
  - "GuestShell client shell; guest layout is now a server component"
---

# Plan 03-04 Summary

## HTML order

`/guest` served by the dev server: paint script at byte 3592 (inside `<body>`), first `<main` at 20426,
`data-customize` at 43399. Script first. It carries the `befocus.lookPaint` key and `t=null`, so no
account data is in the guest page. The signed-in `/` could not be fetched locally (no database
allowed), so the account background-hex check is a pending human check; the layout always passes
`lookToTokens(look ?? DEFAULT_LOOK)` for a signed-in user.

## Seam map
Guest storage: apps/next/src/lib/storage/browser-storage.ts readStored<T>(key, schema, storage?): T | null and writeStored(key, value, storage?): boolean; guest look keys befocus.themes, befocus.activeThemeId, befocus.lookPaint (apps/next/src/lib/customize/guest-look.ts)
Hydration owner: account = server initialLook from (app)/layout.tsx getUserSettings() (FND-05 owner unchanged); guest = readGuestLook() once in CustomizeStoreProvider's paint effect
Preference persistence: Session progress style is look.progress (PROGRESS_IDS) inside the look; signed-in = PUT /user/themes/active into themes.look (jsonb), validated by lookSchema from packages/types/look.ts, read back on GET /user/settings; guest = writeGuestLook via writeStored under befocus.themes
Save trigger: useCustomizeStore action saveLook(look: Look): void (apps/next/src/store/useCustomizeStore.tsx), callable directly; apply() (Done, close, Escape, route leave, unmount with panel open) calls it when preview differs from active

## Notes

`reportSaveFailed` and `reportStorageBlocked` are console stubs; 03-05 wires the toasts.
