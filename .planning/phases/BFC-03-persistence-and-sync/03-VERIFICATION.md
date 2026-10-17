---
phase: BFC-03
status: human_needed
---

# Phase 3 Verification

Code complete, guest paths verified locally. Everything signed-in needs a human with a real database.

## Pending human checks

1. **Duplicate check** before the unique index in 0011 (must return zero rows):
   `select user_id, count(*) from "sessionSettings" group by 1 having count(*) > 1;`
2. **Apply migrations 0010_ask_before_start and 0011_look_persistence** before the API deploy:
   `cd packages/api && bun run db:migrate`
3. **03-03 round trip**: PUT `/user/themes/active` 200, read back on GET `/user/settings`, 422 on a bad look, 401 without a cookie, concurrent PUTs leave one theme.
4. **Signed-in restore**: change look, Done, one PUT 200 and no toast. Reload `/`: same look. Escape and X each send one PUT after a change.
5. **Second device**: sign in as the same user in a fresh context. First frame wears the look, guest cache empty.
6. **Rapid Apply** on Slow 3G: five Done presses, at most two PUTs in flight in sequence, fifth background shows after reload.
7. **Save failed**: offline, change and Done gives one error toast with the exact copy and the look stays. Online again: PUT 200, no new toast.
8. **Sign-out leak**: soft sign-out lands on `/guest` with the guest look or default, not the account look.
9. **First-frame traces** (CPU 4x, Slow 3G) on `/guest` and signed-in `/`: no frame with the default background before the saved one. Signed-in `/` paint-script-before-`<main` hex check.
10. **Console** on signed-in `/` and `/sign-in` with the API running: no hydration mismatch.
11. Delete any throwaway account created.

## Verified locally

Biome, typecheck, `turbo:build`, four check scripts, guest restore, guest note at 1440 and 390, Sign in link, storage-blocked toast, no horizontal scroll at 390.
