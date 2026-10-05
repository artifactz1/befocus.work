---
phase: BFC-07-vinyl-sound-space
verified: 2026-10-05T08:40:10Z
status: human_needed
score: 7/7 must-haves verified in code
overrides_applied: 0
human_verification:
  - test: "Drag a sleeve from the shelf onto the platter in Chrome, Safari and Firefox"
    expected: "Platter outline highlights on drag over; on drop the record starts and replaces the current one"
    why_human: "07-04 SUMMARY states native drag-drop was never exercised by hand. Code is correct (RECORD_MIME set on dragstart, checked on dragover, playRecord on drop) but the draggable element is a <button>, which Firefox historically will not start a drag from"
  - test: "Play a record, add two ambience knobs, listen"
    expected: "Record and both ambiences are audible together; starting another record stops the first; knob volume changes are audible"
    why_human: "Real YouTube playback through hidden ReactPlayer iframes cannot be verified by grep"
  - test: "Paste a YouTube link with the room open while signed in, then refresh"
    expected: "Dialog opens with the name prefilled from the video title; the saved item sits on the chosen shelf or knob row after refresh"
    why_human: "Depends on browser CORS for youtube.com/oembed and a live API/DB"
  - test: "Screen reader pass (VoiceOver) and reduced motion (OS setting) on the room"
    expected: "Room, sleeves, knobs (value text Off / N%), play and options buttons announced; under reduced motion records swap instantly with no spin and no tonearm animation"
    why_human: "07-07 audit says reduced motion was reviewed in code only, not exercised"
  - test: "Visual check at 1440, 1024, 390x844 and 844x390"
    expected: "Room covers left half, timer shrinks right and keeps ticking; on phone the sheet sits below a visible timer strip; Material-style look matches 07-UI-SPEC"
    why_human: "Visual appearance and pixel fit"
---

# Phase 7: Vinyl Sound Space Verification Report

**Phase Goal:** The footer Sounds button opens a record room (top-view turntable, shelf of sleeves, ambience knobs) over the left half of the dashboard while the timer shrinks right and keeps running; one record at a time with ambience layered under it; the record keeps playing after the room closes.
**Verified:** 2026-10-05T08:40:10Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Deleting a sound works end to end and never comes back (#101, #102) | VERIFIED | `reconcileSounds` (lib/sounds/sounds.ts) treats server rows as truth and drops missing rows; `GlobalSoundsPlayer` now only calls `syncUserSounds(userSounds)` (old add-only merge gone). `useDeleteUserSound` does optimistic cache removal with rollback, starters handled locally via `hideStarter` + `deleteSound` (no 404 call). API `deleteUserSound` filters `id AND userId`, `.returning`, 404 on zero rows. `useUserSounds` gated on session (no guest 401). `sounds.check.ts` asserts a deleted row is dropped and hidden starters stay hidden; ran green. |
| 2 | Footer button opens room over left half; timer shrinks right and keeps counting; alarms moved to Session settings | VERIFIED | `RecordsButton` (Disc3, aria-expanded, data-records-trigger) in both `MenuSettings` and `MenuSettingsMobile`; `RecordRoom` mounted in `(app)/layout.tsx` and `guest/layout.tsx`. Desktop `.room` width `calc(50vw - 24px)` at left 16px; sets `html[data-room=open]`; `.stage` gets `translateX(25vw) scale(0.6)`. Timer state lives in the timer store, untouched by the room; `useTimerKeyboard` excludes `[data-record-room]` so Space still works. `AlarmPicker` rendered in `SessionSettings` and `SessionSettingsMobile`; legacy `components/sounds/*` and `SoundSettings*` deleted, no references remain. |
| 3 | Every music sound is a sleeve with label ink and name; click or drag to platter starts it; platter spins and tonearm rests while playing, both stop on pause; new record replaces old | VERIFIED (drag needs human) | `Shelf` maps every `bgMusic` sound to a sleeve with `labelInk(name)` gradient and name; click calls `toggleRecord`; `draggable` sets `RECORD_MIME`; `Turntable` drop calls `playRecord`. Spin via `useAnimationFrame` targets 0 when not playing; arm targets `ARM_DOWN` only while playing. `playRecordState` stops every other playing bgMusic; `toggleSound` also routes record starts through it. |
| 4 | Each ambient sound is a knob with its own volume; several play at once under the record | VERIFIED | `KnobRow` renders a `role=slider` `Knob` per `ambient` sound; `apply` sets per-id volume and toggles that id only; each sound has its own ReactPlayer in `GlobalSoundsPlayer`, and the one-record rule ignores ambience. `knobKeyValue` asserted in `sounds.check.ts`. |
| 5 | Signed-in paste of YouTube link anywhere in the room, confirm record or ambience (name prefilled from title), lands on matching row, survives refresh; guest sees starters only, no saving | VERIFIED | `RecordRoomBody` document paste listener while room is mounted: non-YouTube toasts, guest toasts "Sign in...", else opens `AddSoundDialog`. Dialog fetches oEmbed title into Name (abortable, never overrides typing), Record/Ambience radiogroup, `useSound` POSTs and writes into the `userSounds` cache, which `reconcileSounds` adds to the store under its `soundType`. API `insertSoundSchema`/`updateSoundSchema` refine with shared `isYouTubeUrl` (hostname allowlist). Guests: add tiles and `SoundOptions` gated on `session`, `useUserSounds` disabled, sign-in footnote. |
| 6 | Closing the room while a record plays shows a footer chip that fades with footer idle, can pause or reopen | VERIFIED | `NowPlayingChip` in both footer menus, visible when `!roomOpen && (record.playing || chipHeld)`; Pause/Play button and "Open records" button (closes customize, `setRoomOpen(true)`). Footer wrapper in `Footer.tsx` carries `bf-chrome`, so the idle fade in globals.css applies to the chip. |
| 7 | Phone bottom sheet with same content and timer visible above; keyboard and screen reader; reduced motion swaps instantly with no spin | VERIFIED (needs human pass) | Below 1024px `RecordRoom` renders a non-modal vaul Drawer with the same `RecordRoomBody`, height `min(60dvh, 560px)`; `.stage` becomes a fixed strip above it. Heading focus on open, focus return to trigger on close, Escape (yields to inner dialogs/menus), Tab cycling in the sheet, labelled controls, `aria-live` status. `useReducedMotion` short-circuits spin, arm and swap; CSS disables chip disc spin and stage/sleeve transitions. |

**Score:** 7/7 truths verified in code

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `apps/next/src/lib/sounds/sounds.ts` | VERIFIED | reconcile, starters, labelInk, playRecordState, knobKeyValue; used by store, hooks, components |
| `apps/next/src/lib/sounds/sounds.check.ts` | VERIFIED | runs green |
| `apps/next/src/store/useSoundsStore.tsx` | VERIFIED | roomOpen, chipHeld, playRecord/pauseRecord/toggleRecord, syncUserSounds |
| `apps/next/src/hooks/useSounds.ts` | VERIFIED | optimistic delete, session-gated query, add writes cache |
| `packages/api/src/routes/user/user.handler.ts` | VERIFIED | owner-scoped delete with 404 |
| `packages/api/src/lib/youtube.ts` + `db/tables/sounds.ts` | VERIFIED | YouTube-only schemas, shared with client |
| `apps/next/src/components/records/*` (RecordRoom, RecordRoomBody, RecordsButton, Turntable, Shelf, KnobRow, NowPlayingChip, AddSoundDialog, SoundOptions, CSS) | VERIFIED | substantive, all wired (layouts, footer menus, room body) |
| `apps/next/src/components/settings/AlarmPicker.tsx` | VERIFIED | wired into both Session settings shells; Timer reads `alarmId` url and volume |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| RecordsButton | RecordRoom | `useSoundsStore.roomOpen` | WIRED |
| RecordRoom | Timer stage | `html[data-room=open]` + `.stage` CSS | WIRED |
| Shelf sleeve | Turntable | `RECORD_MIME` dataTransfer, `playRecord` | WIRED (runtime unverified) |
| AddSoundDialog | API POST /user/sounds | `useSound` -> `api.user.sounds.$post` -> cache -> `syncUserSounds` | WIRED |
| SoundOptions | API DELETE | `useDeleteUserSound` | WIRED |
| Store sounds | Audio | `GlobalSoundsPlayer` ReactPlayer per sound (mounted on `(app)/page.tsx` and `guest/page.tsx`) | WIRED |
| AlarmPicker | Timer alarm | `alarmId` / alarm volume in store | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Shelf / KnobRow | `state.sounds` | STARTER_SOUNDS + `GET /user/sounds` via reconcile | Yes (DB query in handler) | FLOWING |
| Turntable / chip | `sounds[bgMusicId]` | store, set by playRecord | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Delete reconcile, starters, labelInk, one-record rule, knob keys, YouTube validator | `bun run src/lib/sounds/sounds.check.ts` | `sounds.check OK` | PASS |
| Next app typechecks | `bunx tsc --noEmit -p apps/next` | exit 0 | PASS |
| API typechecks | `bunx tsc --noEmit` in packages/api | exit 0 | PASS |
| Lint / format / imports | `bun run check` | clean | PASS |

### Probe Execution

None declared; no `scripts/*/tests/probe-*.sh`. Skipped.

### Requirements Coverage

| Req | Plan | Status | Evidence |
|-----|------|--------|----------|
| VNL-01 | 07-01 | SATISFIED | Truth 1 |
| VNL-02 | 07-02, 07-03 | SATISFIED | Truth 2 |
| VNL-03 | 07-04 | SATISFIED | Truth 3 |
| VNL-04 | 07-04 | SATISFIED (drag needs human) | Truth 3 |
| VNL-05 | 07-05 | SATISFIED | Truth 4 |
| VNL-06 | 07-06 | SATISFIED | Truth 5 |
| VNL-07 | 07-05 | SATISFIED | Truth 6 |
| VNL-08 | 07-02, 07-07 | SATISFIED (needs human pass) | Truth 7 |

No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | No TBD/FIXME/XXX/TODO in phase files | - | - |
| `components/records/KnobRow.tsx` | empty state | Guest empty copy says "Paste a YouTube link to add one." though guests cannot add | Info | Only reachable if a guest has every ambient starter hidden from an earlier signed-in session on the same browser |
| `components/records/Turntable.tsx` | `shown` state | Label ink only refreshes on record id change, so renaming the loaded record keeps the old ink until the next swap | Info | Cosmetic |
| `store/useSoundsStore.tsx` / `reconcileSounds` | - | With `rows` undefined (signed out) custom sounds already in the store are kept | Info | After sign-out without reload the previous user's records stay in memory until refresh |

### Human Verification Required

1. **Drag to platter across browsers** - drag a sleeve onto the platter in Chrome, Safari and Firefox. Expected: drop target highlights, record starts and replaces the current one. Why human: never exercised by hand (07-04 SUMMARY); the drag source is a `<button>`, which Firefox has historically refused to drag.
2. **Layered audio** - play a record plus two ambiences. Expected: all audible together, a new record stops the old one. Why human: real YouTube playback.
3. **Paste-to-add with refresh** - signed in, paste a YouTube link in the room. Expected: title prefilled, saved to the chosen row, still there after refresh. Why human: live oEmbed CORS and DB.
4. **Screen reader and reduced motion** - VoiceOver pass and OS reduced motion. Expected: controls announced with values; instant swap, no spin. Why human: reduced motion was only reviewed in code.
5. **Visual fit** - 1440, 1024, 390x844, 844x390. Expected: left-half room, timer shrinks right and ticks; phone sheet below a visible timer strip. Why human: visual.

### Gaps Summary

No blocking gaps. All seven success criteria and VNL-01..VNL-08 are implemented and wired in code, the regression check, both typechecks and Biome pass. Status is human_needed because native drag-drop, real audio layering, the oEmbed prefill and the reduced-motion/screen-reader behaviour can only be confirmed in a browser, and drag-drop in particular was never exercised by the executor.

---

_Verified: 2026-10-05T08:40:10Z_
_Verifier: Claude (gsd-verifier)_
