---
phase: BFC-07-vinyl-sound-space
plan: 01
requirements: [VNL-01]
status: complete
---

# 07-01 Summary: sound delete fix (#101, #102)

PR body: Fixes #101, Fixes #102

## Root causes (reproduced in a real browser before any code change)

Local stack: postgres + local-neon-http-proxy in docker, wrangler dev :8787, next dev :3000.
Throwaway accounts `repro1@example.test` / `repro2@example.test`, local DB only.

| Scenario | Before | After |
|----------|--------|-------|
| A. saved sound, signed in | DELETE 200, toast "Sound deleted.", GET 200, but the sound stayed listed until a hard refresh (stale `userSounds` cache re-added by the add-only merge effect, H1) | Row vanishes at once, DELETE 200, still gone after hard refresh |
| B. starter "Smooth Jazz", signed in | DELETE /user/sounds/jazz 404, toast "Error deleting sound: Not Found" (starters are not rows and were flagged `isCustom: true`, H2) | No request, toast "Sound deleted.", still gone after refresh (hidden per browser) |
| C. guest at /guest, starter | DELETE 401, toast "Error deleting sound: Failed to delete sound", console 401s on load (GET /user/sounds, H3) | No request, starter removed, no /user/sounds request on load |
| D. DELETE fails (500 injected) | n/a | Sound reappears, toast "Couldn't delete Rollback Lofi. Try again." |
| E. other user's id via curl | n/a | HTTP 404, row survives (count 1) |
| F. guest network | GET /user/sounds 401 | no /user/sounds request |

H1, H2, H3 all confirmed. Screenshots (session scratchpad, not in repo): repro-A/B/C-before.png,
fix-A-after.png, fix-B-after.png, fix-AB-after-refresh.png, fix-C-guest.png, fix-D-rollback.png.

## Changes

- `apps/next/src/lib/sounds/sounds.ts`: `STARTER_SOUNDS` (now `isCustom: false`), `isStarterId`,
  pure `reconcileSounds`, `readHiddenStarters`, `hideStarter`.
- `sounds.check.ts`: runnable regression check (`cd apps/next && bun run src/lib/sounds/sounds.check.ts`).
  Written first, red (module missing), green after implementation. Asserts a deleted row is dropped.
- `useSoundsStore`: seeds from `STARTER_SOUNDS`, new `syncUserSounds`.
- `useSounds.ts`: `useDeleteUserSound` optimistic cache removal + rollback + starter branch;
  `useUserSounds` gated by session; `useSound` writes the new row into the cache.
- `GlobalSoundsPlayer`: effect is now `syncUserSounds(userSounds)`, no `sounds` dependency.
- API `deleteUserSound`: delete filters `id AND userId`, `.returning`, 404 on zero rows.

## Decision

Starters are built in, not DB rows, so removing one is remembered per browser in localStorage
(`befocus.hiddenStarters`). No schema change in this phase. Owner sign-off scheduled in 07-07.

## Verification

`sounds.check OK`, `tsc --noEmit` clean, `bun run check` clean. Full `next build` runs at phase end.
Throwaway sound rows deleted.
