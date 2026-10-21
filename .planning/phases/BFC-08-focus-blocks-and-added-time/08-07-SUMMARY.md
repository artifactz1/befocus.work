---
phase: BFC-08-focus-blocks-and-added-time
plan: 07
subsystem: api
tags: [drizzle, hono, focus-blocks, migration]
requires: [08-01]
provides: [focus_blocks table, PUT /user/blocks]
key-files:
  created:
    - packages/api/src/db/tables/focus-blocks.ts
    - packages/api/src/db/drizzle/0012_focus_blocks.sql
    - packages/api/src/db/drizzle/meta/0012_snapshot.json
    - packages/api/src/routes/blocks/blocks.route.ts
    - packages/api/src/routes/blocks/blocks.handler.ts
    - packages/api/src/routes/blocks/blocks.index.ts
    - packages/api/src/routes/blocks/blocks.check.ts
  modified:
    - packages/api/src/db/schemas.ts
    - packages/api/src/db/drizzle/meta/_journal.json
    - packages/api/src/app.ts
requirements: [BLK-03, BLK-04]
completed: 2026-10-20
---

# Phase 8 Plan 07: focus_blocks table and PUT /user/blocks Summary

Owner-scoped idempotent upsert of block records (client uuid ids, setWhere on userId) backed by a drizzle-kit generated focus_blocks migration.

## Commits

- 864ee48 feat(BFC-08-07): focus_blocks table and generated 0012 migration
- fa7dc9f feat(BFC-08-07): PUT /user/blocks owner-scoped idempotent upsert

## Verification

- `bun run src/routes/blocks/blocks.check.ts` (red before handler existed, green after)
- API and Next `tsc --noEmit` clean; `bun run check` clean
- Generated SQL: one CREATE TABLE, one FK ALTER, one CREATE INDEX; no other tables
- `drizzle-kit generate` ran offline; no migrate, push, wrangler or SQL executed; no .env/.dev.vars file opened

## Pending (human checkpoint, Task 3)

**Captain must apply migration 0012** (`cd packages/api && bun run db:migrate`, after confirming 0011 is applied to the same database; production needs it before the API deploy that ships this route). 08-08 and 08-09 rely on the table.

## Deviations from Plan

None. Check script only got an `assert.ok(ra)` narrowing to satisfy the Biome noUnsafeOptionalChaining rule.

## Known Stubs

None.

## Self-Check: PASSED
