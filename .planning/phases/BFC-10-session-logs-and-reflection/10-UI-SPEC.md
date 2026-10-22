---
phase: 10
slug: session-logs-and-reflection
status: draft
shadcn_initialized: true
preset: not applicable (packages/ui/components.json, style default, baseColor zinc, cssVariables)
created: 2026-10-21
---

# Phase 10 - UI Design Contract: Session Logs and Reflection

> Visual and interaction contract for the break log modal (1C), the in-stage session summary (2A)
> with its done / not done / later list (5A), the Later group in the Tasks List tab, the `/log`
> page (3A), the What to improve panel (4D), the Export menu and toasts (6B), the Customize switch
> "Ask what got done at each break" (Q8), and the entry points to `/log`.
> Sources: 10-CONTEXT.md (locked picks 1C + 1-R, 2A, 3A, 4D, 5A, 6B, Q7, Q8, Q9), the Phase 10
> board `.lavish/phase10/board.html` (mocks `.modal`, `.lf`, `.sumd`, `.sump`, `.pact`, q4d-d,
> q4d-p, `.hr`, `.imp`, `.pva`, `.cal`, `#mdtext`, 6A, 2-1), 09-UI-SPEC.md (row, checkbox, add row,
> `.sec`, guest footnote, error and skeleton patterns), the restart-confirm card (#122,
> `session-card.module.css`, `SessionCard.tsx`), `customize/controls.tsx` (`ControlGroup`,
> `SegmentedControl`), `tasks/ListTab.tsx` + `tasks.module.css`, `progress/MiniStrip.tsx` +
> `progress.module.css`, `records.module.css`, `Timer.tsx` (Phase 8 ended state),
> `SessionCompleteModal.tsx`, `SessionTitleDisplay`, `MenuSettings.tsx`, `MenuSettingsMobile.tsx`,
> `middleware.ts`, `globals.css`.
> Values marked (discretion) are researcher picks inside Claude's Discretion or gaps the board
> leaves open. Board px values that are not multiples of 4 are rounded to the 4px grid; the
> rounding is listed under Spacing exceptions. Board weights 500 and 700 map to 400 and 600.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (existing, `packages/ui`) |
| Preset | not applicable |
| Component library | Radix via `@repo/ui` (`dialog` for the break modal, `dropdown-menu` for Export, `tooltip`, `sonner`), raw `@radix-ui/react-dialog` exactly as `SessionCard.tsx` does it. No new primitives |
| Icon library | lucide-react: `X`, `Plus`, `Check`, `Pencil`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `History` (new footer Log button), `Upload` (Export trigger), `Copy`, `Download`, `Share` |
| Font | `var(--font-app)` (Inter Tight, follows the Customize font pick) for UI text; `var(--font-mono)` (JetBrains Mono) for clock ranges, durations in meta lines, break lines, chips on block rows, counts, relative dates ("since Mon") and the break countdown; `var(--font-display)` is not used in this phase |
| Charts | CSS only: flex bars and a CSS grid calendar. No chart library |
| Confetti | `canvas-confetti` (already installed), one burst only |
| Animation | framer-motion (installed) with `useReducedMotion`, plus CSS transitions with a `prefers-reduced-motion` block. No new dependency |
| Modal shell | Reuse the restart-confirm card (#122): `.scrim` and `.confirm` shell, `.head`, `.title`, `.sub`, `.x`, `.body`, `.foot`, `.ghost`, `.primary`, `.sec` from `session-card.module.css`, at a new width (section 1). The planner may lift these into a shared module with no visual change (discretion) |
| Segmented control | New `Seg` with the same markup as `customize/controls.tsx` `SegmentedControl` (fieldset + sr-only legend + native radios overlaid on labels) and the board's pill styling (section 1). One component, two sizes (`md`, `xs`) |

---

## Shared State and Page Attributes

- **Break log preference.** `askAtBreak: boolean`, default `true`, persisted the same way as the
  Session progress pick (server look settings when signed in, browser storage for guests). Read
  through the same hydrate path as the Phase 9 progress view so SSR and client agree.
- **Phase 8 hook.** The break log modal opens when the user presses "Start break" in the timer's
  ended state (`status === 'ended'`, `Timer.tsx`), after the focus record is written and the break
  starts. The break runs behind the modal; nothing pauses.
- **Summary hook.** The summary replaces the digits when the user presses "Finish session" in the
  ended state of the last focus block (same moment `SessionCompleteModal` fires today). It stays
  until "Start new session".
- **Mode word.** `SessionTitleDisplay` gains a fourth word "Done" while the summary shows (Focus /
  Break / Paused / Be Focus / Done).
- **Middleware.** `/log` is added to the routes both guests and signed-in users can open. It is
  never redirected.
- **Session round trip.** Opening `/log` from the timer and coming back must not lose a running or
  finished-but-unacknowledged session (the timer store lives above the route). If the planner finds
  it does not survive client navigation, the footer Log button is disabled while a session runs,
  with tooltip "Log opens between sessions" (discretion fallback).
- **Keyboard guard.** Add `[data-break-log]`, `[data-session-summary]` and `[data-log-page]` to
  `GUARDED_CONTAINER_SELECTOR` in `useTimerKeyboard.ts` so Space, arrows and shortcuts typed in the
  textarea, inputs or segmented controls never reach the timer.
- **Guest vs signed in.** Guests read and write logs via `lib/storage/browser-storage.ts`; signed-in
  users via the API. No migration. The UI is identical apart from the guest footnote.
- **Formatting.** Clock ranges `09:35 - 10:00` via `Intl.DateTimeFormat(undefined, { hour:
  '2-digit', minute: '2-digit' })` (as Phase 9). Dates "Tue 21 Oct" via `Intl.DateTimeFormat(undefined,
  { weekday: 'short', day: 'numeric', month: 'short' })`, year appended when not the current year.
  Headline and history durations are compact: "50m", "1h", "1h 32m"; time added inside blocks and
  chips keeps the Phase 9 form "+5 min" (discretion, mirrors the board).

---

## 1. Break Log Modal (1C + 1-R)

### Trigger and dismissal

- Opens on "Start break" when `askAtBreak` is on. It does not open after the last focus block
  (no break follows; the summary covers that block, section 2).
- Skip, Escape and the close X all act as Skip: close, write nothing, the break keeps running.
- Clicking the scrim does nothing (`onPointerDownOutside` prevented), so a stray click never throws
  away typed text (discretion).
- Save writes everything at once: log text, rating, ticks (Phase 9 `completed` link), moves
  (`planTask`) and Later flags. Nothing is written before Save, so Skip leaves the tasks where they
  were (discretion). Unticked tasks left behind by a Skip surface in the summary's Not done list.
- When the break countdown reaches 0 with the modal open, the countdown text reads "Break over"
  and the modal stays open. It never auto-closes on typed work.
- Save closes optimistically. Shortcut: Cmd/Ctrl+Enter saves from anywhere in the card; plain Enter
  inserts a newline in the textarea.

### Shell (restart-confirm card)

- `.scrim` `rgb(0 0 0 / 0.55)` (existing, board `.6` not adopted), z-index 50.
- Card: the `.confirm` shell (fixed, centered, `--panel-surface`, 1px `--panel-hair` border,
  radius 18, shadow `0 24px 60px rgb(0 0 0 / 0.5)`, `rise` 0.22s / `sink` 0.15s), width
  `min(440px, calc(100vw - 32px))` (358px on a 390px phone, as the board), `max-height:
  calc(100dvh - 32px)`, grid rows `auto minmax(0, 1fr) auto`. Root carries `data-break-log`.
- `.head` padding 20 12 8 20; `.body` padding 8 20 20, gap 16, scrolls; `.foot` padding 12 16 16 20,
  border-top hairline. Under 640px use the existing card overrides (head 16 8 8 16, body 8 16 20,
  foot 12 12 12 16).

### Contents, top to bottom

1. **Head.** Title "What got done in block 2?" (15px/600, `.title` rules otherwise). Sub (13px
   muted): the block's tasks joined with " · " then the clock range, "Review PR · Reply to Alex ·
   09:35 - 10:00". More than 3 tasks: first 3 then "+2 more". No tasks: the range only. A skipped
   block appends " · skipped". Close X 32x32 (44 on touch), aria-label "Skip log".
2. **Textarea.** No visible label (the title labels it via `aria-labelledby`). Min-height 84px,
   auto-grows to 160px then scrolls, padding 8 12, radius 12, `--panel-soft` + inset 1px
   `--panel-hair`, 15px/1.4 (16px under 1024px). Placeholder "A line or two is enough". Max 2000
   characters (discretion). Focused on open.
3. **"Tasks in this block"** (`.sec` label, 11/600 caps 0.12em). Hidden when the block had no tasks.
   One row per task assigned to the block:
   - Row min-height 36 (44 on touch), gap 12, 15px. Box = Phase 9 checkbox (20px circle, accent fill
     + `--accent-ink` check when ticked). The whole row is the label.
   - Unticked: trailing "not done" (11px mono, muted). Under it a **carry row**, padding-left 32
     (box 20 + gap 12), gap 8, flex-wrap: "Move to" (13px muted) + `Seg xs` with one option per
     remaining focus block ("Block 3", "Block 4"), then "Later". The next remaining focus block is
     preselected. If more than 3 focus blocks remain, the first 3 are offered (the Plan tab reaches
     the rest) (discretion). If no focus block remains, the control shows "Later" alone, selected.
   - Ticking a row hides its carry row (height collapse, section Motion); unticking restores it with
     the default selection.
4. **"How was the focus?"** (`.sec` label) + `Seg md` [Scattered | Okay | Deep]. Optional; nothing
   selected by default. Choosing the selected option again clears it (discretion).
5. **Foot.** "Break 04:12 left" (13px mono, tabular-nums, muted, `margin-right: auto`, updates each
   second, not announced), ghost "Skip", primary "Save". Buttons use the card's `.ghost` /
   `.primary` (36px, 44 on touch, 13px). Under 640px the row keeps one line; the countdown
   shortens to "04:12 left".

### Segmented control `Seg`

| Part | md | xs |
|------|----|----|
| Track | `display: inline-flex`, padding 4, gap 4, radius 999, `--panel-soft` + inset 1px `--panel-hair` | padding 2, gap 2 |
| Item | height 32 (board 30), padding 0 12, radius 999, 13px/400 muted | height 24, padding 0 8, 13px (board 12) |
| Selected | `hsl(var(--foreground))` fill, `#101010` text, 600 | same |
| Hit area on touch | item min-height 44 | visual 24px; a transparent `::before` extends the hit area to 44px tall (`inset: -10px 0`); carry rows are 44px tall on touch so hit areas never overlap |

Selected state never uses accent. Long option sets wrap to a second line rather than scroll.

### Edit mode (same form, later)

The same `LogForm` (title, textarea, ticks, rating) edits a block's log from the summary and from
`/log`, rendered inline in the block row (section 2) without the modal shell. Differences: no
"Move to" carry rows (task fate is handled by the done list), the foot is ghost "Cancel" + primary
"Save" (no countdown), Escape cancels and returns focus to the row's Edit button.

---

## 2. Session Summary in the Stage (2A)

### Placement

- Replaces the timer digits and controls inside the existing `motion.main` on both `/` and
  `/guest`. Root carries `data-session-summary`. `SessionCompleteModal` is rebuilt as this view;
  its "Congratulations!" copy, 5-second firework interval and modal shell are removed.
- Header: the Phase 9 strip stays with every block done, label "4 / 4  Session done · 1h 32m
  focused"; mode word "Done". Footer unchanged.
- Confetti: one burst on entry (Motion). Not on revisits, reloads or past sessions.

### Desktop (>= 1024px)

- Area: from below the header strip to above the footer, horizontal inset 112px at >= 1440px and
  64px at 1024-1439px, grid columns `560px minmax(0, 1fr)`, gap 64 (board 72). On 1024-1279px the
  left column narrows to `minmax(0, 480px)`.
- **Left column** (flex column, `min-height: 0`):
  1. Eyebrow (11/600 caps 0.12em, muted): "Session done · Tue 21 Oct · 09:00 - 10:44".
  2. Headline (Display, 64px/600, line-height 1, letter-spacing -0.035em, tabular-nums): "1h 32m
     focused", "focused" in the same size at muted color. Margin-top 8.
  3. Stat chips row, margin-top 16, gap 8, wraps.
  4. Done / Not done / Later list (section 3), margin-top 24, scrolls inside the column with a
     24px fade mask at the bottom when it overflows.
  5. Actions row pinned to the bottom (`margin-top: auto`, padding-top 16), gap 8: Export
     (secondary, opens upward), ghost "Open log" (section 9), spacer, primary "Start new session".
- **Right column** (scrolls independently, same fade mask): `.sec` "Blocks and logs", the block
  rows, then "Next time".

### Stat chips

- Height 32 (board 30), padding 0 12, radius 999, `--panel-soft` + inset 1px `--panel-hair`, 13px
  400 with the value at 600. Not interactive.
- Desktop order: "3 / 4 blocks", "1 skipped", "+5 min added" (the "+5 min" value in
  `--overtime`), "3 / 5 tasks", "1 break cut short".
- Phone: "3 / 4 blocks", "+5 min", "3 / 5 tasks".
- A chip whose value is zero is omitted; the tasks chip is omitted when no task was planned
  (discretion). The blocks chip always shows.

### Block rows

- Grid `96px minmax(0, 1fr)`, gap 4 16, padding 8 0, border-top 1px `--panel-hair` (none on the
  first row).
- Col 1: clock range "09:00 - 09:30", 11px mono muted, line-height matches the title line.
- Col 2 line 1: "1 · Write notes" (15/600; block number, then its tasks joined " · ", ellipsis;
  no tasks: "1 · Focus"), then chips (height 20, padding 0 8, radius 999, `--panel-lift`, 11px
  mono): "+5 min" in `--overtime`, "skipped" (muted), the rating "Deep" / "Okay" / "Scattered"
  (foreground).
- Col 2 line 2: the log text, 15px/1.4 muted, full text (no clamp in the stage; 2-line clamp in
  `/log` rows only).
- Edit: hover or focus-within reveals a 32x32 (44 on touch, always visible on touch) ghost icon
  button `Pencil` at the row end, aria-label "Edit log for block 1". Clicking the log text also
  opens the form. The row expands into the inline `LogForm` (section 1, edit mode).
- No log: line 2 is a ghost text button "+ Add a log" (13px muted, height 32/44).
- The **last focus block** row opens with its inline form already expanded (not focused) when the
  summary appears live and `askAtBreak` is on, since no break asked about it (discretion).
- Break lines between rows: 11px mono muted, padding-left 112 (96 + 16), height 24: "Break · 5
  min"; cut short "Break · 2 of 5 min · cut short" in `--overtime`; skipped break "Break · skipped".

### Next time

- `.sec` "Next time", margin-top 24. Textarea, 1 row auto-growing to 4, min-height 44 (board),
  padding 8 12, radius 12, `--panel-soft` + hairline, 15px/1.4. Placeholder "One thing to try
  next session". Saves on blur and on "Start new session"; no success toast.

### Phone and tablet (< 1024px)

- One scroll container from below the phone strip (Phase 9, 40px, count "4 / 4") to the top of
  the action bar, padding 0 20, 24px fade masks top and bottom.
- Order: eyebrow "Session done · Tue 21 Oct"; headline "1h 32m" (Display 48px/600); line "focused
  · 09:00 - 10:44" (15px muted); 3 chips; the list (section 3); "Blocks and logs" with the block
  rows (grid `80px 1fr`, break lines padding-left 96); "Next time"; ghost "Open log" full width 44.
  Section gaps 24. Bottom padding = action bar height + 16.
- **Pinned action bar** above the footer icons: inset 0 16, grid `1fr 1fr`, gap 8 (board 6),
  buttons 44px, 15px: secondary "Export", primary "New session". The Export menu opens upward at
  the bar's full width.

---

## 3. Done / Not done / Later List (5A)

Rows reuse the Phase 9 list row metrics (min-height 36, 44 on touch, gap 12, 15px, box 20px).
Sections stack with 16 between them; `.sec` labels with an `em` count ("Done 3").

- **Done.** Tasks completed during this session, then free-text items. Box checked (accent),
  text line-through muted. Unticking a task box moves it to Not done with its default fate.
  Free-text items show the same checked box (decorative) and a hover/focus `X` 32x32 (44 touch)
  "Remove {text}". Last row: Phase 9 `AddRow` with label "Add something you did" (dashed
  `rgb(255 255 255 / 0.14)` border, 36px/44px, 13px muted); Enter adds, Escape cancels.
- **Not done.** Tasks planned into this session's blocks and not completed. Row: box (ticking
  moves it to Done), text (flex 1, ellipsis), `Seg xs` [Next session | Later | Drop].
  - Default: "Next session" for a task assigned to the last focus block, "Later" otherwise
    (CONTEXT; overrides the board's Later preselect).
  - Choices write immediately and the defaults are written when the summary first appears, so
    leaving the page never loses them (discretion). Next session plans the task into block 1 of
    the next plan; Later sets the flag and unplans; Drop archives (reversible from Archived).
  - Drop selected: the row text drops to 60% opacity.
  - Phone: the seg moves to its own line under the text, padding-left 32.
- **Later.** Tasks that carried the Later flag before the summary (set in break modals or
  earlier), excluding anything already in Not done (no task appears twice). Box dashed (1.5px
  dashed muted circle, `aria-hidden`, not interactive), text, trailing 11px mono muted relative
  date: "today", "yesterday", "since Mon", "since 14 Oct". Shows up to 5, then a ghost row "+3
  more in Tasks" that opens the Tasks card on the List tab (discretion). Section hidden when empty.
- **Past sessions (`/log` and any revisit).** Read-only fates: Not done rows show a trailing
  11px mono muted tag "next session" / "later" / "dropped" instead of the seg; Done ticks and the
  add row are hidden; logs and Next time stay editable (discretion).

---

## 4. Later Group in the Tasks List Tab

- Order in `ListTab`: Open rows, Add row, **Later**, Done, Archived disclosure, guest note.
- `.sec` label "Later" with `em` count; section margin-top 24; hidden when empty.
- Rows: Phase 9 task row with the box drawn dashed (1.5px dashed `rgb(255 255 255 / 0.4)`
  circle; still a working checkbox that completes the task), text, trailing 11px mono muted
  relative date as section 3.
- Row actions on hover / focus-within (always visible on touch): a 13px ghost text button "Bring
  back" (height 32, 44 on touch) that clears the flag and moves the row to Open, then the existing
  Archive button.
- Assigning a Later task to a block in the Plan tab clears its flag; it appears with a dashed box
  in the Assign panel's "Other open tasks".
- CSS: the existing `.later` class in `tasks.module.css` is a spacing helper; name the new group
  `.laterGroup` / `.laterBox` to avoid the collision.

---

## 5. Log Page `/log` (3A)

### Shell

- New route reachable by guests and signed-in users. Root `data-log-page`, `main` landmark,
  `--bg-solid` background, `var(--font-app)`.
- Top row: secondary button "Timer" with `ChevronLeft` (36px, 44 touch; `router.back()` when the
  previous entry is the timer, else push `/` or `/guest`); `h1` "Log" (32px/600, letter-spacing
  -0.02em); spacer; guest only, 13px muted "Saved in this browser · Sign in" with "Sign in" a link.
  The board's "Signed in" caption is not shown (discretion).

### Desktop (>= 1024px)

- Padding 32 64 (board 28 64). Below the top row (margin 24): grid `520px minmax(0, 1fr)`, gap 32,
  height fills the viewport; both columns scroll independently with 24px fade masks.
- **Left column:** What to improve panel (section 6), then day groups, then the guest footnote
  "Saved in this browser. Sign in to keep your log on every device." (13px muted, margin-top 16).
- **Right column:** the selected session in a panel: padding 24, radius 18, `--panel-surface`,
  1px `--panel-hair` border, gap 12. Contents: eyebrow "Tue 21 Oct · 09:00 - 10:44", headline
  "1h 32m focused" (Display 48px; board 52), stat chips, grid `minmax(0, 1fr) minmax(0, 1fr)`
  gap 24 (board 28) with the read-only list (section 3) left and "Blocks and logs" + "Next time"
  right, then the actions row: Export only. Default selection: the most recent session.

### Day groups and history rows

- Day label: 11/600 caps 0.12em muted, padding 16 12 4 (board 10 12 2): "Today", "Yesterday",
  then "Mon 20 Oct". Sessions newest first.
- Row (`button`, full width, `aria-current="true"` when selected): grid `minmax(0, 1fr) auto`, gap
  4 12, padding 8 12, radius 12, min-height 44.
  - Line 1 left: "Ended 10:44" 15/600. A session stopped before its last block reads "Stopped
    10:44" (discretion). Right: "1h 32m · 3 / 5 tasks" 11px mono muted (tasks part omitted when
    none).
  - Line 2 (full width): mini strip, 12px tall, gap 2, radius 3, widths via `stripWidths` (as
    `MiniStrip`): done focus = accent, done break = `--done-break`, skipped focus = `--cell` +
    `--hatch-light`, not reached = `--cell` / `--cell-break`. No current ring.
  - Line 3 (full width): first log line, 13px muted, single-line ellipsis. Omitted when the
    session has no log text.
  - Hover `rgb(255 255 255 / 0.04)`; selected `rgb(255 255 255 / 0.06)` + inset 1px
    `rgb(255 255 255 / 0.1)`.
- Long history: render all rows from the store or the first API page; "Show older" ghost button
  (full width, 44px) at the end loads the next page (signed in) (discretion).

### Phone and tablet (< 1024px): list to detail

- Padding 24 20 (board 28 20). Top row: 44x44 icon back button (`ChevronLeft`, aria-label "Back to
  timer") + `h1` "Log" 32px. Then the improve panel, then day groups, then the guest footnote.
- Tapping a row swaps the page to the detail view (component state, no per-session URL): top row
  becomes the back icon (aria-label "Back to log") + the eyebrow date as title (15/600); body is
  the section 2 phone layout without the action bar's "New session": a full-width secondary
  "Export" pinned at the bottom (inset 0 16, 44px). Back restores the list scroll position and
  focuses the row that was opened. Browser back is not intercepted (discretion).

### States

- Loading (signed in): improve panel skeleton 160px + 4 row skeletons 72px, `--panel-soft`,
  radius 12, gap 8, pulse 0.5-1 over 1.2s (static under reduced motion), `aria-busy="true"`.
  Right column: panel skeleton 480px.
- No sessions (guest or signed in): improve panel hidden; centered in the page (max-width 360):
  heading "No sessions yet" (15/600), body "Finish a focus session and it shows up here with
  what you got done." (13px muted), primary "Start a session" (links to the timer).
- Load error: inline at the top of the left column, 13px on `hsl(var(--destructive) / 0.15)`,
  radius 12, padding 8 12: "Couldn't load your log." + ghost "Try again".

---

## 6. What to Improve Panel (4D)

### Panel

- Padding 16 (board 14), radius 16 (board 14), `rgb(255 255 255 / 0.035)` + inset 1px
  `--panel-hair`; margin-bottom 16 above the day groups.
- Head row (flex, baseline, gap 8): `.sec` "What to improve" with `em` "last 14 days"; `Seg xs`
  [Insights | Charts | Both] right-aligned, legend "Improve view". The pick persists per device in
  browser storage (key `befocus:improve-view`, signed in or not). Default "Insights"
  (discretion). Read after mount; the server render shows Insights.
- Body margin-top 12. View swap is a 0.2s cross-fade.

### Insights

- Up to 3 observations (2 on phone), gap 16, ordered by strength. Each: grid `20px minmax(0, 1fr)`,
  gap 4 0. Col 1: 8px accent dot, top-aligned to the first text line. Col 2: text 15px/1.4.
  Evidence row under the text (col 2): 24px tall (board 22), flex, `align-items: end`, gap 4
  (board 3), 6-10 bars, each `flex: 1; max-width: 16px` (board 18), radius 2.
- Bars = one per session or block occurrence the rule looked at, oldest left. Height = that
  occurrence's value for the rule (time used / planned, capped at 100%, minimum 20%). Color: the
  pattern happened = `--overtime` (skip, cut break) or `--hatch-light` over `rgb(255 255 255 /
  0.1)` (added time, matching the charts legend); pattern did not happen = accent; no data =
  `rgb(255 255 255 / 0.14)`.
- Evidence row is `role="img"` with an aria-label stating the count, e.g. "4 of 6 sessions had
  added time".
- Observation templates (rules, no AI; Q7). Fire only with at least 3 matching occurrences in the
  window:

| Rule | Copy |
|------|------|
| Added time | "You added time in {n} of your last {m} sessions, usually to block {b}. Try a {x} min first block." (the block clause and the tip adapt to the block that took the most added time) |
| Skipped block | "Block {b} is where you skip: {n} of the last {m} times. Plan something lighter there." |
| Cut breaks | "Breaks were cut short {n} times in the last 14 days. Focus after a cut break was rated Scattered {k} times." (second sentence only when k >= 2) |
| Carried tasks | "{n} tasks were carried to the next session more than twice. Split them or set them aside." |
| Deep time of day | "Most of your Deep blocks started before {time}. Plan the hard work there." |

- No rule fires: one line "Nothing stands out in the last 14 days." 13px muted.

### Charts

- Caption 13px muted: "Planned (outline) vs focused (fill), added time hatched".
- Planned vs actual rows, gap 8: grid `48px minmax(0, 1fr) 48px` (board 52 / 46), gap 8, 11px mono
  muted. Col 1 day "Tue 21"; col 3 focused "92m", right-aligned. One row per day with sessions,
  newest first; 6 rows desktop, 4 phone.
  - Bar track 12px tall, radius 3. Outline element width = planned / scale, inset 1px
    `rgb(255 255 255 / 0.2)`. Fill element width = focused / scale, accent. Added portion: the
    last `added / scale` of the fill drawn with `--hatch-dark` over accent. `scale` = the largest
    of planned + added and focused across visible rows.
  - Each row has sr-only text "Tue 21 Oct: planned 100 minutes, focused 92 minutes, 5 added".
- `.sec` "5 weeks", margin-top 16. Calendar: weekday initials row "M T W T F S S" (11px muted),
  then 7 columns x 5 rows, gap 4, square cells (`aspect-ratio: 1`, max 28px), radius 3. Levels by
  focused minutes that day: 0 = `rgb(255 255 255 / 0.06)`; under 60 = accent at 35%; 60-119 = 65%;
  120+ = 100% (mix with `--bg-solid`). Today: 1.5px foreground ring. Days after today: hidden
  (`visibility: hidden`). Rendered as a `<table>` with an sr-only caption "Focus time, last 5
  weeks"; each cell has sr-only text "Tue 21 Oct, 1h 32m focused" or "no focus".

### Both

2 observations (with evidence) + 4 planned vs actual rows. No calendar (Charts only).

### Empty (fewer than 3 finished sessions)

The head keeps the title and hides the seg. Body: "Finish 3 sessions to see what to improve."
(15px), then "1 of 3 so far" (11px mono muted) with three 8px dots (accent for each finished
session, `rgb(255 255 255 / 0.14)` otherwise), gap 4.

---

## 7. Export Menu and Toasts (6B)

- Trigger: secondary button "Export" (40px on the desktop stage and `/log`, 44 on touch; 15px/400;
  inset 1px `rgb(255 255 255 / 0.14)`; radius 8; padding 0 16) with `Upload` (16px) before and
  `ChevronDown` (14px) after. Radix `DropdownMenu` from `@repo/ui`.
- Menu: `side="top"`, `align="start"`, offset 8, width 260 (full bar width on phone), padding 4,
  radius 12, background `color-mix(in srgb, var(--bg-solid), #fff 7%)`, border 1px
  `rgb(255 255 255 / 0.1)`, shadow `0 24px 60px rgb(0 0 0 / 0.5)`.
- Items: height 40 (board 38; 44 on touch), padding 0 12, radius 8, gap 8, 15px, 16px icon muted.
  Highlighted: `--panel-lift`.
  1. `Copy` "Copy as text"
  2. `Copy` "Copy as Markdown"
  3. `Download` "Download .md"
  4. `Download` "Download .txt"
  5. `Share` "Share" (only when `navigator.share` exists, checked after mount; no "where
     supported" sub line in the product)
- Toasts (existing sonner `Toaster`): "Copied as text", "Copied as Markdown". Downloads and Share
  show no toast. Share cancelled: silent. Clipboard failure: "Couldn't copy. Your browser blocked
  clipboard access." Share failure falls back to copying Markdown with its toast.
- File names: `befocus-2026-10-21-0900.md` / `.txt` (local start date and time).
- Markdown (`#mdtext`). Empty sections, ratings, chips and log lines are omitted. Free-text done
  items appear in Done. Later excludes tasks already in Not done (section 3):

```
# Focus session · Tue 21 Oct 2026
09:00 - 10:44 · 1h 32m focused · 3 of 4 blocks · 1 skipped · +5 min added

## Done
- [x] Write notes
- [x] Review PR
- [x] Reply to Alex

## Not done
- [ ] Fix flaky timer test (later)
- [ ] Draft Phase 10 board (next session)

## Later
- Update README

## Blocks
1. 09:00 - 09:30 · Write notes · +5 min · Deep
   Outline done, intro drafted.
2. 09:35 - 10:00 · Review PR · Reply to Alex · Okay
   Reviewed the Phase 9 PR, left 3 comments. Answered Alex about the release.
3. 10:02 - 10:14 · Fix flaky timer test · skipped · Scattered
   Could not reproduce it, got pulled into Slack.
4. 10:19 - 10:44 · Draft Phase 10 board · Deep
   Mocks half done, export section left.

## Next time
Silence Slack before the third block.
```

- Plain text: the same content with `#` / `##` removed, "- [x]" / "- [ ]" written as "- ", and a
  blank line between sections.

---

## 8. Customize Switch (Q8)

- New `ControlGroup` `id='customize-break-log'`, label "Break log", value "On" / "Off", placed
  directly after `customize-session-progress` in `CUSTOMIZE_SECTIONS` (same "Timer" chip group).
- Content: one switch button with the `SessionCard` switch look (`role="switch"`,
  `aria-checked`, 32x20 track, 16px knob, checked = foreground track + `#101010` knob moved 12px,
  min-height 36 / 44 on touch, 13px) labelled "Ask what got done at each break". Styles copied into
  the Customize module or lifted shared (discretion).
- Helper under it (Customize helper rules: 13px, line-height 1.4, margin-top 8, opacity 0.6): "The
  summary at the end of a session always shows."
- Toggling saves immediately, as the Session progress pick does. Turning it off mid-session
  affects the next "Start break".

---

## 9. Entry Points to `/log`

- **Footer.** New `LogButton` (`MenuButton`, lucide `History`, tooltip side top "Log",
  aria-label "Log") placed directly after `TasksButton` in `MenuSettings.tsx` and
  `MenuSettingsMobile.tsx`. It is a `next/link` to `/log` (no `data-active`; it navigates). Shown
  on `/` and `/guest`.
- **Summary.** Desktop actions row ghost "Open log" (`History` icon 16px + label, 40px); phone
  full-width ghost row at the end of the scroll content.
- `/log` back button returns to the timer (section 5).

---

## 10. Phone Summary of Layout Rules (< 1024px)

| Surface | Rule |
|---------|------|
| Break modal | Same card at `calc(100vw - 32px)` (358px at 390), under-640 card padding, 44px targets, seg xs with 44px hit areas, countdown shortened to "04:12 left" |
| Summary | Single scroll column, fade masks, pinned 2-button bar above the footer icons |
| Done list | Not done seg on its own line, padding-left 32 |
| `/log` | List, tap to detail, back to list with restored scroll and focus |
| Improve panel | 2 observations in Insights, 4 rows in Charts and Both, calendar cells sized to width |
| Text inputs | 16px font (iOS zoom), as Phase 9 |

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Seg track padding and item gap (md), evidence bar gap, calendar gap, row line gaps, dot gaps |
| sm | 8px | Textarea vertical padding, chip gaps, actions gaps, body padding-top, menu offset, list row vertical padding, carry row gap |
| sm+ | 12px | Row horizontal padding, box-to-text gap, item padding, panel gaps, improve body margin |
| md | 16px | Modal body gap, block row column gap, observation gap, section gaps in the list, improve panel padding, action bar inset, stat row margin |
| lg | 24px | Modal-to-summary section gaps, panel padding on `/log`, fade masks, page top-row margin, Next time margin |
| xl | 32px | `/log` column gap, `/log` desktop vertical padding, carry row and seg indent |
| 2xl | 64px | Summary column gap, `/log` desktop horizontal padding, summary horizontal inset at 1024-1439 |

Exceptions: 2px seg xs padding and gap, mini strip gap and evidence radius (board);
20px phone horizontal padding (inherited from Phase 9 sheets and the board); 96px / 80px block
time column and 112px break line indent; 112px summary inset at >= 1440 (board); 44px touch
targets; 1.5px rings and dashed boxes. Board values rounded to the 4px grid: modal padding 22 ->
20/24 (card shell), phone 18 -> 16, `.lf` gap 14 -> 16, textarea padding 10x12 -> 8x12, seg item
30 -> 32, stat chip 30 -> 32, rate chip 22 -> 20, block row gap 4x14 -> 4x16, summary gap 72 -> 64,
summary top 190 -> header-relative, `.pact` gap 6 -> 8, history row padding 10x12 -> 8x12 and gap
6x10 -> 4x12, day label padding 10 12 2 -> 16 12 4, improve padding 14 -> 16, evidence 22 -> 24
tall with 3 -> 4 gap and 18 -> 16 max bar, `.pva` columns 52/46 -> 48/48, `/log` padding 28 -> 32
(desktop) and 24 (phone), log panel grid gap 28 -> 24, menu padding 6 -> 4, menu item 38 -> 40,
menu item gap 10 -> 8.

---

## Typography

Two weights for all new text: 400 and 600. Font `var(--font-app)`; `var(--font-mono)` with
`tabular-nums` for clock ranges, meta durations, chips on block rows, break lines, counts and the
countdown.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label (section caps, eyebrows, day labels, clock ranges, break lines, block chips, row meta, relative dates, "not done", calendar initials) | 11px | 600 caps (tracking 0.12em) / 400 mono | 1.2 |
| Secondary (modal sub, stat chips, seg items, buttons in the modal card, helper and footnotes, captions, first log line in history, add rows, toasts) | 13px | 400 (chip values and selected seg 600) | 1.4 |
| Body (modal title, textarea, task rows, block row titles and logs, observations, menu items, stage and `/log` buttons, history row titles, `/log` detail title on phone) | 15px | 400 (titles and primary buttons 600) | 1.4 (titles 1.3, letter-spacing -0.01em) |
| Display (summary headline, page title) | 64px desktop stage / 48px phone stage and `/log` detail / 32px `/log` page title | 600, tabular-nums | 1 (page title 1.1), letter-spacing -0.035em (page title -0.02em) |

Exceptions: text inputs are 16px under 1024px; the board's 17px modal title is 15px here
(matches card headings) and its 68 / 52 / 40px headlines map to 64 / 48 / 32; board 12px mono meta
maps to 11px and 14px rows to 13 or 15. Customize control styles, timer digits and the strip are
existing and unchanged.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--bg-solid)`, default `hsl(0 0% 6.3%)` | Stage behind the summary, `/log` page |
| Secondary (30%) | `--panel-surface` = `color-mix(in srgb, var(--bg-solid), #fff 5%)`; `--panel-soft` `rgb(255 255 255 / 0.05)`, `--panel-lift` `rgb(255 255 255 / 0.08)`, `--panel-hair` `rgb(255 255 255 / 0.08)`; improve panel `rgb(255 255 255 / 0.035)`; menu `color-mix(in srgb, var(--bg-solid), #fff 7%)` | Modal, `/log` panel, improve panel, chips, seg tracks, textareas, rows, menu |
| Accent (10%) | `var(--user-accent)` (default `#f5f5f4`) | Reserved list below |
| Attention | `--overtime: hsl(38 92% 62%)` (new, from the board) | Reserved list below |
| Destructive | `hsl(var(--destructive))` = `hsl(0 62.8% 30.6%)` | Inline load and save error tint only. Drop is not styled destructive (reversible) |

Tokens reused from Phase 9 (declared on the summary, modal, `/log` and Tasks roots): `--cell`,
`--cell-break`, `--done-break`, `--accent-ink`, `--hatch-dark`, `--hatch-light`. New: `--overtime`
on the summary and `/log` roots only.

Accent reserved for: (1) done focus cells in the Phase 9 strip and history mini strips; (2)
checked boxes in the modal, the summary list and the Tasks Later group; (3) observation dots and
"did not happen" evidence bars; (4) the focused fill in planned vs actual bars and calendar levels;
(5) the empty-state progress dots; (6) confetti. Buttons, seg selections, links, menus, chips and
the switch never use accent (they use foreground).

`--overtime` reserved for: the "+N min" value in chips and block rows, cut-short break lines, and
skip / cut-break evidence bars. Nothing else, including confetti (board used it; dropped).

---

## Interaction States

| Control | Hover | Focus-visible | Active / selected | Disabled |
|---------|-------|---------------|-------------------|----------|
| Modal X, ghost, primary | existing card rules | 2px ring | - | Save never disabled (an empty log saves ticks and moves) |
| Seg items | text to foreground | ring on the item (`input:focus-visible + label`) | foreground fill, `#101010` text, 600 | - |
| Task tick rows (modal, list) | `--panel-soft` fill | ring on the box | accent box + ink check | - |
| Block row | Edit button appears | ring on Edit / "Add a log" | expanded form: row gets `--panel-soft` fill, radius 12, padding 8 12 | - |
| Stat chips | none | not focusable | - | - |
| Stage / `/log` buttons | primary `hsl(var(--foreground) / 0.9)`; secondary `--panel-soft` fill; ghost `--panel-soft` + foreground text | ring | Export trigger while open: `--panel-lift` | - |
| Export menu items | `--panel-lift` | `--panel-lift` (Radix highlighted) | - | - |
| History row | `rgb(255 255 255 / 0.04)` | ring | `rgb(255 255 255 / 0.06)` + inset hairline 0.1 | - |
| Add rows | text and border to foreground at 60% | ring | becomes input | - |
| Footer Log button | existing `MenuButton` | existing ring | - | Fallback only: 40% opacity with tooltip (Shared State) |
| Customize switch | text to foreground | ring on the track | foreground track | - |

Focus ring everywhere: `outline: 2px solid hsl(var(--ring)); outline-offset: 2px`.

---

## States

| State | Behaviour |
|-------|-----------|
| Log save error (modal or inline) | Optimistic; on failure toast "Couldn't save your log for block 2. Check your connection and try again." with action "Try again" (resends the same payload) |
| Fate / Next time / done item save error | Rollback the control; toast "Couldn't save that change. Check your connection and try again." |
| Guest storage unavailable | Toast once per page load: "This browser isn't saving your log. Private browsing can block storage." |
| Summary data | Renders from local timer state immediately; never shows a skeleton |
| `/log` loading, empty, error | Section 5 States |
| Improve under 3 sessions | Section 6 Empty |
| No rule fires | "Nothing stands out in the last 14 days." |
| Block with no log | "+ Add a log" (summary), first log line omitted (history), omitted in export |
| Session with no tasks | Tasks chip, "Tasks in this block" and the Done / Not done sections hidden; "Add something you did" stays under a "Done" label |
| Break ends with modal open | "Break over" in the foot; modal stays |
| `askAtBreak` off | No modal at breaks; summary and its last-block inline form unaffected (form starts collapsed) |

---

## Motion

Ease `EASE = [0.2, 0.7, 0.2, 1]`. Gate every framer-motion animation on `useReducedMotion()`;
CSS transitions get a `prefers-reduced-motion` block.

| Moment | Full motion | Reduced motion |
|--------|-------------|----------------|
| Break modal open / close | Existing `rise` 0.22s / `sink` 0.15s, scrim `fade` 0.2s | Existing rule: none |
| Carry row collapse on tick | Height `auto -> 0` + opacity, 0.2s EASE | Instant |
| Seg selection | Background and color 0.15s | Instant |
| Digits -> summary | Digits fade out 0.2s; summary `opacity 0 -> 1, y 8 -> 0`, 0.45s EASE | Instant swap |
| Confetti | Two `confetti()` calls, origins `{x: 0, y: 1}` angle 60 and `{x: 1, y: 1}` angle 120, 60 particles each, spread 55, startVelocity 45, ticks 120 (about 1s), colors `[var(--user-accent) resolved, '#a8a29e', '#78716c']`, `disableForReducedMotion: true` | Not fired |
| Inline log form expand | Height + opacity 0.25s EASE | Instant |
| `/log` list -> detail (phone) | Detail `x 24 -> 0, opacity 0 -> 1` 0.3s EASE; back reverses | Instant |
| Improve view swap | Cross-fade 0.2s | Instant |
| Export menu | Existing `@repo/ui` dropdown fade + zoom-in-95 | `motion-reduce:animate-none` |
| Skeleton pulse | Opacity 0.5-1 over 1.2s | Static |
| Countdown | Text swaps each second, no animation | Same |

---

## Accessibility

| Area | Contract |
|------|----------|
| Break modal | Radix Dialog: `role="dialog"`, `aria-modal`, focus trapped, title = `Dialog.Title`, sub = `Dialog.Description`. Initial focus: the textarea (`onOpenAutoFocus`). Close restores focus to the opener; since "Start break" turns into the running controls, `onCloseAutoFocus` focuses the timer's primary play/pause button, falling back to `main` (discretion). Esc = Skip |
| Seg | Fieldset + legend ("Move {task} to", "How was the focus?", "{task} after this session", "Improve view"); native radios, arrow keys move; the legend is sr-only |
| Tick rows | Native checkbox labelled by task text; "not done" is in the label for screen readers |
| Countdown | Plain text, not a live region; the timer's existing `role="timer"` stays the time source |
| Summary | Region `aria-labelledby` the headline; headline is an `h1` while the summary shows (the digits' heading role moves to it); on entry focus moves to the headline (`tabIndex={-1}`). Block rows are a list; Edit buttons named "Edit log for block {n}" |
| Live region | Polite: "Log saved for block 2", "{task} moved to Block 3", "{task} set for later", "{task} will come back next session", "{task} dropped", "Copied as Markdown" (also toast) |
| `/log` | `h1` "Log"; improve panel is a `section` labelled "What to improve"; day groups are `h2` + list; rows are buttons with `aria-current`; desktop selection moves focus to nothing (detail updates in place, announced politely "Showing session ended 10:44"); phone detail moves focus to its title and back returns it to the row |
| Charts | Bars and calendar carry sr-only text (section 6); evidence rows are `role="img"` with labels; no information by color alone (planned vs focused also differ by outline vs fill, overtime bars also differ by height) |
| Export | Radix DropdownMenu semantics, arrow keys, Esc returns focus to the trigger |
| Switch | `role="switch"` + `aria-checked`, label is the visible text |
| Targets | >= 44x44 on touch for every control including seg xs (hit-area expansion) and the X / Edit icon buttons |
| Contrast | Foreground and muted on `--panel-surface` and `--bg-solid` pass 4.5:1; `#101010` on the foreground seg fill passes; `--overtime` `hsl(38 92% 62%)` on the chip surface passes 4.5:1 for 13px text; `--accent-ink` rules from Phase 9 |
| Reduced motion | See Motion; no information depends on animation |

---

## Copywriting Contract

Separators " · ", clock ranges with a plain hyphen "09:35 - 10:00", counts "3 / 4" (as Phase 9).

| Element | Copy |
|---------|------|
| Modal title / sub | "What got done in block 2?" / "Review PR · Reply to Alex · 09:35 - 10:00" (+ " · skipped") |
| Modal placeholder | "A line or two is enough" |
| Modal sections | "Tasks in this block", "How was the focus?" |
| Modal row meta / carry | "not done" / "Move to" + "Block 3", "Block 4", "Later" |
| Rating | "Scattered", "Okay", "Deep" |
| Modal foot | "Break 04:12 left" ("04:12 left" under 640px; "Break over" at 0), "Skip", "Save"; X aria "Skip log" |
| Edit form foot | "Cancel", "Save" |
| Summary eyebrow / headline | "Session done · Tue 21 Oct · 09:00 - 10:44" / "1h 32m focused" (phone "1h 32m" + "focused · 09:00 - 10:44") |
| Strip label / mode word | "4 / 4  Session done · 1h 32m focused" / "Done" |
| Stat chips | "3 / 4 blocks", "1 skipped", "+5 min added" (phone "+5 min"), "3 / 5 tasks", "1 break cut short" |
| Summary sections | "Done", "Not done", "Later", "Blocks and logs", "Next time" |
| Block rows | "1 · Write notes", chips "+5 min", "skipped", "Deep"; "+ Add a log"; "Break · 5 min", "Break · 2 of 5 min · cut short", "Break · skipped" |
| Next time placeholder | "One thing to try next session" |
| Done list | Add row "Add something you did"; fates "Next session", "Later", "Drop"; past tags "next session", "later", "dropped"; relative dates "today", "yesterday", "since Mon", "since 14 Oct"; overflow "+3 more in Tasks" |
| Primary CTA | "Start new session" (desktop), "New session" (phone bar), "Save" (modal) |
| Summary secondary | "Export", "Open log" |
| Tasks Later group | Label "Later"; row action "Bring back" |
| `/log` | Back "Timer" (phone aria "Back to timer", detail aria "Back to log"); title "Log"; rows "Ended 10:44" / "Stopped 10:44", "1h 32m · 3 / 5 tasks"; days "Today", "Yesterday", "Mon 20 Oct"; "Show older" |
| `/log` empty | Heading "No sessions yet"; body "Finish a focus session and it shows up here with what you got done."; CTA "Start a session" |
| Guest | Top "Saved in this browser · Sign in"; footnote "Saved in this browser. Sign in to keep your log on every device." |
| Improve | "What to improve" + "last 14 days"; "Insights", "Charts", "Both"; observation templates (section 6); "Nothing stands out in the last 14 days." |
| Charts | "Planned (outline) vs focused (fill), added time hatched"; "5 weeks"; "M T W T F S S" |
| Improve empty | "Finish 3 sessions to see what to improve." + "1 of 3 so far" |
| Export menu | "Copy as text", "Copy as Markdown", "Download .md", "Download .txt", "Share" |
| Toasts | "Copied as text", "Copied as Markdown", "Couldn't copy. Your browser blocked clipboard access." |
| Customize | Group "Break log", value "On" / "Off"; switch "Ask what got done at each break"; helper "The summary at the end of a session always shows." |
| Footer | Tooltip and aria "Log" |
| Error state | "Couldn't load your log." + "Try again"; "Couldn't save your log for block 2. Check your connection and try again." + "Try again"; "Couldn't save that change. Check your connection and try again."; "This browser isn't saving your log. Private browsing can block storage." |
| Destructive confirmation | None. Drop archives and is reversible from Archived in Tasks (and by picking another fate while the summary is open). Skip discards only the unsaved modal form. No log or session delete in this phase |

---

## Component Inventory (for the planner)

Rebuilt: `SessionCompleteModal.tsx` -> `SessionSummary` (stage view; also renders past sessions
read-only for `/log`). Reused, not duplicated: the `session-card.module.css` shell, `AddRow`,
`Skeleton`, `MiniStrip` cell styles and `stripWidths`, `ControlGroup`, `MenuButton`, sonner,
`@repo/ui/dropdown-menu`. New (names are suggestions; keep the file count small): `BreakLogModal`
+ `LogForm` (shared by modal and inline edit), `Seg`, `DoneList`, `ExportMenu` with pure
`toMarkdown` / `toText` formatters (one `bun run` assert check against the `#mdtext` sample),
`LogPage` (route + list + detail switch), `HistoryRow`, `ImprovePanel` (Insights, Charts,
Calendar) with pure rule functions (one `bun run` assert check), `LogButton`, one CSS module for
summary + `/log`. Edited: `Timer.tsx` (Start break hook, digits swap), `SessionTitleDisplay`
("Done"), `ProgressSlot.tsx` (finished label), `tasks/ListTab.tsx` + `tasks.module.css` (Later
group), `StyleSection.tsx`, `customize/sections/index.ts`, catalog / look types (`askAtBreak`),
`MenuSettings.tsx`, `MenuSettingsMobile.tsx`, `middleware.ts`, `useTimerKeyboard.ts`, `app/(app)/page.tsx`,
`app/guest/page.tsx`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (already vendored in `packages/ui`) | dialog, dropdown-menu, tooltip, sonner, button | not required |
| Third-party | none | not applicable |

Dependency contract: no new package. Not added: chart libraries (recharts, visx, chart.js,
nivo), calendar heatmap libraries, date libraries (use `Intl.DateTimeFormat`), markdown libraries
(the export is a string template), file-saver (use a Blob + `a[download]`). Confetti uses the
installed `canvas-confetti`; motion uses the installed framer-motion.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
