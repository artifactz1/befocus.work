---
phase: BFC-10-session-logs-and-reflection
plan: 02
subsystem: preferences, routing, keyboard
tags: [look, customize, middleware, keyboard-guard]
requires: []
provides:
  - askAtBreak look key (default true) on lookSchema, DEFAULT_LOOK, lookEquals
  - BreakLogSection in Customize after Session progress
  - /log open to guests and signed-in users with server-set x-befocus-mode header
  - Timer keyboard guard for data-break-log, data-session-summary, data-log-page
affects: [10-08, 10-12]
key-files:
  modified:
    - packages/types/look.ts
    - apps/next/src/lib/customize/customize.check.ts
    - apps/next/src/components/customize/sections/StyleSection.tsx
    - apps/next/src/components/customize/sections/index.ts
    - apps/next/src/middleware.ts
    - apps/next/src/hooks/useTimerKeyboard.ts
decisions:
  - askAtBreak rides the Look persistence (no settings migration)
  - Switch styles imported from settings/session-card.module.css (Customize panel already defines --panel-muted)
metrics:
  tasks: 2
  files: 6
  completed: 2026-10-21
---

# Phase 10 Plan 02: askAtBreak, /log routing, keyboard guard Summary

The Break log preference, an open /log route for both modes, and the keyboard guard for the three new surfaces.

## Commits

- 75650b6 feat(BFC-10-02): askAtBreak look key and Break log switch in Customize
- f0d7ad1 feat(BFC-10-02): open /log to guests and signed-in users, guard new surfaces

## Verification

- `bun run src/lib/customize/customize.check.ts` (apps/next): `customize.check OK` (four new asserts)
- `tsc --noEmit` for apps/next and packages/api: no errors
- `biome check` on all six touched files: clean
- Repo-wide `bun run check` fails on one format issue in `packages/api/src/db/tables/plans.ts`, owned by plan 10-01 (concurrent executor). Not touched here.

## Deviations from Plan

- Middleware: the `isLogRoute` branch sits right after the session fetch and before the existing branches, as specified. No deviation. The authRoutes, passwordRoutes, redirect branches and matcher are unchanged.
- None other. Plan executed as written.

## Pending human checks (need dev server)

- Signed out: GET /log does not redirect (404 until 10-12 adds the page); GET / and /settings still redirect to /guest.
- Signed in: /log not redirected to /.
- Customize shows Break log after Session progress; toggle plus Apply survives reload in both modes.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (T-10-05, T-10-06, T-10-07 mitigated as designed).

## Self-Check: PASSED
