---
phase: 03-persistence-and-sync
plan: 01
subsystem: ui
tags: [localStorage, zod, first-paint]
provides:
  - "apps/next/src/lib/storage/browser-storage.ts: defaultStorage(), readStored(key, schema, storage?), writeStored(key, value, storage?)"
  - "apps/next/src/lib/customize/guest-look.ts: readGuestLook, writeGuestLook, GUEST_* keys"
  - "apps/next/src/lib/customize/look-saver.ts: createLookSaver (coalescing, latest wins)"
  - "apps/next/src/lib/customize/look-paint.ts: buildPaintScript (allow-listed, escaped first-frame script)"
key-files:
  created: [browser-storage.ts, browser-storage.check.ts, guest-look.ts, look-saver.ts, look-paint.ts, persistence.check.ts]
  modified: [sounds.ts, session.ts, guest/page.tsx]
---

# Plan 03-01 Summary

Shared safe localStorage helper plus guest look storage, coalescing saver and paint script.

## Exports

- `defaultStorage(): Storage | undefined`
- `readStored<T>(key: string, schema: ZodType<T>, storage?: Pick<Storage, 'getItem'>): T | null`
- `writeStored(key: string, value: unknown, storage?: Pick<Storage, 'setItem'>): boolean`

sounds.ts, session.ts and the guest intro flag now use the helper; stored formats unchanged.

## Verification

browser-storage.check.ts, persistence.check.ts, sounds.check.ts, session.check.ts pass. Biome clean.
