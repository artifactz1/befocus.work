# 07-05 Summary - Ambience knobs and now-playing chip

## Built
- `knobKeyValue` pure helper (arrows, page keys, Home/End, Enter/Space toggle, clamped) with assertions in `sounds.check.ts`.
- `KnobRow.tsx`: `role='slider'` knob (SVG arc, keyboard, vertical pointer drag, click toggles), one per ambient sound, empty and loading states. Volume above 0.01 starts the sound, 0 stops it.
- `NowPlayingChip.tsx` and `now-playing.module.css`: full (>= 640px) and compact variants in `MenuSettings` and `MenuSettingsMobile`. Pausing from the chip sets `chipHeld` so it can resume; opening the room clears it.

## Deviations
- The chip has no `bf-chrome` class of its own: the footer already carries it, so the idle fade is inherited.
- Per-knob Rename/Delete menu and the Add knob belong to 07-06.

## Verified
- sounds.check, tsc, biome green. Browser as guest at 1440 and 390: knob keys (40%, 100%, Off), drag, record plus ambience together, chip pause/resume/open, focus lands on the room heading, no horizontal overflow.
