# 07-04 Summary - Turntable and shelf

## Built
- `labelInk(name)` (FNV-1a hue) and `playRecordState` (one bgMusic playing, default volume 0.4) in `lib/sounds/sounds.ts`, asserted in `sounds.check.ts`.
- Store actions `playRecord`, `pauseRecord`, `toggleRecord`; `toggleSound` routes bgMusic starts through `playRecordState`.
- `GlobalSoundsPlayer` onError: pauses the failing sound and toasts.
- `components/records/Shelf.tsx`: sleeves (click and native drag, MIME `application/x-befocus-record`), loading, error, empty and guest states.
- `components/records/Turntable.tsx`: top-view SVG, spin via `useMotionValue` + `useAnimationFrame`, tonearm, swap sequence, Play/Pause, Record volume, drop target. Reduced motion snaps.
- `RecordRoomBody`: status line and grid rows (turntable, reserved knob row, shelf).

## Verified
- tsc, biome, `sounds.check` green.
- Browser 1440 and 390 as guest: click plays and swaps, one record at a time, no horizontal overflow.
- Console: only the pre-existing dev hydration error (ReactPlayer Suspense).
- Not exercised by hand: native drag-drop (synthetic DnD in devtools is unreliable).
