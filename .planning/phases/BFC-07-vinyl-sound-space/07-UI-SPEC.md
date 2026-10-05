---
phase: 7
slug: vinyl-sound-space
status: draft
shadcn_initialized: true
preset: not applicable (packages/ui/components.json, style default, baseColor zinc, cssVariables)
created: 2026-10-05
---

# Phase 7 - UI Design Contract: Vinyl Sound Space

> Visual and interaction contract for the record room. Sources: 07-CONTEXT.md (locked decisions),
> vinyl board report "Final decisions", existing customize inspector (PR #114), globals.css.
> Values marked (default) are researcher picks inside Claude's Discretion.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (existing, `packages/ui`) |
| Preset | not applicable |
| Component library | Radix (via `@repo/ui`), vaul for the phone sheet |
| Icon library | lucide-react (`Disc3`, `Play`, `Pause`, `X`, `Plus`, `MoreHorizontal`, `Pencil`, `Trash2`) |
| Font | `var(--font-app)` (Inter Tight, follows the customize font pick); `var(--font-mono)` for numeric readouts |
| Animation | framer-motion (installed) + CSS. No new dependency (no DnD, 3D or animation lib) |
| Surface pattern | Reuse `customize-panel.module.css` vars: `--panel-surface`, `--panel-soft`, `--panel-lift`, `--panel-hair`, `--panel-muted`, `.closeBtn`, `.label`, `.live`, `.grab` |

---

## Layout

Breakpoint is `(min-width: 1024px)`, identical to `CustomizePanel.tsx` (desktop shell vs sheet).
Room open state is mirrored to `html[data-room="open"|"closed"]` (same pattern as `data-panel`).
Reuse `useSoundsStore.isSoundSettingsOpen` as the room-open flag (it already exists and the alarm
preview already listens to it); rename optional.

### Desktop (>= 1024px)

| Element | Rule |
|---------|------|
| Room card | `position: fixed; top: 16px; left: 16px; bottom: calc(11vh + var(--pad-y)); width: calc(50vw - 24px); z-index: 30; border-radius: 18px; border: 1px solid var(--panel-hair); background: var(--panel-surface); box-shadow: 0 24px 60px rgb(0 0 0 / 0.45)` |
| Why bottom stops above footer | Footer `TimerButtons` (bottom-left) stay visible and clickable while the room is open |
| Room grid | rows `auto minmax(0,1fr)`; head padding `16px 12px 8px 24px`; body padding `8px 24px 24px`, `display: grid; grid-template-rows: minmax(0,1fr) auto auto; gap: 24px`, `overflow-y: auto; overscroll-behavior: contain` |
| Turntable deck | Fills row 1; square `height: 100%; max-height: 440px; aspect-ratio: 1; max-width: 100%; justify-self: center`. Min 240px (body scrolls below that) |
| Timer shrink | Apply to the `absolute inset-0` digit wrapper in `Timer.tsx` only (not the root, so fixed `edgeTrack/edgeFill` are unaffected): `html[data-room="open"]` -> `transform: translateX(25vw) scale(0.64)`; `transform-origin: center`. Math: full timer is about 62vw wide at the 25vw digit basis; x0.64 = about 40vw, centred at 75vw, so it spans about 55vw-95vw, clear of the room edge at `50vw - 8px`. Holds for all densities (compact 1.07 -> 42.5vw) and the 30vh landscape basis. Transform only, so the timer keeps counting and never re-lays out |
| Session counter | `html[data-room="open"]` hides the desktop `SessionsUI` block (`opacity: 0; visibility: hidden`, 0.3s). Session title (header right) stays |
| Key hints | Hide `.hints` while room open (extend existing `html[data-panel="open"] .hints` rule) |
| Chrome idle | Room open keeps chrome awake: extend selector to `html[data-chrome-idle]:not([data-panel="open"]):not([data-room="open"])` |

### Phone and tablet (< 1024px)

| Element | Rule |
|---------|------|
| Sheet | vaul `Drawer`, `modal={false}`, `shouldScaleBackground={false}`, `handleOnly`, same as `CustomizePanelMobile`. Geometry: `left: 10px; right: 10px; bottom: 10px; height: min(60dvh, 560px); border-radius: 24px; z-index: 50`; reuse `.sheet` timing and `.grab` handle |
| Sheet body | Single column, scrolls: head, turntable (`width: min(100%, 280px)`), knob row, shelf. Padding `8px 16px 24px`, gap 24px |
| Timer above sheet | `html[data-room="open"]` (< 1024): digit wrapper becomes `position: fixed; inset: 0 0 auto 0; height: calc(100dvh - min(60dvh, 560px) - 20px)`, centred. Add `scale(0.72)` when `(max-height: 500px)` (landscape phones) |
| Chrome | Hide `.bf-chrome` and `[data-edge-progress]` while room open, same as the existing `data-panel` rule under 1024px |

### Room and customize inspector coexistence (decision)

Mutually exclusive on every breakpoint. Opening Records calls `useCustomizeActions().close()`
(the live model keeps changes, so nothing is lost); opening Customize closes the room. Reason:
room (50vw) + inspector (360px) leaves under 340px for the timer at 1440px wide, which breaks
the shrink math above. Only one of `data-panel="open"` / `data-room="open"` is ever set.

---

## Room Anatomy

### Head (row 1)

| Slot | Spec |
|------|------|
| Heading | `<h2 id="records-heading" tabIndex={-1}>` "Records", 16px/600, no focus ring (programmatic target, like `#customize-heading`) |
| Status line | Under heading, 13px/400 `--panel-muted`, `aria-live="polite"`. Copy per state (see Copywriting). Playing state prefixes the `.live` accent dot |
| Close | `.closeBtn` 32px (44px hit area on phone via padding), `X` 16px, `aria-label="Close records"` |
| Phone | Head is centred like `.sheet .head`; grab handle above |

### Turntable (top view, SVG + HTML controls)

SVG `viewBox="0 0 400 400"`, `aria-hidden`. Material style: realistic, low-gloss, flat fills with
one soft gradient per part. Illustration colors below are decorative and fixed (not themeable).

| Part | Geometry (viewBox units) | Fill |
|------|-------------------------|------|
| Plinth | rect 0,0 400x400, rx 20 | linear 180deg `#22201e` -> `#181716`; inner hairline `rgb(255 255 255 / 0.08)` |
| Platter rim | circle c(176,200) r150 | `#2c2a28`, 1px `rgb(255 255 255 / 0.06)` edge |
| Slipmat | circle r146 | `#1a1918` |
| Record (when loaded) | circle r140 | `#0c0c0c`; grooves = `repeating-radial-gradient` rings every 3 units at `rgb(255 255 255 / 0.035)` between r52-r138; static sheen overlay (conic, 2 soft highlights at 35deg/215deg, `rgb(255 255 255 / 0.06)`) that does NOT rotate |
| Label | circle r48, generated ink (see Label Ink); inner ring r44 stroke 1 `ink-deep`; a 10x4 rounded mark at r30 in `rgb(255 255 255 / 0.7)` so rotation is visible |
| Spindle | circle r4 `#cfcac3` |
| Tonearm pivot | circle c(344,72) r22, radial `#c9c4bd` -> `#6f6a64`; counterweight rect behind pivot 20x26 `#3a3735` |
| Arm | 4-unit stroke `#bdb8b2`, round caps, pivot -> headshell; headshell rect 14x22 rx2 `#d8d3cc` |
| Arm rest | small post c(352,300) r6 `#3a3735` |
| Arm angles (default) | Rest: 0deg (headshell on the rest). Playing: rotate about pivot so the stylus sits at r~128 of the platter, start at 22deg and tune visually |
| Play/Pause | HTML `<button>` absolutely placed over plinth bottom-left (left 16px, bottom 16px of deck), 44x44, radius 999, bg `rgb(255 255 255 / 0.08)`, icon 18px `Play`/`Pause`. `aria-label="Play {name}"` / `"Pause {name}"`; disabled with `aria-label="No record loaded"` when platter empty |
| Record volume | Native `<input type="range">` styled vertical (`writing-mode: vertical-lr; direction: rtl`), right edge of deck (right 20px, bottom 20px), 120px tall, `accent-color: hsl(var(--foreground))`, `aria-label="Record volume"`, 0-100 step 1, bound to the loaded `bgMusic` `volume`. Reads as the pitch fader |
| Drop target | Platter area (r150) accepts drops. Drag-over: 2px ring at r152 in `--user-accent` |

Loaded record = `useSoundsStore.bgMusicId` (exists, default `jazz`). Platter shows it at rest when
paused; empty slipmat when the id no longer exists (deleted).

### Shelf of sleeves

| Property | Value |
|----------|-------|
| Section label | `.label` style (11px/600 uppercase, tracking 0.12em, muted) "Shelf" |
| Container | `role="list"`, single row, `display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x proximity; padding-bottom: 12px`; a 1px `--panel-hair` ledge line under the sleeves |
| Sleeve | `<li>` containing a `<button>` 96x96 (88x88 on phone), radius 6, `scroll-snap-align: start` |
| Sleeve face | linear 160deg `sleeve` -> `sleeve-deep` (Label Ink); centred circle d56 in `ink`, inner hole d8 `#0c0c0c`; 1px inset `rgb(255 255 255 / 0.08)` |
| Name | Below sleeve, width 96, 13px/400 foreground, 2-line clamp, `margin-top: 8px` |
| Loaded state | Sleeve face at opacity 0.55 (the record is on the platter) + 6px `--user-accent` dot top-right of the sleeve when playing; `aria-pressed={playing}` |
| Hover / focus | Hover: `translateY(-2px)` 0.15s. Focus: `outline: 2px solid hsl(var(--ring)); outline-offset: 2px` |
| Options | `MoreHorizontal` 28px button, top-right inside sleeve, visible on hover/focus-within (always visible on touch), `aria-label="Options for {name}"`, opens `DropdownMenu`: Rename, Delete. Signed-in only |
| Add tile | Last item, signed-in only: 96x96 dashed 1px `rgb(255 255 255 / 0.2)` radius 6, `Plus` 20px, name slot "Add record". Opens the Add dialog empty with type Record |
| Click | Not loaded: load + play (replaces any playing record). Loaded + playing: pause. Loaded + paused: play |
| Drag | `draggable`, `dataTransfer.setData('application/x-befocus-record', id)`, `effectAllowed='copy'`; drop on platter = same as click. Enhancement only; click is the accessible path. No touch drag |

### Ambience knobs

| Property | Value |
|----------|-------|
| Section label | `.label` "Ambience" |
| Row | `display: flex; gap: 16px; overflow-x: auto`, items 80px wide |
| Knob | 64x64 SVG, `role="slider"` on the wrapper, `tabIndex={0}` |
| Track | 270deg arc (-135deg to +135deg) r28, stroke 3, `rgb(255 255 255 / 0.12)`, round caps |
| Value arc | Same arc to `-135 + vol*270`; `--user-accent` when on, none at 0 |
| Cap | circle r22, linear 180deg `#3a3735` -> `#242120`, 1px `rgb(255 255 255 / 0.1)`; pointer line 2x8 `hsl(var(--foreground))` at the value angle |
| Name | 13px/400, single line ellipsis, max 80px, centred, `margin-top: 8px` |
| Value | 11px mono `--panel-muted`, "40%" or "Off" |
| Options | Same `MoreHorizontal` menu as sleeves (Rename, Delete), signed-in only, shown on hover/focus-within at top-right of the 80px item |
| Add knob | Last item, signed-in only: dashed 64px circle + `Plus`, name "Add ambience". Opens the Add dialog with type Ambience |

Knob interaction:

| Input | Effect |
|-------|--------|
| ArrowUp / ArrowRight | +5% |
| ArrowDown / ArrowLeft | -5% |
| PageUp / PageDown | +/-10% |
| Home / End | 0% (off) / 100% |
| Enter / Space | Toggle: on -> 0; off -> last non-zero volume, else 40% |
| Pointer drag | Vertical, pointer capture, up increases, 1% per 2px; `touch-action: none` on the knob |
| Pointer click (< 3px movement) | Same as Enter |
| Semantics | Reuse existing slider logic: volume > 0.01 starts the sound, 0 stops it (`setVolume` + `toggleSound`) |
| ARIA | `aria-label="{name}"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow`, `aria-valuetext="{n}%"` or `"Off"`. All handled keys call `preventDefault` |

### Paste-add dialog

Trigger: `paste` listener on `document` while the room is open, ignored when the target is an
input/textarea/contenteditable or another modal is open. Also opened by the Add tile / Add knob.

| Property | Value |
|----------|-------|
| Component | `@repo/ui/dialog` (modal), max-width 400px, padding 24px, radius 18px, bg `--panel-surface` |
| Title | "Add to your room" 16px/600 |
| URL field | `Input` prefilled with the pasted link, label "YouTube link" |
| Name field | `Input`, label "Name", prefilled from the link title (YouTube oEmbed). While fetching: placeholder "Fetching title...", field enabled. On fetch failure: empty, focus moves to it. Max 80 chars |
| Type | Radio segmented control (reuse `.seg` / `.segItem` / `.segLabel`), `role="radiogroup"` `aria-label="Add as"`: "Record" (default) / "Ambience". Helper below, 13px muted: Record "Plays on the turntable, one at a time." / Ambience "A knob that layers under the record." |
| Actions | Right-aligned, gap 8: ghost "Cancel", primary "Add record" or "Add ambience" (label follows type). Pending: "Adding..." and disabled |
| Validation | Same YouTube regex as `AddSoundButton.tsx` (that file is removed). Inline error 13px `hsl(var(--destructive-foreground))` on `--destructive` tint row |
| Success | Close dialog, new sleeve/knob fades in (0.3s), scrolls into view, receives focus. Saves `bgMusic` / `ambient` via existing `useSound` mutation |
| Inputs | 16px text on all breakpoints (prevents iOS zoom) |

Rename reuses the same dialog: title "Rename", only the Name field, primary "Save name".

### Now-playing chip

Shown when the room is closed and the loaded record is playing; stays (paused state) after it was
paused from the chip; hidden when the room opens or the record is deleted. Lives inside the
footer, so it inherits `.bf-chrome` idle fade with no extra code.

| Variant | Spec |
|---------|------|
| Full (>= 640px) | First child of `MenuSettings` (right group), `margin-right: 8px`. Height 44, radius 999, padding 4px 12px 4px 4px, bg `color-mix(in srgb, var(--fg) 8%, transparent)`, 1px `rgb(255 255 255 / 0.08)` border. Contents: play/pause button 36px circle (`aria-label="Pause {name}"`/`"Play {name}"`) + open button (mini disc 24px with label ink, then name 13px/400, max-width 160px ellipsis, `aria-label="Open records, {name}"`). Playing shows the accent dot before the name |
| Compact (< 640px) | In `MenuSettingsMobile`, before the Records button: two 44px icon buttons (play/pause, mini-disc open). Name only in aria-labels |
| Mini disc | 24px: `#0c0c0c` disc, ink label d10. Spins 3.6s/rev while playing; static under reduced motion |

### Footer Records button

Replaces `SoundSettings` in `MenuSettings.tsx` and `SoundSettingsMobile` in `MenuSettingsMobile.tsx`
(same slot). `MenuButton` bare, icon `Disc3`, tooltip "Records" (`side='top'`, forced closed while the
room is open, same Escape reason as `CustomizeButton`), `aria-label="Records"`,
`aria-expanded={roomOpen}`, `data-records-trigger`. While open: `bg-foreground/[0.07] text-foreground`.

### Alarm picker in Session settings

Remove the Alarm tab. Add an "Alarm" block to `SessionSettings.tsx` and `SessionSettingsMobile.tsx`,
after `SessionsInput`, before Save.

| Element | Spec |
|---------|------|
| Label | "Alarm sound" 13px/600 |
| Select | Existing `Select`, full width minus preview button, options show `sound.name` ("Alarm 1"), not ids |
| Preview | 40x40 outline button, `Play`/`Pause` icon, `aria-label="Preview alarm"`. Plays once, press again stops. Selecting no longer autoplays |
| Volume | Existing `Slider`, `aria-label="Alarm volume"`, under the select, gap 12px |
| Apply | Alarm choice and volume apply immediately; they are NOT gated by Save (Save resets the timer behind a confirm) |

---

## Label Ink

Seeded from the sound name, no migration. Deterministic and stable across reloads.

```
seed  = name.trim().toLowerCase()
hash  = FNV-1a 32-bit(seed)
h     = hash % 360
ink        = hsl(h 62% 52%)   // label disc, sleeve circle, chip mini label
ink-deep   = hsl(h 62% 36%)   // label inner ring
sleeve     = hsl(h 28% 18%)   // sleeve gradient start
sleeve-deep= hsl(h 28% 11%)   // sleeve gradient end
```

Inks are decorative (`aria-hidden`), never carry text, never used for state. Renaming changes the
ink (accepted; no stored color).

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, chip inner padding |
| sm | 8px | Name under sleeve/knob, action gaps, room head bottom padding |
| sm+ | 12px | Sleeve gap, alarm block gap |
| md | 16px | Room inset from viewport, knob gap, deck control offsets, phone sheet padding |
| lg | 24px | Room body padding, section gap, dialog padding |
| xl | 32px | Not used inside the room; reserved |

Exceptions: 10px phone sheet inset (inherited from `.sheet`); 44px minimum touch targets
(play/pause, chip buttons, close on phone); sleeve 96px / 88px phone; knob 64px.

---

## Typography

Two weights only: 400 and 600. Font `var(--font-app)`; `var(--font-mono)` for knob values.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label (section caps, knob value) | 11px | 600 caps / 400 mono | 1.2, tracking 0.12em for caps |
| Body (names, status line, helper, chip, buttons in room and dialog) | 13px | 400 (buttons 600) | 1.4 |
| Heading (room "Records", dialog titles) and form inputs | 16px | 600 heading / 400 input | 1.3 heading / 1.5 input |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--bg-solid)` default `hsl(0 0% 6.3%)` | Dashboard behind the room |
| Secondary (30%) | `--panel-surface` = `color-mix(in srgb, var(--bg-solid), #fff 5%)` | Room card, phone sheet, dialog; `--panel-soft` / `--panel-lift` for hover fills |
| Accent (10%) | `var(--user-accent)` (default `#f5f5f4`) | Reserved list below |
| Destructive | `hsl(var(--destructive))` = `hsl(0 62.8% 30.6%)` | Delete confirm action, inline form error tint only |
| Illustration | Fixed turntable palette + generated inks | Decorative only |

Accent reserved for: (1) status-line `.live` dot while a record plays, (2) the playing dot on the
loaded sleeve, (3) knob value arcs when on, (4) platter drag-over ring, (5) chip playing dot.
Nothing else in the room uses accent; buttons use foreground/ghost styles. The old green
`BorderBeam` is not carried over.

---

## States

| State | Behaviour |
|-------|-----------|
| Loading (signed-in user sounds query pending) | Starter sleeves/knobs render immediately (client-seeded). Append 2 skeleton sleeves (96px, `--panel-soft`, radius 6) and 1 skeleton knob (64px circle). Pulse opacity 0.5-1 over 1.2s; static under reduced motion. `aria-busy="true"` on the lists |
| Load error | Inline row at shelf end: "Couldn't load your saved sounds." + ghost button "Try again" (refetch). Starters stay usable |
| Empty shelf | Dashed 96px tile, text "No records yet" (13px/600) + "Paste a YouTube link to add one." (13px muted). Platter shows empty slipmat; play/pause disabled |
| Empty ambience | Single line 13px muted: "No ambience yet. Paste a YouTube link to add one." plus the Add knob |
| Guest | Starter records and knobs only; no Add tile, no Add knob, no options menus. Footnote under shelf, 13px muted: "Sign in to add and keep your own records." with "Sign in" link to `/sign-in`. Paste as guest: toast with the same copy |
| Non-YouTube paste | Toast: "Only YouTube links can be added for now." Dialog does not open |
| Playback error | Record stops, arm parks, toast: "Couldn't play {name}. The video may be private or removed." |
| Save error (dialog) | Inline: "Couldn't save this sound. Check your connection and try again." Dialog stays open, fields kept |
| Delete | Optimistic removal; on failure item returns + toast "Couldn't delete {name}. Try again." Deleting the loaded record stops it, empties the platter, hides the chip |

---

## Motion

Ease `EASE = [0.2, 0.7, 0.2, 1]` (from `CustomizePanelDesktop`). Gate everything on framer-motion
`useReducedMotion()`; CSS animations get a `prefers-reduced-motion` block.

| Moment | Full motion | Reduced motion |
|--------|-------------|----------------|
| Room open/close (desktop) | `x: -24 -> 0`, `opacity 0 -> 1`, 0.45s EASE; reverse on close (`AnimatePresence`) | Instant |
| Timer shrink/restore | `transition: transform 0.45s cubic-bezier(0.2,0.7,0.2,1)` in sync with the room | `transition: none` |
| Sheet (phone) | vaul with `.sheet` 0.45s timing | `animation: none; transition: none` (existing rule) |
| Platter spin | Record group `rotate` 360deg per 1.8s (33 1/3 rpm), linear, infinite. Spin-up 0.6s ease-in from rest; spin-down 0.8s ease-out on pause | No rotation ever |
| Tonearm | Rotate rest <-> play, 0.35s EASE; on swap lift first | Snaps |
| Record swap | Arm lifts (0.25s) -> old disc `opacity 1 -> 0, scale 1 -> 0.96` 0.2s -> new disc `opacity 0 -> 1, scale 1.04 -> 1` 0.3s -> arm lowers 0.35s -> spin-up. Audio starts on click, never waits for the animation | Instant swap, arm on record, no spin |
| Sleeve hover | `translateY(-2px)` 0.15s | None |
| New item after add | Fade in 0.3s | Instant |
| Chip enter/exit | `opacity 0 -> 1`, `y 6 -> 0`, 0.25s; mini disc 3.6s/rev | Instant, static disc |
| Knob | Direct manipulation, no tween | Same |

---

## Accessibility

| Area | Contract |
|------|----------|
| Room (desktop) | `role="dialog" aria-modal="false" aria-labelledby="records-heading" data-record-room`. On open focus `#records-heading`; Escape closes (skip if `event.defaultPrevented`); on close focus returns to the visible `[data-records-trigger]`. Same lifecycle code shape as `CustomizePanel.tsx` |
| Room (phone) | vaul non-modal + the Tab wrap handler from `CustomizePanelMobile.tsx`; visually hidden `DrawerPrimitive.Title` |
| Timer shortcuts | Extend `GUARDED_CONTAINER_SELECTOR` in `useTimerKeyboard.ts` to `[role='dialog']:not([data-customize-panel]):not([data-record-room])` so Space/R still drive the timer from inside the room (focused buttons and `role=slider` knobs are already skipped). The add dialog stays guarded |
| Turntable | SVG `aria-hidden`; state is conveyed by the play/pause button label and the `aria-live="polite"` status line |
| Shelf | `role="list"`, each sleeve button `aria-label="Play {name}"` / `"Pause {name}"`, `aria-pressed={playing}`; Arrow keys are not trapped, Tab moves sleeve to sleeve |
| Knobs | `role="slider"` with keyboard table above |
| Focus ring | `outline: 2px solid hsl(var(--ring)); outline-offset: 2px` on every control (inspector pattern) |
| Targets | >= 44x44 on touch for every control |
| Contrast | Names `hsl(var(--foreground))` and muted `hsl(24 5.4% 63.9%)` on `--panel-surface` both pass 4.5:1 |
| Drag | Never the only path; click/Enter on a sleeve does the same thing |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Footer button | "Records" (tooltip + aria-label) |
| Room heading | "Records" |
| Status line | Playing: "Now playing - {name}". Paused: "Paused - {name}". Empty platter: "Pick a record" |
| Section labels | "Shelf", "Ambience" |
| Add hint (desktop, signed in, under Shelf label right side, 11px muted) | "Paste a YouTube link to add" |
| Primary CTA | "Add record" / "Add ambience" (dialog, follows type) |
| Add tile / knob | "Add record" / "Add ambience" |
| Dialog | Title "Add to your room"; fields "YouTube link", "Name", "Add as"; options "Record" / "Ambience" |
| Empty state heading | "No records yet" |
| Empty state body | "Paste a YouTube link to add one." |
| Error state | "Couldn't save this sound. Check your connection and try again." (see States for load, play, delete, paste errors) |
| Invalid link | "That isn't a YouTube link. Paste a youtube.com or youtu.be link." |
| Guest | "Sign in to add and keep your own records." |
| Destructive confirmation | Delete record/ambience: `AlertDialog` title "Delete {name}?", body "It will be removed from your room on every device. This can't be undone.", actions "Cancel" / "Delete" (destructive variant) |
| Chip | aria: "Pause {name}", "Play {name}", "Open records, {name}" |
| Alarm block | "Alarm sound", "Preview alarm", "Alarm volume" |

---

## Component Inventory (for the planner)

New, under `apps/next/src/components/records/`: `RecordsButton`, `RecordRoom` (desktop shell +
sheet shell switch, mirrors `CustomizePanel`), `Turntable`, `Shelf` + `Sleeve`, `KnobRow` + `Knob`,
`AddSoundDialog`, `NowPlayingChip`, `labelInk.ts` (FNV-1a + hue map, with a small `bun test`
check for determinism), `records.module.css`.
Removed after the room ships: `SoundSettings.tsx`, `SoundSettingsMobile.tsx`, `AddSoundButton.tsx`,
`BgSoundsMenu.tsx`, `AmbientSoundsMenu.tsx`, `DraftSoundsButton.tsx`, `SoundsButton.tsx`,
`ConfigureSounds.tsx`, `ToggleAddMode.tsx`, `ToggleDeleteMode.tsx`; `AlarmSoundsButton.tsx` content
moves into Session settings. Playback stays in `GlobalSoundsPlayer.tsx`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (already vendored in `packages/ui`) | dialog, drawer (vaul), alert-dialog, dropdown-menu, input, label, button, tooltip, select, slider, sonner | not required |
| Third-party | none | not applicable |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
