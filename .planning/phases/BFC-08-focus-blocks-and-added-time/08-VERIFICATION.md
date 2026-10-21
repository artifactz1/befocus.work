---
phase: BFC-08-focus-blocks-and-added-time
verified: 2026-10-21
status: human_needed
---

# Phase 8 Verification

Goal: focus blocks end explicitly, time can be added, every block is recorded and survives refresh, and signed-in records reach the server.

## Requirement status

| Req | Code and guest evidence | Pending human |
| --- | --- | --- |
| BLK-01 | Ended wait, cues (3 plays unattended, 1 with input), Start break focus handoff, Finish session modal: verified in browser | none |
| BLK-02 | Keys, footer, hold tray, resume same block with live text: verified in browser | real-touch long-press |
| BLK-03 | One record per block, outcomes finished/skipped/reset, stable id across revisits, close mid-block gives reset: verified in browser | none |
| BLK-04 | Guest records persist across reload: verified. Server route and queue: covered by `blocks.check.ts` and `block-records.check.ts` | Migration 0012 not applied; signed-in round trip not run |
| BLK-05 | Backgrounded 75 s tab and 20 s pause both match the wall clock to under 1 s | none |

BLK-04 is complete in code. It is marked complete in REQUIREMENTS.md with the note that the server half waits on migration 0012 and a human check.

## Automated gate

- `bunx tsc --noEmit -p apps/next/tsconfig.json`: pass
- `bunx tsc --noEmit -p packages/api/tsconfig.json`: pass
- `bun run check`: pass
- `apps/next/src/lib/blocks/blocks.check.ts`, `block-records.check.ts`, `packages/api/src/routes/blocks/blocks.check.ts`: pass
- Browser matrix: six viewports by running, paused, ended: pass after two layout fixes

## Known issues, not fixed

- Phase 7 record-room card overlaps the first digit at 1024 wide, including when idle (Phase 7 design).
- Session counter shows "3 / 2" after the last session completes. `SessionsUI.tsx` is not changed by Phase 8.
- `ERR_CONNECTION_REFUSED` console error on /guest when the API is not running locally.

## Human verification required

1. Apply migration 0012 to the real database.
2. Signed-in round trip to `focus_blocks` (finish, skip, reset, offline then online).
3. Real-touch long-press on a device.
4. Reduced-motion check.
5. Ended block with positive net added time on the real clock.
