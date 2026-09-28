# Deferred Items - Phase BFC-02

Out-of-scope issues found during execution, not fixed per scope boundary rules.

## 02-08: Stray debug console.log

- **File:** apps/next/src/components/SessionCompleteModal.tsx:52
- **Issue:** `console.log('CHECKK', currentSession, sessions)` fires on every guest page load.
- **Found during:** 02-08 Task 2 Section D console check.
- **Origin:** Pre-existing since 2025-05-29 (commit f5e4bae4); only touched by the Biome 2
  reformat commit (a2a787f), not by Phase 2 work.
- **Action:** Not fixed - out of scope per executor scope-boundary rule. Recommend a follow-up
  cleanup task.

## 02-08: Ambiguous Tailwind arbitrary-value classes in Timer.tsx

- **File:** apps/next/src/components/timer/Timer.tsx:209
- **Issue:** `bun run --cwd apps/next build` warns that `duration-[450ms]` and
  `ease-[cubic-bezier(.2,.7,.2,1)]` are ambiguous (Tailwind content-vs-class heuristic), suggesting
  the `&lsqb;...&rsqb;` escape form.
- **Found during:** 02-08 Task 1 integrated build gate.
- **Origin:** Introduced in commit 1fd7e79 (Phase 02-07, D-20 timer transform), not touched by 02-08.
- **Action:** Not fixed - warning only (build still succeeds, `bun run check` and tsc stay clean),
  out of scope per executor scope-boundary rule.

## 02-08: `bun run check-deps` still broken (pre-existing, re-confirmed)

- **Issue:** `check-dependency-version-consistency: command not found` (exit 127).
- **Found during:** 02-08 Task 1 integrated gate sweep.
- **Origin:** Documented in STATE.md since Phase 1 (FND-04 blockers section); not related to Phase 2.
- **Action:** Not fixed - explicitly called out as known pre-existing breakage in 02-08-PLAN.md's
  `<interfaces>` section, "report it and do not count it against this phase."

## 02-08: Em dashes in sign-in/page.tsx (pre-existing, not Phase 2 content)

- **File:** apps/next/src/app/(auth)/sign-in/page.tsx (lines 88, 111, 141, 148)
- **Issue:** The consistency sweep's em-dash grep (`git diff --name-only master...`) flags this file.
- **Origin:** Copy is original page content, unrelated to Phase 2; the file only appears in the
  branch diff because two Biome 2 tooling commits (a2a787f formatting, 705ae59 lint fixes, both
  2026-09-25) reformatted it. Not written or touched meaningfully by this phase.
- **Action:** Not fixed - reported per the hard constraint to report, not rewrite, pre-existing em
  dashes outside this phase's actual content changes.
