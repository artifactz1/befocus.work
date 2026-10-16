# 07-02 Summary - Records entry and room shell

## Done
- Removed legacy sounds UI (`components/sounds/*`, `SoundSettings*`); store trimmed to `roomOpen`, alarm, bg music, ambient state.
- `GlobalSoundsPlayer` simplified (no progress/duration/ref plumbing).
- Footer `RecordsButton` (Disc3, "Records" tooltip, `aria-expanded`, `data-records-trigger`) placed after ToDo in both menus.
- `RecordRoom` shell: desktop left-half `motion.section` (`role=dialog`, `data-record-room`), phone vaul bottom sheet. Mirrors customize panel lifecycle: heading focus, focus return to trigger, Escape, close on route change, `html[data-room=open]`.
- Room and customize inspector are mutually exclusive (open one closes the other).
- `useTimerKeyboard` no longer treats the room as a blocking dialog, so Space still drives the timer.

## Verified (browser)
- 1440: room rect 16,16 696x749; focus lands on `#records-heading`; Escape closes and returns focus; opening customize closes room and vice versa; Space starts the timer with room open.
- 390: bottom sheet opens, focus on heading, Escape closes.
- tsc, `bun run check` clean.

## Notes
- Pre-existing: dev-only hydration warning on `/guest` from ReactPlayer's Suspense wrapper (not introduced here).
- Room body is empty; turntable, shelf and knobs land in 07-04..07-06. Alarm picker moves to Session settings in 07-03.
