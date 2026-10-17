---
phase: 9
slug: tasks-and-time-blocks
status: draft
shadcn_initialized: true
preset: not applicable (packages/ui/components.json, style default, baseColor zinc, cssVariables)
created: 2026-10-16
---

# Phase 9 - UI Design Contract: Tasks and Time Blocks

> Visual and interaction contract for the Tasks card (List and Plan), the time-block day column
> (planning and live Session card), task assignment, the switchable session progress slot (Strip,
> Now, Grid), the now line and now pick, the Customize control, and the phone layouts.
> Sources: 09-CONTEXT.md (locked picks 1A, 2B, 3B, 4D with the 4C Session card, 5D), the Phase 9
> board `.lavish/phase9/board.html` (builders `qd`, `strip`, `nowView`, `SWITCHER`, `NOWLINE`,
> `phoneBase`, `phoneGrid`; mocks `q1a`, `q2b`, `q3b`, `q4d`, `q4d-now`, `q4d-grid`, `q4c`,
> `q4d-pnow`, `q4a-p`, `q5c-1`, `q5d-cust`, `q3b-p`), the record room shell (`RecordRoom.tsx`,
> `records.module.css`), `Timer.tsx` + `timer-progress.module.css`, `SessionsUI.tsx`,
> `useChromeIdle.ts`, `StyleSection.tsx`, `controls.tsx`, `globals.css`.
> Values marked (discretion) are researcher picks inside Claude's Discretion or gaps the board
> leaves open. Board px values that were not multiples of 4 are rounded to the 4px grid here; the
> rounding is listed under Spacing exceptions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (existing, `packages/ui`) |
| Preset | not applicable |
| Component library | Radix via `@repo/ui` (`tabs`, `checkbox`, `popover`, `tooltip`, `input`, `button`, `sonner`), vaul for the phone sheet (`@repo/ui/drawer`) |
| Icon library | lucide-react: `NotebookPen` (footer, kept), `X`, `Plus`, `Minus`, `Check`, `Archive`, `ArchiveRestore`, `ChevronDown`, `ChevronRight`, `GripVertical` |
| Font | `var(--font-app)` (Inter Tight, follows the customize font pick) for UI text; `var(--font-mono)` (JetBrains Mono) for block numbers, clock times, counts and chips; `var(--font-display)` only for the "3 / 6" count, as today |
| Animation | framer-motion (installed) with `useReducedMotion`, plus CSS transitions. No new dependency |
| Surface pattern | Reuse the record room shell classes from `records.module.css` unchanged: `.surface`, `.room`, `.sheet`, `.grab`, `.head`, `.heading`, `.close`, `.body`, `.sec`. The planner may lift these into a shared module with no visual change (discretion) |

---

## Shared State and Page Attributes

| Item | Contract |
|------|----------|
| Open card | One value for the Quiet Deck slot: `'records' \| 'tasks' \| null` (discretion: generalise `useSoundsStore.roomOpen` or add a tiny shared store; planner picks). Opening one sets the other to closed |
| `html[data-room="open"]` | Set whenever either card is open. Every existing rule keyed on it (timer `scale(0.8)` on desktop, 132px timer strip under 1024px, hints hidden, chrome kept awake, `[data-sessions-ui]` hidden, chrome hidden under the sheet) applies to the Tasks card with no new CSS |
| `html[data-deck="tasks"\|"records"]` | New, set alongside `data-room` so Tasks-only rules (the 10px mini strip in the phone timer strip) can target it |
| `Timer.tsx` strip mode | `strip = openCard !== null && narrow` (today it reads `roomOpen`) |
| Customize exclusivity | Opening Tasks calls `useCustomizeActions().close()`, same as `RecordsButton`. Opening Customize closes whichever card is open |
| Card swap on desktop | Tasks to Records (or back) keeps `data-room="open"` set across the swap, so the timer does not re-scale. Outgoing card exits `x: 0 -> -24, opacity 1 -> 0` in 0.2s, incoming enters as in Motion |
| Session progress preference | New Look key `sessionProgress: 'strip' \| 'now' \| 'grid'`, default `'strip'`, added to `lookSchema` with `.default('strip')` so older stored looks parse. Mirrored to `html[data-session-progress]` by `lookToTokens` attrs. Guests: browser storage (Phase 3); signed-in: settings persistence (Phase 3). The switcher and the Customize control write the same key |
| Keyboard guard | Extend `GUARDED_CONTAINER_SELECTOR` in `useTimerKeyboard.ts` to `[role='dialog']:not([data-customize-panel]):not([data-record-room]):not([data-tasks-card])` so Space and R still drive the timer from inside the Tasks card. The switcher and now pick popovers stay guarded |

---

## 1. Tasks Card (1A)

### Footer button

Replaces `ToDoList` in `MenuSettings.tsx` and `ToDoListMobile` in `MenuSettingsMobile.tsx` (same
slot). `MenuButton` bare, icon `NotebookPen`, tooltip "Tasks" (`side='top'`, forced closed while
the card is open, same reason and code shape as `RecordsButton`), `aria-label="Tasks"`,
`aria-expanded={tasksOpen}`, `data-tasks-trigger`, `data-active` while open
(`bg-foreground/[0.07] text-foreground`, the existing active look). Click toggles the card.

### Desktop (>= 1024px)

| Element | Rule |
|---------|------|
| Card | `.surface.room` exactly: `position: fixed; top: 24px; left: 24px; width: 400px; bottom: calc((11vh + var(--pad-y)) / 2 + 48px); padding: 24px 24px 0; border-radius: 16px; box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.7); z-index: 30` |
| Element | `motion.section role="dialog" aria-modal="false" aria-labelledby="tasks-heading" data-tasks-card` |
| Timer | `scale(0.8)` through the existing `html[data-room="open"] .stage` rule |
| Progress slot | Hidden by the existing `html[data-room="open"] [data-sessions-ui]` rule (the card shows the same data in full) |
| Grid | Card rows: head (32px) / 16px gap / tabs (36px) / 16px gap / scrolling `.body` (`margin: 0 -24px; padding: 0 24px 24px; overflow-y: auto; overscroll-behavior: contain`) |

### Phone and tablet (< 1024px)

| Element | Rule |
|---------|------|
| Sheet | `.surface.sheet` exactly: vaul `Drawer` `modal={false}`, `shouldScaleBackground={false}`, `handleOnly`; `position: fixed; top: 132px; left: 0; right: 0; bottom: 0; max-width: 560px; margin-inline: auto; padding: 8px 20px 0; border-radius: 24px 24px 0 0; border-width: 1px 1px 0; z-index: 50`; `.grab` 36x4 handle; 0.45s `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| Head | Centred "Tasks" heading, close button 44x44 absolutely placed `right: -6px` (`.sheet .close`) |
| Body | `.sheet .body`: `margin: 0 -20px; padding: 0 20px calc(20px + env(safe-area-inset-bottom))` |
| Timer above | Existing 132px strip, digits at 64px (`Timer.tsx` strip mode) |
| Mini strip (Tasks only, session started) | Inside the 132px strip, under the digits: top 104px, height 8px, width `min(310px, 100vw - 80px)`, centred, gap 2px, block states as the Strip view, no numbers, labels or ticks, `aria-hidden`. Board `q3b-p` (board height 10px, rounded to 8px). Shown only when `html[data-deck="tasks"]` and a session has started (discretion) |
| Chrome | Hidden by the existing `html[data-room="open"] :is(.bf-chrome, [data-edge-progress])` rule under 1024px |
| Tab trap | Same `onSheetKeyDown` Tab wrap as `RecordRoom.tsx`; visually hidden `DrawerPrimitive.Title` |

### Head and tabs

| Slot | Spec |
|------|------|
| Heading | `<h2 id="tasks-heading" tabIndex={-1} class="heading">` "Tasks", 15px/600, letter-spacing -0.01em, no focus ring (programmatic target) |
| Close | `.close` 32x32 (44x44 in the sheet), `X` 16px, `aria-label="Close tasks"` |
| Tabs | `@repo/ui/tabs` (Radix: `tablist`, arrow keys, `aria-selected`). Track: `display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--panel-soft); border: 1px solid var(--panel-hair)`. Trigger: `flex: 1; padding: 4px 0; border-radius: 8px; 13px/400; color: var(--panel-muted)`. Selected: `background: var(--panel-lift); color: hsl(var(--foreground)); box-shadow: inset 0 0 0 1px var(--panel-hair)`. Labels "List", "Plan" |
| Tab on open | Footer button: last-used tab this page load, default List. Switcher "Open session card" and the phone Grid pill: always Plan (discretion) |

### List tab

Order top to bottom: Open section, Add row, Done section, Archived disclosure, guest footnote.

| Element | Spec |
|---------|------|
| Section label | `.sec` (11px/600 uppercase, tracking 0.12em, muted) with the count in `.sec em` (existing 12px/500): "Open" + open count, "Done" + done count. Section margins: 0 above the first, 24px above later sections, 8px below each label |
| Task row | `display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 12px; min-height: 36px` (44px on `(pointer: coarse)`); text 15px/400 line-height 1.4, wraps to 2 lines then ellipsis (`-webkit-line-clamp: 2`) |
| Completion box | `@repo/ui/checkbox` restyled: 20px circle, `border: 1.5px solid rgb(255 255 255 / 0.35)`; checked `background` and `border-color: var(--user-accent)`, `Check` 12px stroke 3 in `--accent-ink`. Hit area 44x44 on touch via padding |
| Done row | Text `var(--panel-muted)`, `text-decoration: line-through; text-decoration-color: rgb(255 255 255 / 0.25)` |
| Now row (only while a focus block is active) | `background: var(--panel-soft); box-shadow: inset 0 0 0 1px var(--panel-hair)` plus a trailing "Now" tag: 11px/600 uppercase, tracking 0.1em, `color: var(--user-accent)` |
| Block chip | Trailing, when the task is planned in a block: `var(--font-mono)` 11px/600, `padding: 4px 8px; border-radius: 6px; background: var(--panel-soft); color: var(--panel-muted)`, text "B3". The current block's chip: `background: var(--user-accent); color: var(--accent-ink)` |
| Edit | Click (or Enter on the focused text button) turns the text into an inline `Input`: 15px desktop, 16px on phone, transparent background, no border, 1px bottom hairline `var(--panel-hair)`. Enter or blur saves; Escape cancels and restores the original text; an empty value cancels. Behaviour matches today's `TaskItem.tsx` |
| Archive | 32x32 ghost icon button, `Archive` 16px muted, at the row end. Visible on row hover and `:focus-within`, always visible on `(pointer: coarse)`. `aria-label="Archive {task}"`. Archiving removes the task's planned link in the open plan (discretion) |
| Add row | `display: flex; gap: 12px; align-items: center; padding: 8px 12px; border-radius: 12px; border: 1px dashed rgb(255 255 255 / 0.14); color: var(--panel-muted); 15px`, `Plus` 16px, label "Add a task". Activating it swaps the label for an inline input (same style as Edit) with placeholder "Add a task". Enter adds the task at the top of Open and keeps the input open and empty for the next one; Escape or blur with an empty value closes it |
| Archived | Disclosure button at the bottom: `.sec` style text "Archived" + count + `ChevronDown` 14px rotating 180deg when open, `aria-expanded`. Rows as task rows with muted text and an `ArchiveRestore` button `aria-label="Restore {task}"`. Hidden when nothing is archived |
| Guest footnote | Guests only, under everything, 13px/400 muted, line-height 1.4, margin-top 24px: "Saved in this browser. Sign in to keep tasks on every device." with "Sign in" as a link to `/sign-in` (underline on hover) |
| Old celebration | The random stagger shake in `TaskList.tsx` when every task is done is not carried over (discretion) |

Task ids for guests are client UUIDs (CONTEXT Q9). No visible change.

---

## 2. Plan Tab Day Column (2B), Planning and Live

One component, two states. Planning = no session started. Live = a session has started (running
or paused) and lasts until it finishes or resets, which closes the plan and seeds a fresh one from
Session settings. The live state is the Session card (4C).

### Layout, top to bottom

1. Summary row (`.sec` style, `margin-bottom: 12px`).
2. Day column (`<fieldset>`, sr-only legend "Blocks").
3. "Add focus block" row (planning only).
4. Footnote (planning only).

### Summary row copy

| State | Left (11px/600 caps muted) | Right (`.sec em`, 12px/500 foreground) |
|-------|---------------------------|-----------------------------------------|
| Planning | "6 blocks · 2 h 55 min" | "Ends 11:55" |
| Live | "Focus 62 min · 3/8 tasks · +5 min" (the "+N min" part only when added time > 0) | "Ends 12:00" |

"Focus N min" is focus time elapsed so far; "3/8 tasks" is completed over planned in this session.

### Derived clock times (never stored)

| Rule | Value |
|------|-------|
| Planning anchor | `now`, re-derived every minute on a 60s interval (and on tab focus) |
| Live anchor | Each started block's actual `startedAt`; each block ahead starts at the previous block's projected end. Projected end of the current block = now + time left. Pausing or adding time therefore re-flows every row below on the next tick |
| Block end | start + planned length + added time |
| Format | `Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })` (locale decides 12h or 24h). A range reads "10:00 - 10:25" (plain hyphen with spaces) |
| Durations | "25 min", "2 h 55 min", "1 h" |
| Pure function | One `deriveBlockTimes(blocks, anchor, now)` in a plain module with one `bun run` assert check (CONTEXT verification rule) |

### Column geometry

| Element | Spec |
|---------|------|
| Column | `display: grid; grid-template-columns: 52px minmax(0, 1fr); column-gap: 8px; row-gap: 4px` |
| Gutter | Each focus row's start time in `var(--font-mono)` 11px/400 muted, aligned to the row top + 8px. Break rows have no gutter label. After the last block, a final gutter label with the session end time |
| Scale | Row height `max(44px, minutes x 2.4px)` for focus blocks and `max(16px, minutes x 2.4px)` for breaks, where minutes = planned + added (live: actual length for done blocks). 25 min = 60px, 5 min = 16px. Same scale on desktop and phone. The default 6 x 25 + 5 x 5 session is 440px of rows plus 40px of gaps |
| Focus row | `border-radius: 8px; padding: 8px 12px; background: var(--panel-soft); box-shadow: inset 0 0 0 1px var(--panel-hair); overflow: hidden`. Line 1: "Block 3" 13px/600 foreground, right-aligned meta in mono 11px/400 muted. Line 2 and on: assigned task names, 13px/400 foreground, joined with " · ", wrapping (the card shows full names; no ellipsis unless the row is shorter than its content, then clip at the row's proportional height) |
| Empty focus row | Line 2: "No tasks" 13px/400 italic muted |
| Break row | No background, no ring. Single line, mono 11px/400 muted, `line-height: 16px; padding: 0 12px`: "Break · 5 min" |
| Added time | A hatched band at the bottom of the row, height = added minutes x 2.4px, `background: var(--hatch-light)` (on done rows `var(--hatch-dark)`), `border-top: 1px solid rgb(255 255 255 / 0.12)`. Meta shows "+5" after the length (see states) |

### Row states

| State | Visual | Meta (right of line 1) |
|-------|--------|------------------------|
| Planning, default | Base focus row | "10:00 - 10:25" |
| Planning, selected | `box-shadow: inset 0 0 0 1.5px var(--user-accent); background: rgb(255 255 255 / 0.07)`; the Assign panel (section 3) attaches inside the same ring below a 1px `var(--panel-hair)` divider | "10:00 - 10:25" |
| Live, done focus | `background: color-mix(in srgb, var(--user-accent) 14%, transparent)`, no ring; `Check` 12px before "Block 1"; tasks listed with static tick icons (see below) | "25 min" or "25 + 5 min" |
| Live, current focus | Ring `inset 0 0 0 1.5px var(--user-accent)`, background `rgb(255 255 255 / 0.07)`. Line 1 reads "Block 3 · now". Under line 1 a 4px progress bar (`border-radius: 2px`, track `var(--cell)`, fill `var(--user-accent)` scaled by elapsed / (planned + added)). Its tasks render as completion rows (box + name + "Now" tag + "Set now" action, section 3) | "12:19 of 25 min" (elapsed of planned + added) |
| Live, ahead focus | As planning; selectable for assignment | "10:55 - 11:20" |
| Live, done break | Break row at 60% opacity | "Break · 5 min" |
| Live, current break | Break row with `box-shadow: inset 0 0 0 1.5px var(--user-accent); border-radius: 8px`, text foreground | "Break · 3:12 left" |
| Paused | Same as current; meta appends " · paused" | "12:19 of 25 min · paused" |

Static ticks in done rows: 16px circle, completed = accent fill with `Check` 10px in
`--accent-ink`, not completed = 1.5px `rgb(255 255 255 / 0.35)` ring. Not interactive (untick from
the List tab). Each carries sr-only text "done" or "not done".

### Add, remove and nudge (planning, and ahead blocks while live)

| Control | Spec |
|---------|------|
| Add focus block | Dashed add row (List tab style, full column width under the column, `margin-top: 8px`), `Plus` 16px, "Add focus block". Appends a break and a focus block with Session settings' break and work minutes. Max 16 focus blocks per plan, then the row is disabled with helper "16 blocks is the limit for one session." (discretion) |
| Remove block | Inside the Assign panel footer, ghost text button 13px/400 muted, right-aligned: "Remove block". Removes the focus block and the break before it (or after it for Block 1); its tasks become unplanned. Disabled when only one focus block remains. Never available on done or current blocks. No confirm; a sonner toast "Block 4 removed" with action "Undo" (5s) restores it |
| Nudge length | Assign panel header row: "Length" 13px muted, then a `Minus` button, the value "25 min" (mono 13px/400 foreground, `<output aria-live="polite">`), a `Plus` button. Buttons 28x28 ghost (44x44 on touch), radius 8. Step 5 min, range 5-90 min; buttons disable at the bounds |
| Scope | All three change this plan only, never Session settings |
| Footnote | Under the column, 13px/400 muted, line-height 1.4: "Changes here apply to this session only." Desktop with `(pointer: fine)` adds a second line: "Drag a task onto a block to move it." |

---

## 3. Assignment (3B)

### Radio group of blocks

| Item | Contract |
|------|----------|
| Semantics | Native radios: each selectable focus row is a `<label>` wrapping a visually hidden `<input type="radio" name="plan-block">`. Break rows, done rows and the current row are plain content, not radios |
| Accessible name | "Block 3, 10:00 to 10:25, 25 minutes, 2 tasks" (sr-only text inside the label; the visible meta is `aria-hidden` to avoid reading the hyphen) |
| Default selection | Planning: Block 1. Live: none until the user picks an ahead block |
| Keyboard | Tab enters the group at the selected radio; Arrow Up/Down (and Left/Right) move selection between selectable blocks (native behaviour; the Assign panel follows the selection). Tab from the selected radio moves into its Assign panel, then out of the column |
| Focus ring | `outline: 2px solid hsl(var(--ring)); outline-offset: 2px` on the row when its radio has `:focus-visible` (`label:has(input:focus-visible)`) |

### Assign panel (inside the selected row)

| Element | Spec |
|---------|------|
| Container | Inside the selected row's ring, below a 1px hairline, `padding-top: 8px; display: grid; gap: 4px` |
| Length row | See Nudge length |
| Checklist | `<fieldset>` with sr-only legend "Tasks in Block 3". One row per open, unarchived task: `@repo/ui/checkbox` (20px circle, as List) + name 15px/400 wrapping to 2 lines + trailing block chip "B4" when the task is planned in another block. Row `padding: 8px 4px; gap: 12px`, min-height 44px on touch. Order: tasks in this block, then unplanned, then tasks in other blocks (by block index) |
| Checked meaning | Checked = planned in this block. Checking a task planned elsewhere moves it here (one block per task); its old block updates at once. Unchecking makes it unplanned |
| Description | Tasks planned elsewhere get `aria-describedby` text "Planned in Block 4. Checking moves it here." |
| Announcement | One polite live region per card: "Draft Q3 body moved to Block 3", "Draft Q3 body added to Block 3", "Draft Q3 body removed from Block 3" |
| Add to block | Dashed add row "Add a task to Block 3"; the inline input creates the task and plans it in this block |
| No open tasks | Instead of the checklist: "No open tasks yet." 13px/400 muted, then the add row |
| Footer | "Remove block" (see section 2), right-aligned, `margin-top: 4px` |

### Live current block rows (completion and now, not assignment)

Inside the current row, each assigned task is a completion row: checkbox (checked = completed),
name 15px wrapping, then either the "Now" tag (the now task) or a "Set now" text button
(13px/400 muted, 28px tall, padding 0 8px, radius 6, hover `var(--panel-soft)`; visible on hover
and `:focus-within`, always on touch; `aria-label="Set {task} as now"`). Ticking writes `completed`
to this block's link; "Set now" writes `worked` and makes it the now task. When the now task is
ticked, now moves to the next open task in the block.

### Native drag (desktop extra)

| Item | Contract |
|------|----------|
| When | `(pointer: fine)` only; never the only path |
| Source | Checklist rows in the Assign panel and completion rows in the current block. `draggable`, `GripVertical` 14px muted at the row start, shown on hover. `dragstart`: `dataTransfer.setData('application/x-befocus-task', id)`, `effectAllowed = 'move'`. Browser default drag image (discretion) |
| Targets | Planning focus rows, and live ahead and current focus rows. Done rows and breaks do not call `preventDefault` on `dragover`, so drops are refused |
| Over state | `[data-over]` on the row: `box-shadow: inset 0 0 0 1.5px var(--user-accent); background: color-mix(in srgb, var(--user-accent) 10%, transparent)` plus a trailing pill in the names line: "Drop here", 13px muted, `padding: 4px 8px; border-radius: 8px; border: 1px dashed rgb(255 255 255 / 0.3)` |
| Drop | Same as checking the task under that block (moves it); same live-region message. Drop on the current block plans it there without changing the now task |

### Now pick (TSK-02)

Opened from the now line (desktop and phone Strip / Now views). On phone Grid the pill opens the
Plan tab instead, where "Set now" is the path.

| Element | Spec |
|---------|------|
| Primitive | `@repo/ui/popover` (Radix), content `data-now-pick`, `side="bottom" align="center" sideOffset={12}`, focus moves to the current task row on open |
| Panel | `width: min(320px, calc(100vw - 32px)); padding: 8px; border-radius: 16px; border: 1px solid var(--panel-hair); background: var(--panel-surface); box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.8); max-height: min(360px, var(--radix-popover-content-available-height)); overflow-y: auto` (overrides the default `w-72 p-4 rounded-md` classes) |
| Heading | `.sec` "Working on", `padding: 8px 8px 4px`, used as the dialog label |
| Mark done | First row, button, `Check` 16px + "Mark done" 15px/400, `aria-label="Mark {task} done"`. Ticks the now task and moves now to the next open task in the block; the popover stays open so the user sees the new now |
| Divider | 1px `var(--panel-hair)`, `margin: 4px 0` |
| Groups | `.sec` "This block" then rows; `.sec` "Other open tasks" then rows with the "B4" chip when planned elsewhere. Groups with no rows are omitted |
| Row | Button, `display: flex; gap: 12px; align-items: center; padding: 8px 12px; border-radius: 12px; min-height: 40px` (44px on touch), 15px/400, 2-line clamp. Leading 8px dot: current = `var(--user-accent)` fill; others = 1.5px `rgb(255 255 255 / 0.35)` ring. Current row: `background: var(--panel-soft); box-shadow: inset 0 0 0 1px var(--panel-hair)`, `aria-pressed="true"`; others `aria-pressed="false"` |
| Pick | Sets now, writes `worked` to the current block's link, closes the popover, returns focus to the now line, polite announcement "Now working on {task}". Picking a task planned in another block or unplanned also moves it into the current block (discretion, keeps every view coherent) |
| Escape / outside click | Radix closes, focus back to the now line |

---

## 4. Live Progress Slot (4D)

The top-left slot where `SessionsUI.tsx` sits shows one of three views of the same block data,
chosen by `sessionProgress`. The slot is one `<button>` wrapping the chosen view, with
`data-sessions-ui` (keeps the existing hide-under-card rule) and `data-progress-slot`.

### Slot button

| Item | Spec |
|------|------|
| Box | `display: block; padding: 8px; margin: -8px; border-radius: 12px; background: transparent; text-align: left` |
| Hover | `background: color-mix(in srgb, var(--fg) 4%, transparent)` |
| Focus | `outline: 2px solid hsl(var(--ring)); outline-offset: 2px` |
| Accessible name | Live focus: "Session progress: Block 3 of 6, 12:41 left. Change view". Break: "Session progress: break after Block 3, 3:12 left. Change view". Planning: "Session progress: 6 blocks planned. Change view". `aria-haspopup="dialog"`, `aria-expanded`. Inner view markup is `aria-hidden` |
| Announcement | A polite live region announces only block changes ("Block 3 of 6 started", "Break started"), never per-second time |

### Strip view (default)

Desktop (>= 640px):

| Element | Spec |
|---------|------|
| Width | `clamp(280px, calc(100vw - 2 * var(--pad-x) - 400px), 920px)` (920px at 1440 wide, board `q4d`) |
| Label row | `display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; white-space: nowrap`; text 15px/400 `color-mix(in srgb, var(--fg) 62%, transparent)`; leading count in `var(--font-display)` 22px/600 tabular-nums `var(--fg)` |
| Label copy | Live focus: "**3 / 6**  Block 3 · 12:19 in · +5 min added" (the added part only when the session has added time). Break: "**3 / 6**  Break · 3:12 left". Planning: "**6 blocks**  2 h 55 min · 8 tasks planned" (tasks part only when > 0) |
| Row | `display: flex; gap: 4px; align-items: flex-start` |
| Block | `height: 72px; border-radius: 6px; overflow: hidden; position: relative; flex: none`; width = minutes x per, where `per = (width - gap x (n - 1)) / total minutes` and minutes = planned + added (actual for done blocks). Board 74px, rounded to 72px. Use 56px when `(max-height: 760px)` (discretion) |
| Focus colours | Ahead `background: var(--cell)`. Done `background: var(--user-accent); color: var(--accent-ink)`. Current `background: var(--cell)` with ring `box-shadow: inset 0 0 0 1.5px var(--user-accent)` and the fill |
| Break colours | Ahead `var(--cell-break)`. Done `var(--done-break)`. Current: `var(--cell-break)` with the same ring and fill |
| Fill (current) | Absolutely placed `inset: 0`, `background: var(--fill)`, `transform-origin: left; transform: scaleX(elapsed / (planned + added)); transition: transform 1s linear` |
| Inner text | `padding: 8px; 13px/400 line-height 1.25; white-space: nowrap; overflow: hidden`. Line 1: mono 11px/600 at 0.7 opacity: "3" or "2 · +5". Lines 2-3: first and second task name, ellipsis, the second at 0.7 opacity. Names shown only when the block is >= 96px wide; the number only when >= 20px wide |
| Added time | `.plus` band at the block's right end: `position: absolute; top: 0; bottom: 0; right: 0; width: added x per`; on done blocks `background: var(--hatch-dark); border-left: 1px solid rgb(16 16 16 / 0.5)`; on current or ahead blocks `background: var(--hatch-light); border-left: 1px solid rgb(255 255 255 / 0.16)` |
| Tick dots | Under each focus block, `display: flex; gap: 4px; margin-top: 8px; height: 6px`; one 6px circle per planned task, `border: 1px solid rgb(255 255 255 / 0.35)`; completed `background` and `border-color: var(--user-accent)`. Max 8 dots, then mono 11px muted "+N". Dots clip to the block width |

Overflow past about 12 blocks (discretion): minimum widths are focus 32px and break 8px on
desktop, focus 16px and break 4px on phone. If proportional widths would go below them, every
block takes `max(min, proportional)` and the row becomes `overflow-x: auto; scrollbar-width: none;
mask-image: linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 16px), transparent)`.
On each block change the current block is scrolled into view with
`scrollIntoView({ inline: 'center', block: 'nearest' })` (instant under reduced motion). At the
default 920px desktop width this only triggers past about 30 blocks; on a 310px phone strip at
about 12.

### Now view

| Element | Spec |
|---------|------|
| Width | `clamp(280px, calc(100vw - 2 * var(--pad-x) - 400px), 520px)` (board `q4d-now`) |
| Label row | As Strip: "**3 / 6**  Block 3 · 12:41 left · 2 tasks". With added time: "**3 / 6**  Block 3 · 12:41 left · +5 min · 2 tasks". Break: "**3 / 6**  Break · 3:12 left". Planning: "**1 / 6**  Block 1 · 25 min · 2 tasks" with an empty bar |
| Bar | One block, full width, 72px tall, current-block styling (ring + fill + hatched tail for added time, tail width = added / (planned + added)) |
| Inner text | Line 1: mono 11px/600 at 0.7 opacity "Block 3". Line 2: all task names joined " · ", 13px, ellipsis. Break: line 1 "Break", no line 2 |
| Tick dots | Under the bar, as Strip |

### Grid view

`SessionsUI.tsx` as it is today (CTL-11): "3 / 6" count and the two-row `.bf-cell` grid, no
change in markup or styling. It cannot show tasks or added time; the now line and the Session
card carry those.

### Switcher popover

| Element | Spec |
|---------|------|
| Primitive | `@repo/ui/popover` (Radix), trigger = the slot button, content `data-session-switcher`, `side="bottom" align="start" sideOffset={8}`. Focus moves to the selected tile on open |
| Panel | `width: min(340px, calc(100vw - 32px)); padding: 16px; display: flex; flex-direction: column; gap: 12px; border-radius: 16px; border: 1px solid var(--panel-hair); background: var(--panel-surface); box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.8)` |
| Heading | `.sec` "Session progress" (dialog label) |
| Tiles | `role="group" aria-label="Session progress view"`, `display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px`. Each tile a `<button aria-pressed>`: `padding: 12px 8px 8px; border-radius: 12px; border: 1px solid var(--panel-hair); background: var(--panel-soft); display: flex; flex-direction: column; align-items: center; gap: 8px; 13px/400 muted` |
| Selected tile | `border-color: var(--user-accent); box-shadow: inset 0 0 0 1px var(--user-accent); color: hsl(var(--foreground))`, `aria-pressed="true"` |
| Tile previews | 32px tall, `aria-hidden`, CSS only, radius 2: Strip = six bars 14px tall (12, 4, 12, 4, 12, 12px wide, gap 2: done, done-break, current, break, ahead, ahead). Now = two bars 28 x 14px (current, ahead). Grid = 6 x 2 grid of 8px squares gap 2 (row 1: done, done, current, ahead x3; row 2: done, done, ahead x4). Colours: done `var(--user-accent)`, current `var(--fill)`, others `var(--cell)` |
| Tile labels | "Strip", "Now", "Grid" |
| Pick | Writes `sessionProgress`, closes the popover, focus returns to the slot button |
| Divider | 1px `var(--panel-hair)` |
| Session card row | Button, `display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; min-height: 40px` (44px on touch), `border-radius: 12px`; left "Open session card" 15px/400 foreground; right "Full names, totals" 13px/400 muted + `ChevronRight` 16px muted. Hover `var(--panel-soft)`. Opens the Tasks card on the Plan tab (live state when a session has started) and closes the popover; focus goes to `#tasks-heading`; closing the card returns focus to the slot button (or the footer trigger if the slot is hidden) |

### Now line (under the digits)

| Item | Spec |
|------|------|
| Shown when | A focus block is active (running or paused, discretion: CONTEXT says running; paused keeps it so the user can switch tasks) and at least one open task exists. Otherwise the key hints show as today |
| Slot (>= 640px) | Inside `.under` in `Timer.tsx`, replacing `.hints` while shown; with Ruler on it sits below the ruler (existing 18px gap). Desktop board position: about 38px below the glyph row (`q4d`, top 668 under 360px digits) |
| Element | `<button>` with `aria-haspopup="dialog"`, `display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 16px; border-radius: 999px; white-space: nowrap; color: color-mix(in srgb, var(--fg) 80%, transparent)`. Hover `background: color-mix(in srgb, var(--fg) 6%, transparent)`. Focus ring as slot |
| Parts | "NOW" mono 11px/600 uppercase, tracking 0.08em, `color-mix(in srgb, var(--fg) 45%, transparent)`; task name 15px/400, `max-width: 360px` ellipsis; count mono 13px/400 at 45% fg: "3/8 done" (completed over planned in the session; omitted when nothing is planned) |
| No task in block | Name slot reads "Pick a task" in 45% fg |
| Accessible name | "Now: Draft Q3 body, 3 of 8 tasks done. Change task" |
| Tap | Opens the now pick |

### Idle dim (useChromeIdle)

| Element | Idle opacity |
|---------|--------------|
| Progress slot (any view) | 0.35 |
| Now line, phone Grid pill | 0.55 |
| Everything else in `.bf-chrome` (logo, footer, hints) | 0 (unchanged) |

CSS (globals.css, beside `.bf-chrome`):

```css
.bf-chrome-dim { transition: opacity 0.8s ease; }
html[data-chrome-idle]:not([data-panel="open"]):not([data-room="open"]):not(:has(:focus-visible)):not(:has([data-session-switcher], [data-now-pick])) .bf-chrome-dim {
  opacity: var(--idle-opacity, 0.35);
}
```

The now line and pill set `--idle-opacity: 0.55`. Because opacity multiplies, `Header.tsx` moves
`bf-chrome` off its root onto the title and mobile-count wrapper, and the slot gets
`bf-chrome-dim`. The same `:not(:has([data-session-switcher], [data-now-pick]))` clause is added
to the existing `.bf-chrome` idle rule, so an open popover keeps all chrome awake; `pointerdown`
on the slot already wakes it. Dimmed controls stay focusable and clickable; focus wakes the chrome
through the existing `:has(:focus-visible)` clause. Reduced motion: `transition: none`.

### Coexistence with Edge, Ruler and Ink (no third indicator)

| Indicator | Shows | Place |
|-----------|-------|-------|
| Edge / Ruler / Ink / None (Timer progress) | Progress within the current block | Timer (bottom edge, under digits, inside digits) - unchanged |
| Session progress (Strip / Now / Grid) | Progress across the session | The one top-left slot, replacing the grid in place, never beside it |

The current block's fill in Strip and Now repeats the block's progress at session scale; that is
accepted (board 4A cost). No other progress element is added. The Edge bar stays at the bottom on
every breakpoint and keeps hiding under the phone sheet as today.

---

## 5. Customize > Style Control

| Item | Spec |
|------|------|
| Component | New `SessionProgressSection` in `StyleSection.tsx`, registered in `CUSTOMIZE_SECTIONS` directly after `customize-progress` (Timer progress), before `customize-density`. No jump chip; the "Timer" chip lands next to it (discretion) |
| Group | `ControlGroup id="customize-session-progress" label="Session progress" value={label}` (value shows "Strip" / "Now" / "Grid") |
| Control | `SegmentedControl name="sessionProgress" legend="Session progress"`, options in order Strip, Now, Grid; writes `setPreview('sessionProgress', value)` so the slot previews live while the inspector is open, same as every Customize control |
| Helper | Under the control, 13px/400 muted, line-height 1.4, margin-top 8px: "You can also tap the progress area on the timer screen." |
| Default | Strip |
| Styles | Existing `.group`, `.label`, `.value`, `.seg`, `.segItem`, `.segLabel` unchanged (their 12.5px sizes are existing Customize styles, not re-specified) |

The board's "NEW" tag is not built (discretion; no badge pattern exists in the app).

---

## 6. Phone (5D)

Breakpoints (discretion, matching the code): the compact progress views and the stacked-digit now
line apply under 640px, where `SessionsUI` and `Timer.tsx` already switch to their phone layouts.
The card versus sheet switch stays at 1024px. Between 640px and 1023px the desktop views render at
the clamped widths above and Tasks opens in the sheet.

| View (< 640px) | Spec (board, 390 x 844 frame) |
|------|------|
| Slot position | The existing mobile `SessionsUI` place in `Header.tsx` (under the logo row, `px-10`), full content width, `max-width: 320px` (310px at 390 wide) |
| Count | `SessionMobileCount` "3 / 6" at the logo row's right, unchanged (24px extrabold), shown in all three views |
| Strip (5A, `q4a-p`) | Row gap 2px, block height 40px, no label row, no names. Inner: block number centred, mono 11px/600 at 0.75 opacity, `padding: 4px 0`; hidden under 16px wide. Same states, fill, hatch, tick dots (6px, gap 4px, margin-top 8px) |
| Now (`q4d-pnow`) | One bar, full width, 44px tall, current-block styling. Inner `padding: 4px 12px`: mono 11px/600 at 0.7 opacity "Block 3 · 12:41 left" (break: "Break · 3:12 left"). Tick dots under it. No label row, no names |
| Grid + pill (5C, `q5c-1`) | Existing mobile grid unchanged. Under the stacked digits, a pill replaces the now line: `<button>` `display: inline-flex; align-items: center; gap: 12px; height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid rgb(255 255 255 / 0.16)`; "B3/6" mono 11px/600 muted, task name 15px/400 foreground, `max-width: calc(100vw - 160px)` ellipsis, `ChevronDown` 14px. Accessible name "Block 3 of 6, Draft Q3 body. Open plan". Opens the Tasks sheet on the Plan tab. Shown during an active focus block; during a break it reads "Break · B3/6" |
| Now line (Strip, Now) | Same element as desktop, centred under the stacked digits with `margin-top: 24px` (board top 624), task name `max-width: calc(100vw - 160px)` |
| Idle | Slot 0.35, now line and pill 0.55, as desktop (`q4a-pidle`) |
| Switcher | Tapping the slot opens the same popover, `align="start"`, width `min(340px, calc(100vw - 32px))`, rows and tiles at 44px minimum height |
| Now pick | Same popover, `side="bottom"`; it may cover the footer controls but never the digits; height capped by `--radix-popover-content-available-height` |
| Tasks sheet | Section 1 phone rules: below the 132px timer strip in every view, so the plan and progress never obstruct the timer (TSK-05). The 8px mini strip under the 64px digits keeps session progress visible while the sheet is open (`q3b-p`) |
| Plan column in the sheet | Same 2.4px per minute scale and 52px gutter; content width is `100vw - 40px` |
| Landscape phones | `(max-height: 500px)`: Strip block height 24px, Now bar 32px (matches the existing `isLandscape` cell size of 24px) |

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Strip block gap (desktop), column row gap, tab track padding, tile preview gaps |
| sm | 8px | Row vertical padding, label-to-row gap, tick dot margin, popover padding, panel inner gaps, dot gap 4 to 8 |
| sm+ | 12px | Row horizontal padding, icon-to-text gap in rows, switcher gap, summary row margin |
| md | 16px | Card head-to-tabs and tabs-to-body gaps, switcher padding, popover edge inset on phone, now line padding |
| lg | 24px | Card inset and padding (desktop), section gaps in List, now line margin on phone |
| xl | 32px | Not used inside the card; reserved |

Exceptions: 2px strip gap on phone and in the mini strip (board); 6px tick dots and 6px block
radius (board, `.bf-cell` radius); 20px sheet side padding and 132px timer strip (inherited from
`.sheet`); 52px gutter; 44px touch targets; 1.5px rings. Board values rounded to the 4px grid:
task row padding 8x10 -> 8x12, row gap 10 -> 12, tile padding 10/8/8 -> 12/8/8, switcher padding
14 -> 16, tick gap 3 -> 4, block inner padding 8x9 -> 8x8, block height 74 -> 72, mini strip 10 -> 8.

---

## Typography

Two weights for all new text: 400 and 600. Font `var(--font-app)`; `var(--font-mono)` for block
numbers, clock times, chips and counts.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label (section caps, NOW tags, chips, block numbers, clock times, break rows) | 11px | 600 caps and numbers / 400 times | 1.2 (break rows 16px fixed), caps tracking 0.12em (NOW 0.08-0.1em) |
| Secondary (tabs, block row titles and names, strip block names, tiles, helper and footnotes, now count, "Set now") | 13px | 400 (block titles 600) | 1.25 in blocks, 1.4 elsewhere |
| Body (task rows, now line task, popover rows, strip label row, card heading) | 15px | 400 (heading 600) | 1.4 (heading 1.2, letter-spacing -0.01em) |
| Display (strip and now "3 / 6" count) | 22px | 600, `var(--font-display)`, tabular-nums | 1 |

Exceptions: text inputs are 16px under 1024px (prevents iOS zoom); `.sec em` counts keep the
existing 12px/500; the Grid view count, timer digits and Customize control styles are existing and
unchanged.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--bg-solid)`, default `hsl(0 0% 6.3%)` | Dashboard behind slot, card and sheet |
| Secondary (30%) | `--panel-surface` = `color-mix(in srgb, var(--bg-solid), #fff 5%)`; `--panel-soft` `rgb(255 255 255 / 0.05)`, `--panel-lift` `rgb(255 255 255 / 0.08)`, `--panel-hair` `rgb(255 255 255 / 0.08)` | Card, sheet, popovers, rows, tabs, tiles |
| Accent (10%) | `var(--user-accent)` (default `#f5f5f4`) | Reserved list below |
| Destructive | `hsl(var(--destructive))` = `hsl(0 62.8% 30.6%)` | Inline load and save error tint only; no destructive buttons in this phase |

New tokens (declared on the slot, card and sheet roots):

| Token | Value |
|-------|-------|
| `--cell` | `color-mix(in srgb, var(--fg) 8%, transparent)` (same as `.bf-cell`) |
| `--cell-break` | `color-mix(in srgb, var(--fg) 5%, transparent)` |
| `--fill` | `color-mix(in srgb, var(--user-accent) 45%, var(--cell))` (same as `.bf-cell[data-state="now"]`) |
| `--done-break` | `color-mix(in srgb, var(--user-accent) 55%, var(--cell))` |
| `--accent-ink` | `#101010` (text and checks on accent). Every preset accent in `ACCENTS` is a light pastel, so this passes 4.5:1; a dark custom accent is the known ceiling (switch to a luminance pick if that ever ships) |
| `--hatch-dark` | `repeating-linear-gradient(135deg, rgb(16 16 16 / 0.55) 0 3px, transparent 3px 7px)` |
| `--hatch-light` | `repeating-linear-gradient(135deg, rgb(255 255 255 / 0.16) 0 3px, transparent 3px 7px)` |

Accent reserved for: (1) done focus blocks, the current block's fill (45% mix) and ring in Strip,
Now and the mini strip; (2) completed tick dots and checked completion and assignment boxes;
(3) "Now" tags and the current block chip; (4) the selected block ring and the drag-over ring and
10% tint in the Plan column; (5) the done-row 14% tint and the 4px current-row progress bar in the
live column; (6) the selected tile ring in the switcher; (7) the current-task dot in the now pick.
Buttons, tabs, links, add rows and the now line never use accent.

---

## Interaction States

| Control | Hover | Focus-visible | Active / selected | Disabled |
|---------|-------|---------------|-------------------|----------|
| Footer Tasks button | existing `MenuButton` | existing ring | `data-active` fill while open | - |
| Tabs | text to foreground | 2px ring, offset 2px | lift fill + hairline | - |
| Task row | `var(--panel-soft)` fill, archive button appears | ring on the inner control; row shows actions via `:focus-within` | now row: soft fill + hairline + tag | - |
| Checkbox | ring brightens to `rgb(255 255 255 / 0.5)` | ring | accent fill + ink check | - |
| Add rows | text and border to foreground at 60% | ring | becomes input | "Add focus block" at 16 blocks: 40% opacity |
| Plan focus row | `rgb(255 255 255 / 0.07)` | ring on the row | accent ring + panel | done and current rows are not interactive for selection |
| Nudge buttons | `var(--panel-soft)` | ring | - | 40% opacity at 5 and 90 min |
| Remove block | text to foreground | ring | - | 40% opacity when one block remains |
| Slot button | 4% fg fill | ring | popover open: same fill | - |
| Tiles | border to `rgb(255 255 255 / 0.16)` | ring | accent ring | - |
| Now line / pill | 6% fg fill | ring | popover open: same fill | - |
| Popover rows | `var(--panel-soft)` | ring | current: soft fill + hairline + accent dot | - |

Focus ring everywhere: `outline: 2px solid hsl(var(--ring)); outline-offset: 2px`.

---

## States

| State | Behaviour |
|-------|-----------|
| Loading (signed-in tasks or plan pending) | List: 3 skeleton rows 36px, `var(--panel-soft)`, radius 12. Plan: 3 skeleton focus rows 60px with 16px gaps. Pulse opacity 0.5-1 over 1.2s, static under reduced motion. `aria-busy="true"` on the list or column. The slot renders from Session settings meanwhile |
| Load error | Inline row at the top of the tab, 13px, on a `hsl(var(--destructive) / 0.15)` tint, radius 12, padding 8px 12px: "Couldn't load your tasks." + ghost button "Try again" (refetch) |
| Save error (task create, edit, tick, archive, assign) | Optimistic change rolls back; toast "Couldn't save {task}. Check your connection and try again." |
| Plan save error | Toast "Couldn't save your plan. Check your connection and try again." with action "Try again" |
| Guest storage unavailable | Toast once per page load: "This browser isn't saving your tasks. Private browsing can block storage." |
| Empty List | Heading "No tasks yet" 15px/600, body "Add what you want to get done this session." 13px muted, then the Add row (focused on open when the list is empty) |
| Empty block | "No tasks" in the column; Strip and Now show the number only, no dots |
| No open tasks during a focus block | Now line hidden, key hints return |
| Session finished or reset | Plan closes; Plan tab shows a fresh planning plan seeded from Session settings; the slot returns to the planning label |

---

## Motion

Ease `EASE = [0.2, 0.7, 0.2, 1]` (record room). Gate every framer-motion animation on
`useReducedMotion()`; CSS transitions get a `prefers-reduced-motion` block.

| Moment | Full motion | Reduced motion |
|--------|-------------|----------------|
| Card open / close (desktop) | `x: -24 -> 0, opacity 0 -> 1`, 0.45s EASE; reverse on close (`AnimatePresence`) | Instant |
| Card swap Tasks / Records | Outgoing 0.2s exit, incoming 0.45s enter, timer scale untouched | Instant |
| Sheet (phone) | vaul with `.sheet` 0.45s timing | Existing reduced-motion rule |
| Tabs | Content swap, no animation | Same |
| Assign panel | Height `0 -> auto` and opacity, 0.25s EASE | Instant |
| Block reflow (assign, nudge, add time) | Strip widths and column heights 0.4s EASE (`transition: width, height`) | Instant |
| Current fill | `transform: scaleX()` 1s linear (as `.edgeFill`) | `transition: none` (steps each second) |
| Tick dot / checkbox | Fill 0.2s; task text line-through as today (0.5s) | Instant |
| Popovers | Existing `@repo/ui/popover` fade and zoom-in-95 | Disabled via `motion-reduce:animate-none` on the content |
| Idle dim | 0.8s ease (as `.bf-chrome`) | Instant |
| Strip overflow scroll | `scrollIntoView` smooth | `behavior: 'instant'` |

---

## Accessibility

| Area | Contract |
|------|----------|
| Card (desktop) | `role="dialog" aria-modal="false" aria-labelledby="tasks-heading" data-tasks-card`. On open focus `#tasks-heading`; Escape closes (skip if `event.defaultPrevented` or a Radix dialog, menu or popover is open, same check as `RecordRoom.tsx`); on close focus returns to the opener (footer `[data-tasks-trigger]`, the slot button or the phone pill), falling back to the visible footer trigger |
| Card (phone) | vaul non-modal + Tab wrap + hidden title, as the record room |
| Tabs | Radix Tabs semantics; Arrow Left/Right switch tabs |
| List | `<ul>` of rows; every checkbox labelled by its task text; archive and restore buttons named "Archive {task}" / "Restore {task}"; the text edit button named "Edit {task}" |
| Column | Fieldset "Blocks" with native radios (section 3); breaks, done and current rows are readable text; times read as "10:00 to 10:25" in sr-only text |
| Assignment | Fieldset per selected block, checkboxes, descriptions for moves, polite live region for results |
| Drag | Never the only path; checking a box does the same thing |
| Slot and switcher | Button with `aria-haspopup="dialog"`; popover labelled "Session progress"; tiles are `aria-pressed` buttons; Escape returns focus to the slot |
| Now line and now pick | Button with full sentence name; popover labelled "Working on"; rows `aria-pressed`; result announced politely |
| Live updates | Only block changes and task actions are announced; time is never announced per second (the existing `role="timer"` stays the time source) |
| Focus order (desktop) | Header: logo, progress slot; timer: now line; footer controls; then the card when open (focus moves into it). DOM order already matches |
| Idle | Dimmed elements stay in the tab order; keyboard focus wakes the chrome |
| Targets | >= 44x44 on touch for every control (rows, checkboxes, nudge buttons, tiles, popover rows, close) |
| Contrast | Foreground and `hsl(24 5.4% 63.9%)` muted on `--panel-surface` pass 4.5:1; `--accent-ink` on every preset accent passes 4.5:1. The 35% and 55% idle states are deliberate glance states and wake to full contrast on any input |
| Reduced motion | See Motion; no animation is required to understand state |

---

## Copywriting Contract

Visible separators use " · " (middle dot), as the board and the existing Records caption do; clock
ranges use a plain hyphen "10:00 - 10:25" (discretion; CONTEXT writes hyphens throughout).

| Element | Copy |
|---------|------|
| Footer button | "Tasks" (tooltip and aria-label) |
| Card heading / close | "Tasks" / aria "Close tasks" |
| Tabs | "List", "Plan" |
| Primary CTA | "Add a task" (List); "Add a task to Block 3" (Assign panel) |
| Section labels | "Open", "Done", "Archived", "Working on", "This block", "Other open tasks", "Session progress" |
| Empty state heading | "No tasks yet" |
| Empty state body | "Add what you want to get done this session." |
| Empty block / no open tasks | "No tasks" / "No open tasks yet." |
| Plan summary | Planning "6 blocks · 2 h 55 min", "Ends 11:55". Live "Focus 62 min · 3/8 tasks · +5 min", "Ends 12:00" |
| Block row titles | "Block 3", "Block 3 · now", "Break · 5 min", "Break · 3:12 left" |
| Block meta | "10:00 - 10:25", "25 min", "25 + 5 min", "12:19 of 25 min", "12:19 of 25 min · paused" |
| Plan controls | "Length", "Add focus block", "Remove block", "Drop here", "Set now", "Mark done" |
| Plan footnotes | "Changes here apply to this session only." / "Drag a task onto a block to move it." / "16 blocks is the limit for one session." |
| Strip label | "3 / 6  Block 3 · 12:19 in · +5 min added"; "3 / 6  Break · 3:12 left"; "6 blocks  2 h 55 min · 8 tasks planned" |
| Now label | "3 / 6  Block 3 · 12:41 left · 2 tasks" (with "+5 min" when added) |
| Phone Now bar | "Block 3 · 12:41 left" |
| Now line | "NOW Draft Q3 body 3/8 done"; empty slot "Pick a task" |
| Phone Grid pill | "B3/6 Draft Q3 body"; break "Break · B3/6" |
| Switcher | Heading "Session progress"; tiles "Strip", "Now", "Grid"; row "Open session card" + "Full names, totals" |
| Customize | Label "Session progress"; options "Strip", "Now", "Grid"; helper "You can also tap the progress area on the timer screen." |
| Guest | "Saved in this browser. Sign in to keep tasks on every device." |
| Error state | "Couldn't load your tasks." + "Try again"; "Couldn't save {task}. Check your connection and try again."; "Couldn't save your plan. Check your connection and try again."; "This browser isn't saving your tasks. Private browsing can block storage." |
| Live region | "{task} moved to Block 3", "{task} added to Block 3", "{task} removed from Block 3", "Now working on {task}", "Block 3 of 6 started", "Break started" |
| Destructive confirmation | None in this phase. Remove block is undoable: toast "Block 4 removed" with action "Undo". Archive is reversible from Archived. There is no task delete |

---

## Component Inventory (for the planner)

Replaced: `to-do-list/ToDoList.tsx`, `ToDoListMobile.tsx` (and `TaskList.tsx` / `TaskItem.tsx` once
their behaviour moves). Reused or reshaped, not duplicated: `useTodoStore`, `hooks/useTasks.ts`.
New (names are suggestions; keep the file count small): `TasksButton`, `TasksCard` (desktop shell
and sheet switch, mirrors `RecordRoom`), `ListTab`, `PlanTab` (column, both states, Assign panel),
`ProgressSlot` (slot button, switcher, Strip and Now renderers; Grid = `SessionsUI`), `NowLine`
(now line, now pick, phone pill), one CSS module for the card and one for the slot, a pure
`deriveBlockTimes` with a `bun run` assert check. Edited: `Header.tsx`, `Timer.tsx`,
`timer-progress.module.css`, `globals.css`, `useTimerKeyboard.ts`, `StyleSection.tsx`,
`customize/sections/index.ts`, `catalog.ts`, `packages/types/look.ts`, `MenuSettings.tsx`,
`MenuSettingsMobile.tsx`, `RecordsButton.tsx` (exclusivity).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (already vendored in `packages/ui`) | tabs, checkbox, popover, drawer (vaul), input, button, tooltip, sonner | not required |
| Third-party | none | not applicable |

Dependency contract: no new package. Specifically not added: chart libraries (recharts, visx,
chart.js), calendar or scheduler libraries (FullCalendar, react-big-calendar), drag-and-drop
libraries (dnd-kit, react-dnd, react-beautiful-dnd, pragmatic-drag-and-drop), date libraries for
formatting (use `Intl.DateTimeFormat`). The strip, column, grid and previews are CSS; drag is
native HTML drag events with checkboxes as the accessible path; motion is the installed
framer-motion.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
