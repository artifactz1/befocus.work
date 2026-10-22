# Phase 10: Session Logs and Reflection - Context

**Gathered:** 2026-10-21
**Status:** Ready for planning
**Source:** Captain picks from the Phase 10 design board (Lavish, session `2ccea6caf2eff135`,
board source `.lavish/phase10/board.html` in worktree 4, untracked), two review rounds: the round 1
pick plus two notes (break carry-over, "both or either" for Q4), then the round 2 confirmation
"4D looks good". Plus the ROADMAP.md Phase 10 entry and LOG-01..08 in REQUIREMENTS.md. The discuss
step is covered by these picks.

<domain>
## Phase Boundary

Each break becomes a moment to note what got done, and the recorded blocks, tasks and notes turn
into a real end-of-session summary, a browsable history and a "what to improve" view. Toward the
end of a session and at breaks the user reflects and jots down what was done; when all blocks are
finished they get a summary of what was done, what was not, and what might be done later, which
they can copy, download or share. Requirements LOG-01..08.

Phase 10 builds on Phase 8 (focus blocks, block records, added time) and Phase 9 (tasks card,
plan, task block links, progress slot, now line). Both are built on `fm/befocus-phase9-build`
(not yet merged to master, migrations 0012-0014 not yet applied anywhere). The seams below are the
real shipped code, not assumptions.

Vocabulary: the timer calls each focus block a "session" (`currentSession` / `sessions`). In this
phase "block" means one focus or break block and "session" means one run of all blocks, matching
Phases 8 and 9. The captain's "session one / two / three" in the board notes means blocks.

Out of scope: Notion export (issue #100), AI-generated insights (Q7), guest-to-account migration
of logs or history (Q9), a full-day calendar, multi-session export from history (board 6C),
changing Phase 8 or Phase 9 behaviour beyond the seams this phase extends.
</domain>

<decisions>
## Implementation Decisions (locked)

### Q1 = 1C: the break log is a modal over the timer
- When a focus block ends and the break begins, a centered modal card with a scrim opens over the
  timer. The break countdown keeps running and is shown inside the card ("Break 04:12 left").
- Skip closes it; the break runs either way (LOG-01). Esc and the close button act as Skip.
  Closing never pauses or alters the timer.
- The captain accepted the board's stated cost (the modal hides the timer, against TSK-05's
  "never obstruct the timer"). The modal is the one deliberate exception, only during a break,
  only until saved or skipped.
- Same card on desktop and phone (phone: 358px wide card). Built in the restart-confirm card
  style (#122).
- The same form edits a saved log later from the summary and from history (LOG-02).

### Q1 contents = 1-R: text + task ticks + focus rating + move-to (round 1)
- A free-text field: "What got done in block N?" with the block's tasks and clock range under the
  title.
- "Tasks in this block": the block's planned / worked tasks from Phase 9 task links, each with a
  tick. Ticking writes the same Phase 9 `completed` link (no second completion path).
- **Break carry-over (captain's round 1 note):** each unticked task in the block gets a
  "Move to" segmented control listing the remaining focus blocks of this session (for example
  Block 3 · Block 4) plus **Later**. The next focus block is preselected. Moving re-plans the task
  in the live Phase 9 plan (same `planTask` path the Plan tab uses); Later sets the task's later
  flag (Q5) and unplans it. If no focus blocks remain, only Later is offered.
- "How was the focus?": optional 3-step rating Scattered / Okay / Deep. Feeds "what to improve".
- Footer: break time left, Skip, Save.

### Q2 = 2A: the summary takes over the timer area; 2-1 one short confetti burst
- When the last block finishes (today's `currentSession > sessions` / `isFinished` moment), the
  timer digits give way to the session summary in the same stage. `SessionCompleteModal.tsx` is
  rebuilt into this view and its canned copy removed; no second end-of-session surface.
- Order: headline focus time and date range, stat chips (blocks finished / total, skipped, time
  added, tasks done / total, breaks cut short), then the done / not done / later list (Q5) on the
  left and blocks with their logs on the right (desktop); phone stacks and scrolls with a pinned
  action bar.
- Block rows show clock range, task names, added time, skipped, the rating and the log text, each
  log editable in place.
- A "Next time" free-text note sits under the blocks (Q7).
- Actions: Export menu (Q6) and Start new session.
- Confetti: one short burst as the summary opens (`canvas-confetti`, already installed), skipped
  under reduced motion. The 5-second fireworks are removed.
- The Phase 9 strip stays at the top showing all blocks done; footer unchanged.
- The same summary view renders a past session from history (Q3).

### Q3 = 3A: history is a new Log page
- New route `/log`: sessions grouped by day on the left (each row: end time, focus time, tasks
  done / total, a mini strip, first log line), the selected session's summary on the right
  (desktop). Phone: the list, a row opens the summary.
- "What to improve" (Q4) sits at the top of the list column.
- Reached from a footer / header entry next to the Tasks button and from the summary.
- **Guests (Q9):** `/log` is auth-gated today by `middleware.ts`. It is added to the routes both
  guests and signed-in users may open; the page reads browser history for guests and the server
  for signed-in users. Guests are not redirected away from it.

### Q4 = 4D: "what to improve" with an Insights · Charts · Both switch (round 2)
- A panel with a segmented switch **Insights · Charts · Both**, remembered per device.
  - Insights (board 4C): up to three plain-language observations, each with a tiny evidence chart
    (a row of 6-10 CSS bars from the sessions it came from).
  - Charts (board 4B): planned vs actual per session (outline = planned, fill = focused, added
    time hatched) and a 5-week calendar.
  - Both: the observations plus the planned vs actual bars; the calendar lives in Charts only.
- Window: last 14 days. Hidden behind an empty state until there are 3+ finished sessions.
- No chart library: CSS bars and grids, reusing the strip's cell styles.

### Q5 = 5A: the done / not done / later list is prefilled
- Done = tasks completed during this session (Phase 9 links). "Add something you did" adds a
  free-text done item that was never a task.
- Not done = tasks planned or worked in this session and still open, each with **Next session ·
  Later · Drop**. Defaults: Next session for a task worked in the last block, Later otherwise
  (board default).
  - Next session: the task is planned into block 1 of the next session's plan.
  - Later: the task stays open with a new **later** flag and shows in a Later group of the Tasks
    List tab.
  - Drop: the task is archived (existing `archived` field).
- Later = tasks carrying the later flag (from breaks or earlier sessions), with when they were
  set aside.
- Carry-over also happens at every break (Q1); the end list handles whatever is still open then
  (LOG-07).

### Q6 = 6B: one Export menu
- One "Export" button opens a menu: Copy as text, Copy as Markdown, Download .md, Download .txt,
  and Share (only where `navigator.share` exists). Copy confirms with a toast (sonner).
- Exported Markdown follows the board sample (`#mdtext`): title with date and range, focus line,
  Done / Not done / Later lists, Blocks with logs and ratings, Next time note. Plain text is the
  same content without Markdown syntax.
- Notion is issue #100, not this phase.

### Product question Q7: computed rules plus the user's own "Next time" note, no AI
- "What to improve" comes from a pure rules function over block records, task links and logs
  (time added, blocks skipped, breaks cut short, tasks left open, focus rating after cut breaks).
  Each rule returns a sentence and its evidence series. No external service.
- The user's own "Next time" note on the summary is stored with the session and shown in history.

### Product question Q8: prompt at every break and at session end; break prompt can be turned off
- The break log modal opens at every break by default. A preference "Ask what got done at each
  break" (on by default) turns the break prompt off; the end-of-session summary always shows.
- The preference lives in Customize next to the Phase 9 "Session progress" control, persisted the
  same way (server settings for signed-in, browser for guests).

### Product question Q9: guest logs and history stay in the browser, no migration
- Guest logs, the later flag, the "Next time" note and the history view read and write browser
  storage through the existing `lib/storage/browser-storage.ts` helpers, alongside Phase 8's
  `befocus.blockRecords` (500 cap). A guest's logs survive a refresh (LOG-06).
- Nothing moves into the account on sign-up in Phase 10.

### Technical constraints
- New tables in `packages/api/src/db/tables/`, re-exported from `db/schemas.ts`, drizzle-zod
  schemas colocated; route trios (`*.route.ts` / `*.handler.ts` / `*.index.ts`) wired into
  `src/app.ts` so they appear on the typed `hono/client`. Every route auth-gated by `requireAuth`
  and owner-scoped by `userId`. Next migration number is 0015; migrations are written, never
  applied in this phase (no DB commands).
- History needs a read path for block records: there is no `GET /user/blocks` today.
- Logs attach to Phase 8 block ids (`focus_blocks.id`, client-generated UUIDs).
- No chart or date library; CSS for bars and calendar, `Intl` for dates.
- `framer-motion` with `useReducedMotion`; keyboard and screen reader paths for every control;
  the modal traps focus and restores it.
- Biome style. No test runner: verification is `bun run check`, a type check, `*.check.ts`
  scripts run with `bun run` for pure functions (rules, export formatting, carry-over), and a
  running dev server.

### Claude's Discretion
- Whether a log is its own table or columns on `focus_blocks`; where the per-session "Next time"
  note and free-text done items live (a session row, a log on the last block, or a small table).
- Exact rule set and thresholds for observations, as long as each rule carries its evidence.
- Component split for summary / history / log form, store shape, and how the Log page shares the
  summary component with the dashboard.
- How "Next session" is held until the next plan exists (a pending carry list seeded into
  block 1 when the next plan is created).
- The Log page entry point placement, within the footer / header patterns already in the app.
</decisions>

<dependencies>
## Dependencies and Seams (shipped code)

| Seam | What exists | Phase 10 use |
| --- | --- | --- |
| Block record | `BlockRecord` in `packages/types/blocks.ts` (id, sessionId, kind, index, plannedSeconds, actualSeconds, addedSeconds, startedAt, endedAt, outcome); `focus_blocks` table (0012); `PUT /user/blocks`; guest `befocus.blockRecords` via `lib/blocks/block-records.ts` (500 cap). No GET. | Logs attach by block id; summary and history read records; add a GET for signed-in history. |
| Session id | Records carry `sessionId` (uuid) known before the first block. | Groups history and the "Next time" note. |
| Plan and links | `task_plans` (jsonb blocks, `wentLive`) and `task_block_links` (blockId, taskId, planned, worked, completed, timestamps); `GET/PUT/DELETE /user/plan`, `PUT/GET /user/task-links`; `lib/plan/plan.ts` (`planTask`, `buildSessionView`, `followTimerBlocks`), `hooks/usePlan.ts`. | Done / not done lists, break Move to (re-plan), evidence for rules. |
| Tasks | `tasks` table (serial id, text, completed, archived, createdAt); guest tasks in browser with client UUIDs (`lib/tasks/tasks-storage.ts`). No later flag. | Add `later` (plus when set) on server and guest; Drop uses `archived`. |
| End of session | `SessionCompleteModal.tsx`, rendered by `app/(app)/page.tsx` and `app/guest/page.tsx`; `isFinished` in `lib/session/session.ts`. | Rebuilt into the 2A summary. |
| Break start | Phase 8 explicit block end and `useEndedCues.ts`; timer store block list and current block id. | Trigger for the break log modal. |
| Preferences | Session progress preference (Phase 9) in Customize > Style; settings persistence (Phase 3) for signed-in, browser for guests. | "Ask what got done at each break" toggle. |
| Routing | `middleware.ts`: unauth users only reach `/guest`, `/sign-in`, `/sign-up`, password routes; signed-in users on `/guest` go to `/`. | Allow `/log` for both. |
</dependencies>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 10 section (goal, success criteria 1-7, planning notes)
- `.planning/REQUIREMENTS.md` - LOG-01..LOG-08
- `.lavish/phase10/board.html` (worktree 4, untracked) - mocks for every picked option at 1440 and
  390: 1C with Move to, 1-R, 2A, 3A, 4D, 5A, 6B, the exported Markdown sample, Q7-Q9
- `.planning/phases/BFC-08-focus-blocks-and-added-time/` and
  `.planning/phases/BFC-09-tasks-and-time-blocks/` - CONTEXT, UI-SPEC, PLANs, VERIFICATION
- `apps/next/src/components/SessionCompleteModal.tsx` (rebuilt)
- `apps/next/src/app/(app)/page.tsx`, `apps/next/src/app/guest/page.tsx`, `apps/next/src/middleware.ts`
- `apps/next/src/lib/blocks/`, `apps/next/src/lib/plan/`, `apps/next/src/lib/tasks/`,
  `apps/next/src/lib/storage/browser-storage.ts`, `apps/next/src/lib/session/session.ts`
- `apps/next/src/hooks/usePlan.ts`, `useTasks.ts`, `useEndedCues.ts`
- `apps/next/src/components/tasks/` (TasksCard, ListTab, PlanTab, NowLine), `components/progress/`
  (ProgressSlot, MiniStrip)
- `apps/next/src/components/customize/sections/StyleSection.tsx`
- `packages/api/src/db/tables/{focus-blocks,plans,tasks,settings}.ts`, `packages/api/src/routes/`
- `packages/types/blocks.ts`
</canonical_refs>

<specifics>
## Specific Ideas

- Break modal title "What got done in block N?"; sub line "<task> · <task> · 09:35 - 10:00".
- Move to control: "Move to" + "Block 3 · Block 4 · Later", next block preselected.
- Rating labels "Scattered / Okay / Deep".
- Summary headline "1h 32m focused"; eyebrow "Session done · Tue 21 Oct · 09:00 - 10:44".
- List headings "Done", "Not done", "Later"; row control "Next session · Later · Drop"; add row
  "Add something you did".
- Insights switch "Insights · Charts · Both"; panel heading "What to improve", "last 14 days".
- Export menu items "Copy as text", "Copy as Markdown", "Download .md", "Download .txt", "Share".
- Customize toggle "Ask what got done at each break".
</specifics>

<deferred>
## Deferred Ideas

- Notion export (#100), AI insights, guest-to-account migration of logs and history (SYN-04 path),
  multi-session export from history (board 6C), shareable per-session URLs, a full-day calendar.
</deferred>

---

*Phase: BFC-10-session-logs-and-reflection*
*Context gathered: 2026-10-21*
