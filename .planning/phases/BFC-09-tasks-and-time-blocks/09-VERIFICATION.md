---
phase: BFC-09-tasks-and-time-blocks
status: human_needed
verified: 2026-10-21
---

# Phase 9 Verification

Status: **human_needed**. All 11 plans are built and committed. Typecheck (apps/next, packages/api), `bun run check` and all 11 `*.check.ts` scripts pass. There is no unit or e2e runner in this repo (see CLAUDE.md), so those gates are the check scripts plus guest-mode browser checks. Everything that needs the API, a database or a signed-in session could not run here: wrangler, `.dev.vars` and migrations were off limits for this build.

## Requirement coverage

| Req | Evidence | State |
|-----|----------|-------|
| TSK-01 guest tasks persist | 09-03, 09-04; guest browser run (add, tick, archive, reload) | Verified in guest mode |
| TSK-02 now pick and block record data | 09-09, 09-10; now line and popover checked in guest mode | Guest verified; signed-in link history pending |
| TSK-03 plan and assignment persist | 09-05, 09-06, 09-07; settings Start fix `0892a65` | Guest verified; signed-in pending |
| TSK-04 live progress view | 09-08; Strip, Now, Grid at 1440 and 390; Grid overflow fixed | Verified in guest mode |
| TSK-05 phone usable, never covers timer | 09-11; measured at 390x844 and 844x390; three layout defects fixed | Verified in guest mode |

## Human checks (needs a non-production database)

1. Confirm `DATABASE_URL` is NOT production. Apply `0013_task_plans.sql` and `0014_task_block_links.sql` (or `bun run db:push`). Both were hand-written with snapshots because `drizzle-kit generate` failed on an esbuild host/binary mismatch (0.19.12 vs 0.28.1); regenerate once the toolchain works and confirm no diff.
2. Plan API (`bun run api`, signed in): PUT seeded plan 200; GET returns the same blocks with `links: []`; PUT with a leading break 422; DELETE 204; GET then `plan: null`. A second user cannot read or delete the first user's plan.
3. Task links: `PUT /user/task-links` with another account's task id returns 404. After `DELETE /user/plan`, assigning a task to Block 1 fires PUT /user/plan (200) then PUT /user/task-links (200), no toast. Removing a planned block fires only PUT /user/plan and its tasks read `planned: false`; Undo re-plans with one links PUT.
4. Tasks: `POST /user/tasks` with whitespace text or 501 chars returns 422; deleting another user's task id returns 404. No client GET on load, list on first paint. Broken API shows "Couldn't load your tasks." and Try again repopulates. Forced failure on add, tick or archive rolls back with the "Couldn't save ..." toast.
5. Plan on first paint after reload (signed in). Seed-save: `DELETE /user/plan`, reload, exactly one PUT /user/plan with no user edit. Broken API shows "Couldn't save your plan..." with Try again.
6. Live session (signed in): assign tasks to Block 1 and 2, start. Plan tab shows "Block 1 - now", growing bar, Phase 8 added time as a hatched band, pause suffix, task counts. List-tab tick of an unplanned task during the live block creates a completed link in the current block; untick clears it; tick during a break fires no links PUT. Reset closes the plan (DELETE) and a fresh plan gets the new session id; old links stay. Reload mid-session closes the old plan.
7. Block record data: `GET /user/task-links?blockId=<current>` lists worked and completed tasks, still after skip to break and reset. A second account's cookie returns `{ tasks: [] }`; `blockId=abc` returns 422.
8. Session progress preference: a switcher pick alone persists across reload (signed in: `PUT /user/themes/active` in the network log).
9. Guest storage: set `befocus.tasks` to `{"version":1,"tasks":[{"id":"x"}]}` and `befocus.taskLinkHistory` to `garbage`, reload: no crash, empty or reset state.
10. Pixel review of items listed in the per-plan SUMMARYs (circle checkbox, tab track, assign panel 44px targets, drag-over state, now popover). At 390 the Now popover is capped to the available height and scrolls inside, so its last rows sit under the viewport edge until scrolled; confirm that feels right on a real phone.
11. Real touch and reduced motion on phone for the Now popover and Grid pill.
12. Records room regression (09-01): room open sets `data-room=open` and `data-deck=records`, Escape returns focus to the Records button, Customize and room exclude each other, phone timer drops to the 132px strip.

## Known limits

- `state.record-metric` rejected every call, so STATE.md has no Phase 9 performance rows. Harmless.
- Phase 8 files edited by explicit plan authorization (recorded as deviations in the SUMMARYs): `useSessionCard.ts`, `lib/blocks/blocks.ts` (export `isLive`), `ProgressSlot.tsx`, `progress.module.css`, `Timer.tsx`, `Header.tsx`, `SessionsUI.tsx`.
- Impeccable hook advisories (easing in `records.module.css`, `min-height` transition in `tasks.module.css`) were reviewed and judged false positives.
