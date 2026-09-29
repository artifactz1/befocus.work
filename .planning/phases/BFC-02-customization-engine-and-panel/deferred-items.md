# Deferred Items - Phase BFC-02

Out-of-scope issues found during execution, not fixed per scope boundary rules.

## 02-08: `bun run check-deps` still broken (pre-existing, re-confirmed)

- **Issue:** `check-dependency-version-consistency: command not found` (exit 127).
- **Found during:** 02-08 Task 1 integrated gate sweep.
- **Origin:** Documented in STATE.md since Phase 1 (FND-04 blockers section); not related to Phase 2.
- **Action:** Not fixed - explicitly called out as known pre-existing breakage in 02-08-PLAN.md's
  `<interfaces>` section, "report it and do not count it against this phase."

## Resolved during 02-08 (moved out of deferred, no longer applicable)

The following were originally logged here as out-of-scope, then the orchestrator explicitly asked
for them to be fixed on this branch instead of deferred. See 02-08-SUMMARY.md for the fix commits.

- Stray debug `console.log('CHECKK', ...)` in `SessionCompleteModal.tsx` - removed.
- Ambiguous Tailwind arbitrary-value classes (`duration-[450ms]`, `ease-[cubic-bezier(...)]`) in
  `Timer.tsx` - moved into `timer-progress.module.css`.
- Em dashes in `apps/next/src/app/(auth)/sign-in/page.tsx` - replaced with plain dashes.
