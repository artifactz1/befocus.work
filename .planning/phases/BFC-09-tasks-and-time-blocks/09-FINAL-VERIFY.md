# Phase 8 + 9 Final Verify

Scope: PR #125 (Phase 8, focus blocks and added time) and PR #126 (Phase 9, tasks and time blocks, stacked on #125).
Branch verified: `fm/befocus-phase9-build` plus the fix commits below.
Date: 2026-10-21.

## Verdict

**MERGE-READY.** Everything that can run locally passes after 8 small fixes. The one open 09-11 item (open
popovers over the timer digits) was settled by a design call, below. What is left is the captain's: real-phone
touch and long-press, and the real database migrations.

## Decision

The first pass of this report was NOT-READY on one 09-11 must-have: "No popover, sheet or progress view ever
covers the timer digits at 390x844 or in landscape 844x390". The open progress switcher covers the minute
digits at 390x844, and in landscape 844x390 both the open switcher and the open Now pick cover the digits.
The switcher placement comes straight from 09-UI-SPEC (`side="bottom" align="start" sideOffset={8}` under
the slot), so the spec and the must-have contradicted each other.

Captain's design call (2026-10-22T00:51:14Z): option 1, relax the must-have. It now reads "No popover, sheet
or progress view covers the timer digits while closed at 390x844 or in landscape 844x390; an open popover may
overlay the digits while the user has it open." 09-11-PLAN and 09-11-SUMMARY are updated to match. No code
change to popover placement.

## Setup

- Throwaway local stack only: docker Postgres on 127.0.0.1:55432 (compose project `befocus-verify-89`), a
  neon http proxy on 127.0.0.1:54444, `wrangler dev --local` on :8787, `next dev` on :3000. Every DB command
  targeted 127.0.0.1. Migrations 0000-0014 applied to that database only.
- Synthetic users `alice` and `bob` (local email accounts) plus guest mode.
- `packages/api/src/db/index.ts` carried an uncommitted local-only `neonConfig.fetchEndpoint` patch to reach
  the proxy. It was reverted before the report commit and is not in any commit.
- Browser: chrome-devtools-axi at 1440x900, 390x844 (mobile, touch, DPR 3) and 844x390, a second bridge
  run with `--force-prefers-reduced-motion`.
- No `.env` / `.dev.vars` read, no deploy, wrangler never pointed at an account, nothing touched a
  non-local database.

## Fixes committed

| Commit | Phase | Fix |
|---|---|---|
| db25c11 | 9 | Hand-written 0013/0014 drizzle snapshots had string boolean defaults. With them fixed, `drizzle-kit generate` (run with the matching esbuild 0.19.12 binary) reports "No schema changes". |
| 5b9256b | 9 | Plan gutter clock times wrapped to two lines at 1440. `white-space: nowrap`. |
| dab9100 | 9 | Now pick was not announced when the Tasks card was closed (Announcer unmounted with the card). Announcer is now always mounted. |
| 20c56b9 | 9 | Archive offline fired two "Couldn't save" toasts (parallel writes). Toasts now share an id per message. |
| 36f1737 | 9 | Idle block title read "Focus" instead of "Be Focus" when the block length differed from the default; title now keys off run status. |
| fdad809 | 9 | Empty Tasks list: the deck heading focus (rAF) stole focus from the add input. Heading focus now skips when focus is already inside the card. |
| 7672780 | 9 | Now pick and switcher popovers still animated under reduced motion (`motion-reduce:animate-none` lost on specificity to `data-[state=open]:animate-in`). Now `motion-reduce:!animate-none`. |
| fd991b3 | 9 | Tasks and Records phone sheets slid in under reduced motion (vaul's own animation). `animation: none` in the reduced-motion block. The Records sheet gap predates Phase 9; 09-UI-SPEC assumed it was covered. |

## Automated gate

| Check | Result |
|---|---|
| `tsc` apps/next and packages/api | PASS |
| `bun run check` (Biome format, lint, imports) | PASS after the local db patch is reverted (the patch itself trips organize-imports, as expected) |
| All 13 `*.check.ts` scripts | PASS |
| `drizzle-kit generate` no diff | PASS after db25c11 |

## 08-VERIFICATION.md human checks

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Apply migration 0012 | PASS (local) / NOT RUN (real DB) | Applied to the throwaway DB. The real database is the captain's. |
| 2 | Signed-in round trip to `focus_blocks` (finish, skip, reset, offline then online) | PASS | Finish, skip, reset and close mid-block each wrote one row per block id; offline queue flushed on `online` with merge by id. |
| 3 | Real-touch long-press on a device | NOT RUN | Captain does it on a real phone. Synthetic taps also double-step the steppers in CDP touch emulation; tool artifact, not reproducible with a mouse or keys. |
| 4 | Reduced motion | PASS | Card, Plan tab, ended breathe static. Popovers and sheets fixed (7672780, fd991b3). |
| 5 | Ended block with positive net added time on the real clock | PASS | +3 min band, ended wait, Start break handoff. |

## 09-VERIFICATION.md human checks

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Non-production DB, apply 0013 + 0014, regenerate with no diff | PASS (local) | Snapshot fix db25c11. Real DB not touched. |
| 2 | Plan API: PUT 200, GET same blocks + `links: []`, leading break 422, DELETE 204, GET null, second user isolation | PASS | bob GET sees `plan: null`; bob DELETE leaves alice's plan. Anonymous GET 401. |
| 3 | Task links: foreign task 404, assign after DELETE fires plan PUT then links PUT, removing a planned block releases it, Undo re-plans | PASS | Foreign task id 404, no open plan 404. Signed in at 1440: Remove block fires one PUT /user/plan and the server link reads `planned: false`; Undo fires PUT /user/plan plus one PUT /user/task-links and the link is planned again. |
| 4 | Tasks: whitespace / 501 chars 422, foreign delete 404, no client GET on load, load failure + Try again, rollback toasts | PASS | One toast per failure after 20c56b9. |
| 5 | Plan on first paint, seed-save sends exactly one PUT, save failure + Try again | PASS | |
| 6 | Live session: Block 1 - now, bar, added-time band, pause suffix, counts, tick creates completed link, untick clears, tick during break no PUT, Reset closes plan, reload closes plan | PASS | Untick leaves a link row with all flags false (see audit notes). |
| 7 | Block record data: worked/completed after skip and reset, foreign cookie `[]`, `blockId=abc` 422 | PASS | |
| 8 | Progress preference persists (`PUT /user/themes/active`) | PASS | |
| 9 | Guest corrupt `befocus.tasks` / `befocus.taskLinkHistory` | PASS | No crash, empty state. |
| 10 | Pixel review of per-plan SUMMARY items, 390 Now popover capped and scrolls | PASS at 390 and 1440 | Gutter wrap fixed (5b9256b). Real-phone feel of the capped popover: NOT RUN (captain). |
| 11 | Real touch and reduced motion on phone for Now popover and Grid pill | Reduced motion PASS (after 7672780) / real touch NOT RUN | Grid pill opens the Tasks sheet on Plan at 390. Real touch needs a device. |
| 12 | Records room regression | PASS | `data-room`/`data-deck` set, Escape returns focus to Records, Customize and room exclusive, 132px strip at 390. |

## Phone and landscape (09-11)

| Check | Result | Measured (CSS px) |
|---|---|---|
| 390x844 plan gutter one line, sheet top 132, rows 44px | PASS | |
| 390x844 Now pick popover below the digits, height capped | PASS | |
| 390x844 switcher popover vs digits | PASS (revised must-have) | Digits x78-312, y256-593 (Grid, ended). Switcher 32,232 to 372,445 covers the minute row. Strip: switcher 32,166 to 372,379 vs digits y216-567. Now: 32,170 to 372,383 vs y218-569. Overlays only while open, allowed under the revised must-have. Closed, nothing covers the digits. |
| 844x390 Now pick popover | PASS (revised must-have) | `phone` query is width-only, so landscape gets `avoidCollisions` and flips above, over the digits (about x250-594, y150-290). About 33px free below the trigger, so no trigger-relative placement clears the digits. Overlays only while open, allowed. |
| 844x390 switcher popover | PASS (revised must-have) | x35-373, y117-329, over the left digits only while open, allowed. |
| 844x390 Tasks deck, 24px strip blocks, 32px Now bar | PASS | |
| Idle dim 0.35 / 0.55, open popover keeps chrome awake | PASS | |
| Empty Tasks list keeps add input focus | PASS after fdad809 | |

## Plan must-have audit (08-01 .. 08-09, 09-01 .. 09-11)

Every truth in every plan was walked against the code and the runs above. All met. Items worth naming:

- **09-11** digits truth: met under the revised wording ("covers the timer digits while closed ... an open
  popover may overlay the digits while the user has it open"), see Decision. Under the original "ever"
  wording it failed.
- **09-09 / 09-03** announcement and empty-state focus truths: were failing, fixed (dab9100, fdad809).
- **09-11** reduced-motion truths for popovers and sheets: were failing, fixed (7672780, fd991b3).

Notes, not gaps:

- Now pick rows are 40px on fine pointers and 44px under `(hover: none)`, matching the plan's coarse-pointer wording.
- Unticking a live-block task leaves a `task_block_links` row with all flags false instead of deleting it. Harmless for reads (they filter on worked or completed).
- `useTimerStore` queue send treats 400 as drop; the comment explains the route types omit it. Fine.
- "Couldn't save ..." copy now lives in `lib/tasks/task-writes.ts` rather than the component the plan named.
- `useDeckStore.toggleDeck` has no callers.

## Pre-existing, not Phase 8/9

- Phase 7 deck card overlaps the left timer digit at 1440 (visible in the 1440 screenshots).
- `.hints` opacity transition in `timer-progress.module.css` (from master 36f3fc8) and the Radix tooltip exit animation still run under reduced motion.
- Session counter shows "3 / 2" after the last session completes (`SessionsUI.tsx`, already listed in 08-VERIFICATION known issues).

## Not run, and what is needed

- Real-phone long-press and real touch: captain, on a device.
- Real database migrations 0012, 0013, 0014: captain, against a non-production database first.
- Email sign-in through the UI fails locally with "Buffer is not defined" in the Worker dev runtime; signed-in browser checks used a session cookie from the API sign-in instead. Worth a check on a real deploy preview.

## Screenshots

On `pr-screenshots` under `pr-fm-befocus-phase9-build/verify/`, linked in the PR #126 body: gutter fix (1440, 390),
empty-focus and idle title (1440, 390), switcher over digits at 390, Now pick and switcher over digits at 844x390 (open popovers, allowed under the revised must-have).
