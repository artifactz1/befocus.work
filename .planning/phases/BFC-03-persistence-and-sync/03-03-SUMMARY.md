---
phase: 03-persistence-and-sync
plan: 03
subsystem: api
tags: [hono, drizzle, themes]
provides:
  - "PUT /user/themes/active (upsert settings, update or create the one active theme, owner-scoped)"
  - "GET /user/settings returns look (null when none or unparseable) via left join"
  - "createUserSettings is race-safe (onConflictDoNothing on user id)"
  - "SettingsWithLook type in tables/settings.ts"
---

# Plan 03-03 Summary

Task 1 done. `db.batch` is available on the neon-http driver (typechecks), so the insert-theme and
point-settings pair runs as one batch. Lost-race path deletes the orphan theme and retries once.
`bunx tsc --noEmit` in packages/api, `bun run check` and `bun run turbo:build` pass.

## Round trip

NOT RUN. Task 2 needs a live migrated database and the brief forbids using any real or remote
database or applying migrations. Pending human check (rows a-h from the plan: 404 before save,
200 first save, GET returns look, same themeId on second save, 422 on bad look, 401 without
session, one theme after five parallel saves, same for a brand-new account).

## Deploy order

Migrations 0010 and 0011 first, then the API, then the web (03-04).
