# 03-06 Summary - Browser E2E

Full suite (`bun run check`, `bun run turbo:build`, four `*.check.ts` scripts) passes and `git status` is clean afterwards.

Constraint: no real or remote DB, no API account, so nothing signed-in could run. `bun run api` was not started (it needs `.dev.vars`, which was not read). Guest checks ran in `chrome-devtools-axi` against `bun run web` at 1440 and 390. Screenshots are in the PR on branch `pr-screenshots`.

| # | Check | Req | Result | Evidence |
|---|-------|-----|--------|----------|
| 1 | Guest restore | SYN-03, ENG-05 | PASS functional. Plum look applied, Done, hard reload: root style has `--bg-solid #1f1420` and `--user-accent #f0abfc`, Revert disabled. Throttled trace (CPU 4x, Slow 3G) NOT run: pending human | localStorage keys `befocus.themes`, `befocus.activeThemeId`, `befocus.lookPaint`; 03-04 HTML order: paint script byte 3592 before `<main` 20426 |
| 2 | Guest note | SYN-03 | PASS. 1440: note above Revert/Done, one line (spec allowed two). 390: last sheet row, no clip, `scrollWidth == innerWidth`. Sign in link lands on `/sign-in`, look kept in localStorage. Tab focus ring NOT checked | guest-panel-1440, guest-panel-390 |
| 3 | Storage blocked | SYN-03 | PASS. `setItem` throwing, Done with a change: exactly one toast with the spec copy | guest-storage-blocked-390 |
| 4 | Signed-in restore | SYN-01, ENG-05 | NOT RUN: pending human | - |
| 5 | Second device | SYN-02 | NOT RUN: pending human | - |
| 6 | Rapid Apply | SYN-05 | NOT RUN. Coalescing covered by `persistence.check.ts` (latest look sent last). Network check pending human | persistence.check |
| 7 | Save failed | SYN-01 | NOT RUN: pending human | - |
| 8 | Sign-out leak | SYN-02 | NOT RUN: pending human | - |
| 9 | Console | ENG-05 | `/guest`: no hydration or script warning. `/` and `/sign-in`: 500 from existing `middleware.ts` session fetch because the API is not running (`fetch failed`); not caused by this phase, so no page-level result for `/` | console output |
| 10 | Pixel pass | - | One finding: the round bolt at bottom-left of the 390 sheet is Next's dev-only indicator (`nextjs-portal`), not app UI. No app fixes needed | guest-panel-390 |

Requirements touched: ENG-05, SYN-01, SYN-02, SYN-03, SYN-05.

## UAT

Pending human (not interactive here). See 03-VERIFICATION.md for the list: signed-in restore, second device, rapid Apply, offline save-failed toast, sign-out leak, throttled first-frame traces. No throwaway accounts were created.
