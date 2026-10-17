# Phase 9: Tasks and Time Blocks - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning
**Source:** Captain picks from the Phase 9 design board (Lavish, session `a9edfcf633230a3a`,
board source `.lavish/phase9/board.html` in worktree 2, untracked; report at
`/Users/artifactz1/firstmate/data/befocus-phase9-plan/report.md`) plus the ROADMAP.md Phase 9
entry. The discuss step is covered by these picks.

<domain>
## Phase Boundary

Tasks stop being a separate popover and become the work inside the session. The user lays out a
plan for the blocks of the session they are about to run, ties tasks to focus blocks, picks what
they are on now, and while the session runs sees where they are in it. Requirements TSK-01..05.

Phase 9 builds after Phase 8 (focus blocks, explicit block end, added time, block records) and
Phase 3 (persistence, guest browser storage). Neither is planned or built yet. These plans name
the seams they assume (see "Dependencies and seams"); the Phase 8 and Phase 3 planners match them
or the Phase 9 plans are revised before execution.

Out of scope: Phase 8 and Phase 10 work, Session settings changes (separate task), a full-day
calendar, Notion integration (issue #100), guest-to-account migration of tasks, plans or records.
</domain>

<decisions>
## Implementation Decisions (locked)

### Q1 = 1A: where tasks live - a Tasks card in the Quiet Deck slot
- The footer notebook button stays and opens a **Tasks card** built on the record room's shell:
  the same 400px left card at 24px insets on desktop (>= 1024px), the same timer `scale(0.8)` rule
  while open, the same `vaul` bottom sheet under 1024px with the timer visible in the strip above
  it (record room sheet, PR #116, `records.module.css` `.room` / `.sheet`, `data-room`).
- One card open at a time: opening Tasks closes the record room and vice versa (same exclusivity
  rule the room already applies against the customize inspector).
- The card has two tabs, **List** and **Plan**. List is add, edit, tick, archive (today's
  `ToDoList.tsx` features). Plan is the time-block plan (Q2).
- Replaces the `ToDoList.tsx` popover and `ToDoListMobile.tsx`. `useTodoStore` / `useTasks.ts`
  are reused or reshaped, not duplicated.

### Q2 = 2B: form of the plan - a vertical day column inside the card
- The Plan tab renders the session as a calendar-style **vertical column**: one row per block,
  height proportional to its length, focus and break blocks visually distinct, each focus block
  naming its assigned tasks.
- Clock times are shown (for example "10:25 - 10:50"). They are **derived, never stored**:
  computed from the planned start (now, before the session starts) or the actual start of each
  block, plus planned length and added time. Adding time or pausing re-flows the times below; this
  answers the board's "times drift" cost.
- Block count and lengths come from Session settings (sessions, work and break minutes). In the
  plan the user can add or remove a focus block and nudge one block's length; that changes this
  plan only, never the settings.
- The same column is the **Session card** while a session runs (see Q4): done blocks above the
  current one, the current block with its progress and time left, blocks ahead below, added time
  marked on the block that got it, ticked tasks shown ticked. One surface, two states (planning,
  live), not two components.

### Q3 = 3B: assigning tasks - tap a block, tick tasks into it, drag as a desktop extra
- Blocks in the Plan tab are a **radio group**; selecting one makes the task list below a set of
  **checkboxes** that assign tasks to that block. Works with mouse, touch, keyboard and screen
  readers.
- Desktop extra: native HTML drag of a task onto a block assigns it, the same click-plus-drag
  pattern as the record shelf (`Shelf.tsx`). No drag-and-drop dependency.
- A task belongs to at most one planned block at a time; ticking it under another block moves it.
- **Now pick (TSK-02):** while a focus block runs, its first open assigned task is "now" by
  default; the one-line now control under the timer (see Q4) switches it in one tap to any open
  task. The pick and every completion during the block are written to that block's task links
  (worked / completed) so the block record afterwards lists tasks worked on and completed.

### Q4 = 4D: live progress view - switchable Strip / Now / Grid, Session card one tap away
- The top-left progress slot (where `SessionsUI.tsx`'s contribution grid sits today) shows one of
  three views of the same block data, chosen by a new **Session progress** preference:
  - **Strip** - one row of blocks, width proportional to length, done / now / ahead states, the
    current block filling with progress, added time as a hatched "+N" extension, task names
    inside focus blocks, tick dots for tasks, and a "3 / 6 Block 3 - 12:19 in - +5 min added"
    label row.
  - **Now** - only the current block: "3 / 6 - Block 3 - 12:41 left", one wide bar filling with
    progress, its task names and tick dots.
  - **Grid** - today's two-row contribution grid, kept as-is (CTL-11).
- Tapping the progress slot opens a small **switcher popover**: three thumbnail tiles (Strip,
  Now, Grid) and a last row "Open session card" that opens the Tasks card on the Plan tab in its
  live state (the 4C Session card). Picking a tile switches the view and closes the popover.
- The preference is also a **Customize > Style** control, "Session progress: Strip / Now / Grid",
  placed next to "Timer progress" in `StyleSection.tsx` using the existing `ControlGroup` and
  segmented control. Default: Strip.
- A one-line **now line** sits under the timer digits during a running focus block: "NOW <task>
  3/8 done"; tapping it opens the now pick (Q3).
- Idle fade (`useChromeIdle`, `.bf-chrome`, `data-chrome-idle`): the chosen progress view
  **dims to 35%** and the now line **to 55%**; they never fully vanish. Opening the switcher wakes
  the chrome; picking closes it.
- Not a third indicator: Edge / Ruler / Ink keep showing progress within the current block on
  the timer; the progress slot shows progress across the session, replacing the grid in the same
  place rather than stacking beside it.

### Q5 = 5D: phone - follows the same Session progress setting
- One setting drives desktop and phone. Under 640px, where `SessionsUI` and `Timer.tsx` already
  switch to their phone layouts (between 640px and 1023px the desktop views render, while List and
  Plan already use the sheet):
  - Strip: compact numbered strip under the logo with a "3 / 6" count (board 5A).
  - Grid: the two-row grid plus a "B3/6 - <task>" pill under the digits that opens the plan
    (board 5C).
  - Now: one wide bar for the current block under the logo.
- Whatever the view, List and Plan open in the record-room style bottom sheet below a 132px
  timer strip, so the plan and progress never obstruct the timer (TSK-05).

### Product question Q6: one session
- The plan covers the blocks of one session. One open plan at a time; finishing or resetting the
  session closes it. A full-day calendar, multiple sessions and clock-time scheduling are a later
  phase (and may touch #100).

### Product question Q9: guests keep everything in their browser, no migration yet
- Guest tasks, the plan, task links and the Session progress preference persist in the browser
  through Phase 3's guest-storage pattern (SYN-03), so a guest's tasks survive a refresh (TSK-01).
- Nothing moves into the account on sign-up in Phase 9; that follows the SYN-04 theme-migration
  path later.
- Guest task ids switch from `Date.now()` to client UUIDs so a later migration cannot collide
  with server ids. Signed-in users keep tasks, plans and links on the server.

### Technical constraints
- New tables go in `packages/api/src/db/tables/`, re-exported from `db/schemas.ts`, drizzle-zod
  schemas colocated; new route trios (`*.route.ts` / `*.handler.ts` / `*.index.ts`) are added to
  the `routes` array in `src/app.ts` so they appear on the typed `hono/client`. Every route is
  auth-gated by `requireAuth` and owner-scoped by `userId`.
- Task to block assignment is a **join table** (Phase 9 owned), not a column on the block record.
- No chart, calendar or drag-and-drop dependency: CSS for the strip, column and grid; native drag
  events with click as the accessible path. `framer-motion` with `useReducedMotion` for motion.
- Reduced motion honoured; keyboard and screen reader paths for every control.
- Biome style (single quotes, no semicolons, 100 col). No test runner is configured; verification
  is a running dev server, `bun run check`, a type check, and one-off `bun run` scripts where a
  pure function needs a check.

### Claude's Discretion
- Exact component split, store shape for the plan and links, whether the plan is its own table or
  a JSON column on a session row, how the plan seeds Phase 8's block list (within the seam below),
  the switcher popover's primitive, and the strip's overflow behaviour past about 12 blocks.
</decisions>

<dependencies>
## Dependencies and Seams (stated plainly)

Phase 9 cannot execute until Phase 8 and Phase 3 have shipped. The plans assume these seams. If
Phase 8 or Phase 3 lands a different shape, revise these plans before executing them.

| Seam | What Phase 9 assumes | Owner |
| --- | --- | --- |
| Block record | Each focus and break block has a stable id (client-generated UUID), `sessionId`, `kind` (`focus` / `break`), `index` in the session, planned length, actual length, added time, `startedAt` / `endedAt`, and `outcome` (`finished` / `skipped` / `reset`). Server table plus guest browser copy. | Phase 8 |
| Session id | Blocks belong to a session id that the timer store knows before the first block starts, so a plan can attach to it. | Phase 8 |
| Block list in the store | The timer store exposes the session's ordered block list and the current block id. Before the session starts that list can be seeded from a plan (ids, kinds, planned lengths, added or removed focus blocks); Phase 8's records then use the same ids, so a planned block and its record share one id. | Phase 8 (accepts), Phase 9 (seeds) |
| Explicit block end and added time | An ended state and an added-time value per block are in the store, so the strip and column can show "+N" and the now line knows when a focus block is live. | Phase 8 |
| Task links | A join of block id to task id with `planned`, `worked` and `completed` flags (plus timestamps), owner-scoped. Not a column on the block. | Phase 9 |
| Guest storage | Phase 3's browser-storage helper and hydration owner (FND-05 single owner), reused for guest tasks, plan, links and the Session progress preference. | Phase 3 |
| Preference persistence | Phase 3's settings persistence carries the Session progress preference for signed-in users; guests use the browser. | Phase 3 |

Assumed seam for the Phase 8 planner, in one line: *block ids are client-generated UUIDs that
exist before the block starts, the timer store accepts a pre-built ordered block list for the
session (from a Phase 9 plan or from Session settings), and records reuse those ids.*
</dependencies>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 9 section (goal, success criteria, planning notes), Phase 8 and
  Phase 3 sections for the seams
- `.planning/REQUIREMENTS.md` - TSK-01..TSK-05
- `.lavish/phase9/board.html` (worktree 2, untracked) - mocks for every picked option: 1A, 2B,
  3B, 4D, 4C, 5D, the Phase 8 seam table
- `/Users/artifactz1/firstmate/data/befocus-phase9-plan/report.md` - board report and final picks
- `apps/next/src/components/to-do-list/` - `ToDoList.tsx`, `ToDoListMobile.tsx` (replaced)
- `apps/next/src/store/useToDoStore.tsx`, `apps/next/src/hooks/useTasks.ts`,
  `apps/next/src/components/helper/PrefetchUserTasks.tsx`
- `apps/next/src/components/records/` - `RecordRoom.tsx`, `records.module.css`, `Shelf.tsx`
  (card and sheet shell, exclusivity, click-plus-drag)
- `apps/next/src/components/sessions/SessionsUI.tsx` - the grid (Grid view)
- `apps/next/src/components/timer/Timer.tsx`, `timer-progress.module.css` - Edge / Ruler / Ink,
  the `.under` slot for the now line
- `apps/next/src/hooks/useChromeIdle.ts` - idle fade
- `apps/next/src/components/customize/sections/StyleSection.tsx` - `Timer progress` control group
- `packages/api/src/db/tables/tasks.ts`, `packages/api/src/routes/` (user tasks routes)
</canonical_refs>

<specifics>
## Specific Ideas

- Switcher popover heading "Session progress"; tiles "Strip", "Now", "Grid"; last row "Open
  session card".
- Customize label "Session progress", options "Strip / Now / Grid", default Strip.
- Now line copy: "NOW <task name> <done>/<total> done".
- Phone Grid pill copy: "B3/6 <task name>".
</specifics>

<deferred>
## Deferred Ideas

- Full-day calendar and multi-session plans (Q6 later), Notion sync (#100), guest-to-account
  migration of tasks, plans and records (SYN-04 path), "planned vs actual" analysis (Phase 10).
</deferred>

---

*Phase: BFC-09-tasks-and-time-blocks*
*Context gathered: 2026-10-16*
