# Deferred items

## Found during 09-11

- RESOLVED: Settings dialog Start path (`applySettings run:true` -> `resetWith`) assigned new session and block ids, so `seed()` returned null and the plan stayed "planning". `usePlanSync` now adopts the timer's block ids and lengths by position via `followTimerBlocks` (plan.ts) and moves task links with them; checked in `plan.check.ts` and in guest mode in the browser (Start card, assigned task shows as Now).
