---
phase: BFC-08-focus-blocks-and-added-time
plan: 09
subsystem: timer
tags: [e2e, verification, layout-matrix, guest-records]
requires: [08-01, 08-02, 08-03, 08-04, 08-05, 08-06, 08-07, 08-08]
provides:
  - Browser evidence for BLK-01..05 on the guest path
  - Layout fixes found by the six-viewport matrix
affects: []
key-files:
  modified:
    - packages/ui/src/globals.css
    - apps/next/src/components/timer/Timer.tsx
    - apps/next/src/components/timer/timer-progress.module.css
key-decisions:
  - Human checkpoint (signed-in focus_blocks round trip, real-touch UAT) is not run here and is recorded as pending
  - Phase 7 record-room card overlap with the first digit at 1024 wide is a Phase 7 design trait, logged not fixed
requirements-completed: [BLK-01, BLK-02, BLK-03, BLK-05]
requirements-pending-human: [BLK-04 server half]
completed: 2026-10-21
---

# Phase BFC-08 Plan 09: E2E and Verification Summary

Real-browser run (chrome-devtools-axi) of the Phase 8 timer at six viewports in three states, plus the guest-side behaviour checks for BLK-01..05. Three layout defects and one open item were fixed. The signed-in database round trip and device UAT stay pending for a human.

## Commits

- 24211d5 fix(BFC-08-09): keep chrome awake while the adjust tray is open
- e172466 fix(BFC-08-09): clear footer and badge overlaps on short and phone viewports

## Layout matrix

Viewports: `1440x900`, `1280x720`, `1024x768`, `844x390`, `390x844`, `375x667`. Phone rows used `emulate --viewport "WxHx1,mobile,touch"`. States: running, paused, ended (ended with net +3 added time). Checked per cell: no overlap among digits, ended label, primary, badge, hints, tray, header and footer buttons; primary to footer gap at least 16px (12px phone); touch footer buttons at least 44px; tray inside viewport; no horizontal scroll.

| Viewport | running | paused | ended | Notes |
| --- | --- | --- | --- | --- |
| 1440x900 | pass | pass | pass | also idle, tray, under 1:00, tray with remove dimmed |
| 1280x720 | pass | pass | pass | tray checked |
| 1024x768 | pass | pass | pass | room open at 1024 keeps the ended group (UI-SPEC); card overlaps first digit (Phase 7 trait) |
| 844x390 | pass | pass | pass | after badge fix |
| 390x844 | pass | pass | pass | idle, tray, under 1:00, strip mode with room open |
| 375x667 | pass | pass | pass | after digit cap fix |

Strip mode (room open under 1024) checked at 1000x768 and 390x844.

Accepted observations: the tray floats over the digits and hints on phones (by design, it is transient); the Phase 7 room card overlaps the first digit at 1024 wide even when idle.

### Screenshots

Folder: `/private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-1-befocus-work/319a90b8-b7ed-40a0-bfba-385aead0cf6b/scratchpad/p08-pr/`

Desktop 1440x900: `p08-desk-1440x900-idle.png`, `-running.png`, `-paused.png`, `-ended.png`, `-added-time-badge.png`, `-tray.png`, `-tray-remove-dimmed.png`, `-under-1min.png`.
Phone 390x844: `p08-phone-390x844-idle.png`, `-running.png` (shows +3 badge), `-paused.png`, `-ended.png`, `-tray.png`, `-tray-remove-dimmed.png`, `-under-1min.png`, `-room-ended-strip.png`.
Other cells: `p08-desk-{1280x720,1024x768}-{running,paused,ended,tray}.png`, `p08-desk-1024x768-room-ended-strip.png`, `p08-desk-1000x768-room-ended-strip.png`, `p08-phone-{844x390,375x667}-{running,paused,ended,tray}.png`.

## Behaviour checks

Guest at 1440x900, real wall clock, `HTMLMediaElement.play` counted.

| Check | Req | Result |
| --- | --- | --- |
| Block at 00:00 waits 10 s+, label "Focus block done" and "Start break", title "Time's up - Be Focus", live region reads ended copy | BLK-01 | pass |
| No input for 65 s: 3 plays (ring plus two nudges). Key at +10 s: stays at 1 | BLK-01 | pass |
| Enter on focused primary starts the break; focus lands on `[data-slot="2"]`; title restored | BLK-01 | pass |
| Last block primary reads "Finish session" and opens the session complete modal | BLK-01 | pass |
| `+`, `=`, Shift+`+` each add a minute; `-` removes; refused at 1:00 total | BLK-02 | pass |
| `+` at 00:00 resumes the same block, live text "Added 1 minute. Block resumed." | BLK-02 | pass |
| 450 ms hold on +1 opens tray, release on +5 adds 5 (-3 to +2); badge and tray close | BLK-02 | pass |
| 1:00 block with the tab backgrounded 75 s: ended on return, endedAt-startedAt = 60.000 s, actualSeconds 60 | BLK-05 | pass |
| 20 s pause excluded: actualSeconds 60 with 80.6 s wall time | BLK-05 | pass |
| One record per started block with planned, added, actual, startedAt, endedAt, outcome | BLK-03 | pass |
| Outcomes finished, skipped (command menu "Next Session") and reset (R) all seen | BLK-03 | pass |
| Extended and revisited blocks keep one id; R, then skip, then back, then R kept the same id with actual 22, 118, 130 and first startedAt; skip from an ended block stays finished (actual 190) | BLK-03 | pass |
| Records persist across reload (`befocus.blockRecords`) | BLK-04 | pass (guest half) |
| Reload mid-block, running: reset record, actual 9 s; paused: reset record, actual 6 s | BLK-03/05 | pass |
| Console on /guest: no hydration warnings. One `ERR_CONNECTION_REFUSED` from the API not running locally | n/a | pass |

The ended-with-positive-net matrix cells used a skewed `Date.now` to reach the end, not the real clock.

Observation: after the final session the counter reads "3 / 2". `SessionsUI.tsx` is untouched by Phase 8; logged in 08-VERIFICATION.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Chrome idle fade hid the footer while the adjust tray was open**
- Found during: open item before Task 1
- Fix: idle-fade selector in `packages/ui/src/globals.css` now excludes `:has(.bf-chrome [role="menu"])`
- Commit: 24211d5

**2. [Rule 1 - Bug] 375x667 digits overlapped the footer in running, paused and idle; ended primary gap was 8px**
- Fix: phone digit size capped by container height (`100cqh` minus 52px, 124px when ended); ended stage `bottom: 84`; `.phoneRow` `bottom: 28px`
- Files: `Timer.tsx`, `timer-progress.module.css`
- Commit: e172466

**3. [Rule 1 - Bug] 844x390 badge overlapped the digit ink**
- Fix: `.badge` top is the min of the glyph-box offset and an ink-based offset
- Commit: e172466

## Pending human checks

1. Apply migration 0012 (`focus_blocks`) to the real database. Not done here.
2. Signed-in `focus_blocks` round trip: finish, skip and reset blocks, reload, confirm rows via PUT /user/blocks and the queue draining offline then online (BLK-04 server half).
3. Real-touch long-press on a phone or tablet: hold on +1, slide to a tray cell, release; first-run hint.
4. Reduced motion: confirm the badge, notch and ended group animations are off.
5. An ended block with positive net added time on the real clock (matrix used a skewed clock).

## Known Stubs

None.

## Self-Check: PASSED

Commits 24211d5 and e172466 exist; screenshots exist in the folder above.
