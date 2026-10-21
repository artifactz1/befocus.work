# Phase 8: Focus Blocks and Added Time - Context

**Gathered:** 2026-10-20
**Status:** Ready for planning
**Source:** Captain picks from the Phase 8 design board (Lavish, session `0bfa715440ca6b05`, board
source `.lavish/phase8/board.html` in worktree 1, untracked, two captain feedback rounds) plus the
ROADMAP.md Phase 8 entry. The discuss step is covered by these picks.

Captain's pick, verbatim: "1D -1/+1 in back/next slots while running (hold for 1/5/10),
back/next when paused, +1 and Start break at 00:00; 2D tap for 1 min, hold for 1/5/10 tray; 3A
extend the block; 4C ring, nudge twice, quiet. Q1 8 then 9 then 10, then 4-6; Q5 any running
block, add and remove, plus the ended state; Q9 browser only, no migration, last 500."

<domain>
## Phase Boundary

The end of a block becomes a real state the user controls. At 00:00 the timer stops in an ended
state, the alarm rings, and the user adds time or moves on; it never advances by itself. While a
block runs, the user can add or remove minutes from it. Every focus and break block writes one
record (planned, actual, net added, start, end, outcome): on the server for signed-in users, in
the browser for guests. Lengths come from the wall clock, not from tick counts. Requirements
BLK-01..05.

Phase 8 builds on Phase 3 (persistence, guest browser storage, shipped). Phase 9 (planned,
09-01..09-11) builds on the block list and block records this phase ships; the seam is in
"Dependencies and seams" below.

Out of scope: Phase 9 and Phase 10 work (task links, the plan, Session progress views, the log
and reflection), `SessionCompleteModal.tsx` changes, guest-to-account migration of records, any
other settings or Session card redesign.
</domain>

<decisions>
## Implementation Decisions (locked)

### Q1 = 1D: where adjusting time lives - the footer back / next slots, Start break under the digits
- The footer transport keeps four buttons in every state, in the same slots and widths, so pause
  and reset never move. Only the outer pair swaps, as a mirrored pair:
  - **Running** (focus or break): back becomes **-1**, next becomes **+1**.
  - **Paused**: back and next return (today's `skipToPrevSession` / `skipToNextSession`).
    Skipping a running block therefore takes a pause first (or the keyboard).
  - **Ended (00:00)**: **+1** stays live; **-1** and **play** dim (disabled); reset stays live.
- **Start break** (or **Start focus** when a break ended) is the primary action and sits in the
  `.under` slot under the digits, with a small label above it ("Focus block done - 25 min") and
  keyboard hints below it on desktop. On phone, where there are no hints today, the layout follows
  board mock `q1d-end-p` (label above the digits, Start button under them); 08-UI-SPEC.md has the
  exact fit rules.
- The footer still fades on idle while running (hover or tap brings it back, as today); see Q4
  for the ended state.

### Q2 = 2D: how much one press moves - tap for 1 minute, hold for 1 / 5 / 10
- One tap on **+1** or **-1** moves the block by one minute. Presses stack.
- A **hold** (pointer down about 400 ms, cancelled on move-out or pointer cancel) opens a small
  tray above the held button: **+1 / +5 / +10** (or **-1 / -5 / -10**). Slide onto an amount and
  release, or tap an amount, to apply it. Escape or a tap outside closes the tray.
- Remove amounts at or above the time left are disabled in the tray and on the -1 tap (at 04:20,
  -5 and -10 are off; under 1:00 left, -1 is off), so removing never ends a block by accident.
- Keyboard: **+** (and `=`) adds 1 minute, **-** removes 1 minute, in the same running and ended
  rules as the buttons. At 00:00, **Enter** starts the break (or the next focus block).
- A first-run hint under the digits ("+ - 1 min, hold for more") teaches the hold; desktop shows
  it in the existing hints row, phone shows nothing extra.
- Tray surface uses the Quiet Deck panel tokens (`session-card.module.css`: surface
  `color-mix(in srgb, var(--bg-solid), #fff 5%)`, hair border, `0 24px 60px rgb(0 0 0 / 0.5)`
  shadow, 12px radius), the active amount filled with the foreground colour.

### Q3 = 3A: how adjusted time reads - extend the block
- The block's total becomes planned + net added. Edge, Ruler and Ink rescale to the new total; a
  **notch** marks the original planned end, the added part is **hatched**, and the fill steps
  back (animated, static under reduced motion) when time is added.
- Removing time shrinks the total the same way; the notch stays at the planned end, so a net
  negative block shows the notch past the end of the bar (or clamps it; planner decides).
- The digits get a small **"+5"** (or **"-3"**) badge showing the net adjustment for the block
  while it is non-zero.
- Same rule for all three progress styles. It matches Phase 9's planned strip ("+N hatched
  extension").

### Q4 = 4C: the ended state's look and sound - ring once, nudge twice, then quiet
- At 00:00 the alarm (the user's chosen sound and volume) rings once. If nothing happens it rings
  again at **30 s** and **60 s** after the end, then stops for good. The nudges are keyed off the
  wall-clock end time, not tick counts.
- Any input cancels the remaining nudges: a key, a tap, +1, Start break, reset.
- The idle chrome fade (`useChromeIdle`, `.bf-chrome`, `data-chrome-idle`) stops at 00:00: the
  chrome wakes and stays awake for the whole ended state.
- 00:00 **breathes** slowly (opacity pulse; static under reduced motion).
- The tab title reads **"Time's up · Be Focus"** while ended, and returns to normal after.

### Product question Q1: priority
- Run Phase 8, then 9, then 10, then 4-6. Recorded in STATE.md; no code effect here.

### Product question Q5: when time can be adjusted
- **While any block runs (focus or break), add or remove; at 00:00, add only.** This is a superset
  of BLK-02 (which only required adding to a just-ended focus block) and uses the same record
  field. Adding at 00:00 resumes the same block (ended -> running), it does not start a new one.
- Paused blocks cannot be adjusted (the slots are back and next while paused).

### Product question Q9: guest records stay in the browser, no migration
- Guest block records persist in the browser through Phase 3's helper
  (`apps/next/src/lib/storage/browser-storage.ts`, `readStored` / `writeStored` with a Zod schema),
  capped to the **last 500 records**, so they survive a refresh in the same browser (BLK-04).
- Nothing moves into the account on sign-up in Phase 8 (later SYN-04-style path).
- Guest record ids are client UUIDs, so a later migration cannot collide with server ids.

### Block lifecycle (explicit, from the ROADMAP notes)
- The timer store gets an explicit status: `idle` (before Start) -> `running` <-> `paused` ->
  `ended` (at 00:00) -> `idle` of the next block on Start break / Start focus, recording
  `finished`. Skip and reset from `running` or `paused` record `skipped` / `reset`. `ended` ->
  `running` on add time.
- 00:00 is a state change, not one more tick: the racy `decrementTime` advance in
  `useTimerStore.tsx` and the `timeLeft === 0` alarm effect in `Timer.tsx` are replaced by a
  single end transition owned by the store.
- The store anchors running time on the wall clock: an `endsAt` epoch-ms value while running,
  with `timeLeft` derived from it (worker ticks only trigger re-reads). Pause stores the remaining
  ms; resume sets a new `endsAt`. Adjusting time moves `endsAt` and the block's net added
  seconds. A background tab or a short sleep therefore lands on the correct remaining time, and
  an end that passed while hidden is detected on the next tick or on `visibilitychange`, with the
  record's `endedAt` set to the real end (BLK-05).
- `actualSeconds` is wall-clock running time (start to end minus paused time), not ticks.
- The last focus block of a session ends in the same ended state; moving on from it keeps today's
  path to `SessionCompleteModal` (its `currentSession > sessions` trigger), which is left alone.

### Technical constraints
- New table `focus_blocks` in `packages/api/src/db/tables/`, re-exported from `db/schemas.ts`,
  drizzle-zod schemas colocated; a new route trio (`*.route.ts` / `*.handler.ts` / `*.index.ts`)
  added to the `routes` array in `src/app.ts` so it appears on the typed `hono/client`. Auth-gated
  by `requireAuth`, owner-scoped by `userId`, writes idempotent on the client id (a retried
  write must not duplicate a record).
- Migration: generate the SQL with drizzle-kit and commit it. Do **not** run migrations, push or
  any DB command against a real database during planning or execution; applying the migration is
  a captain step at deploy time.
- The timer store stays per request through `TimerStoreProvider` (FND-05, single owner); block
  state and records live there and hydrate through that owner.
- Signed-in record writes happen at block transitions (end, skip, reset, finish), not every tick.
  A failed write must not lose the record (keep it queued locally and retry; planner decides the
  minimum that holds).
- `SessionCompleteModal.tsx` is not modified.
- Reduced motion honoured; keyboard and screen reader paths for every control (the tray is
  reachable without a hold: the + / - keys and a labelled control path).
- Biome style (single quotes, no semicolons, 100 col). No test runner is configured: verification
  is a running dev server, `bun run check`, a type check, and one-off `bun run` check scripts for
  pure logic (the `browser-storage.check.ts` pattern).

### Claude's Discretion
- Exact store shape beyond the seam below, the long-press hook's API, how the notch renders per
  progress style, the nudge timer's home (store vs a small hook), how a failed server write is
  retried, the route paths and whether records are written one at a time or batched.
</decisions>

<dependencies>
## Dependencies and Seams (stated plainly)

Phase 3 has shipped (guest storage helper, settings hydration). Phase 9 is planned on top of this
phase. The table compares what Phase 9 assumed (09-CONTEXT.md) with what Phase 8 ships.

| Seam | Phase 9 assumed | Phase 8 ships |
| --- | --- | --- |
| Block record | id (client UUID), `sessionId`, `kind` (`focus` / `break`), `index`, planned length, actual length, added time, `startedAt` / `endedAt`, `outcome` (`finished` / `skipped` / `reset`). Server table plus guest browser copy. | Same fields: `id`, `sessionId`, `kind`, `index`, `plannedSeconds`, `actualSeconds`, `addedSeconds`, `startedAt`, `endedAt` (epoch ms on the client, timestamps on the server), `outcome`. **Difference:** `addedSeconds` is the **signed net adjustment** (Q5 allows removing time), so it can be negative. Phase 9's "+N" strip label must handle a negative value ("-N" or hidden). |
| Session id | Known before the first block starts. | Same: the store creates `sessionId` (client UUID) when the session's block list is built, before Start. |
| Block list in the store | Ordered block list plus current block id, seedable from a plan before start; records reuse those ids. | Same: `blocks[]`, `currentBlockId`, and a `seedBlocks({ sessionId, blocks })` action that Phase 8 itself calls from Session settings; Phase 9 calls it from a plan. Seeding is allowed before start and for blocks not yet started. |
| Explicit block end and added time | Ended state and per-block added time in the store. | Same, plus additive differences: `status` is `idle` / `running` / `paused` / `ended` (Phase 9 listed running / paused / ended; `idle` is new), and `endsAt` is the wall-clock anchor. `timeLeft` stays, derived from `endsAt`. |
| Timer `.under` slot | 09-09 renders the now line there during a running focus block. | In 1D the slot holds only the ended label and Start break (ended state) and the existing hints. Adjusting time lives in the footer, so the running state leaves the slot to Phase 9's now line. |
| Footer back / next | Not addressed. | **Difference:** while running, back / next are -1 / +1; they are back / next only while paused. Any Phase 9 control that assumed next-block skipping mid-run must pause first. |
| Guest storage | Phase 3 helper, single hydration owner. | Same: `readStored` / `writeStored`, last 500 records. |
| `SessionCompleteModal` | Untouched. | Untouched. |
</dependencies>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and decisions
- `.planning/ROADMAP.md` - Phase 8 section (goal, success criteria, planning notes, design
  questions), Phase 9 section for the downstream consumer
- `.planning/REQUIREMENTS.md` - BLK-01..BLK-05
- `.lavish/phase8/board.html` (worktree 1, untracked) - mocks for every picked option (1D running,
  hold, hold at 04:20, paused, 00:00, 00:00 hold; phone running, hold, 00:00; 3A Ruler / Ink /
  Edge; 4C ended look), the lifecycle diagram and the seam table
- `.planning/phases/BFC-09-tasks-and-time-blocks/09-CONTEXT.md` - the seam Phase 9 assumed;
  `09-07-PLAN.md` and `09-09-PLAN.md` consume the block list and the `.under` slot

### Timer engine (replaced or reshaped)
- `apps/next/src/store/useTimerStore.tsx` - `decrementTime`, `skipToNextSession`,
  `skipToPrevSession`, `reset`, `resetAll`, `hydrateFromSettings`, `isAlarmOn`
- `apps/next/src/lib/timerWorker.ts` - 1000 ms `setInterval` tick worker
- `apps/next/src/components/timer/Timer.tsx` - worker wiring, the `timeLeft === 0` alarm effect,
  the `.under` slot, Edge / Ruler / Ink rendering
- `apps/next/src/components/timer/timer-progress.module.css` - progress styles
- `apps/next/src/components/timer/TimerButtons.tsx`, `TimeUI.tsx` - footer transport and digits
- `apps/next/src/hooks/useTimerKeyboard.ts` - keyboard map
- `apps/next/src/hooks/useChromeIdle.ts` - idle fade
- `apps/next/src/components/SessionCompleteModal.tsx` - left alone; its trigger must still fire

### Persistence
- `apps/next/src/lib/storage/browser-storage.ts` (+ `browser-storage.check.ts`) - guest storage
- `apps/next/src/lib/session/session.ts`, `apps/next/src/lib/customize/guest-look.ts` - Phase 3
  callers of the helper
- `apps/next/src/app/(app)/layout.tsx`, `DashboardShell`, `apps/next/src/lib/server/` - the
  server-fetched-then-hydrate path
- `packages/api/src/db/tables/`, `packages/api/src/db/schemas.ts`, `packages/api/src/app.ts`,
  `packages/api/src/routes/` (an existing route trio as the pattern)
- `apps/next/src/lib/api.client.ts` - typed client

### Look
- `apps/next/src/components/settings/session-card.module.css` - Quiet Deck panel tokens and the
  capsule button states reused by the tray and the dimmed buttons
- `packages/ui/src/globals.css` - tokens
</canonical_refs>

<specifics>
## Specific Ideas

- Ended label: "Focus block done · 25 min" / "Break done · 5 min".
- Primary buttons: "Start break" / "Start focus".
- Desktop ended hints: "+ add 1 min", "Enter start break".
- Running hints add: "+ - 1 min, hold for more".
- Footer button labels for screen readers: "Remove 1 minute", "Add 1 minute"; tray amounts
  "Add 5 minutes", and so on.
- Tab title while ended: "Time's up · Be Focus".
- Nudge schedule: ring at end, +30 s, +60 s.
</specifics>

<deferred>
## Deferred Ideas

- Guest-to-account migration of block records (SYN-04-style path), a records view or analysis
  (Phase 10), task links and plan seeding UI (Phase 9), custom add amounts (board 2C).
</deferred>

---

*Phase: BFC-08-focus-blocks-and-added-time*
*Context gathered: 2026-10-20*
