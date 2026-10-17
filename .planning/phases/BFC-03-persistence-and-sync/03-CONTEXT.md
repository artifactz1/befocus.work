# Phase 3: Persistence and Sync - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning
**Source:** ROADMAP.md Phase 3 entry, REQUIREMENTS.md (ENG-05, SYN-01, SYN-02, SYN-03, SYN-05),
`docs/superpowers/specs/2026-04-29-dashboard-customization-design.md` (data model, sync strategy),
the Phase 9 plans' assumed seams (09-CONTEXT "Dependencies and Seams", 09-04 and 09-08 Task 1), and
the captain's picks on the Phase 3 board (Lavish session http://127.0.0.1:4387/session/a7eb694b47d9fd36, file
`phase3-board/board.html` in the planner's scratchpad, not committed).

<domain>
## Phase Boundary

The look a user applies in the Customize panel is stored and comes back on the next visit, painted
before the first frame:

- Signed-in users: stored server-side as a theme record plus an active-theme pointer on
  `sessionSettings` (final shape, so Phase 4 adds naming and multi-theme on top without a second
  migration). Visible on any device after sign-in.
- Guests: stored in `localStorage` in the same browser.
- Rapid repeated Apply settles on exactly the last look, and a refresh confirms the server agrees.

Requirements: ENG-05, SYN-01, SYN-02, SYN-03, SYN-05.

Out of scope: named themes, more than one theme, curated presets as stored themes, the Theme tab
(all Phase 4); moving a guest's look into the account on sign-up (SYN-04, Phase 4); uploads (Phase
5); Session progress itself (Phase 9 adds the key, this phase makes sure it will persist).
</domain>

<decisions>
## Implementation Decisions (locked)

### Storage shape (signed-in)
- New table `themes`: `id uuid` primary key (default random), `user_id text` not null, references
  `user.id` on delete cascade (the spec wrote `uuid`; better-auth ids are `text`, so the column
  follows the real `user.id` type), `name text` not null default `'My look'`, `look jsonb` not null
  typed as `Look`, `created_at` and `updated_at` timestamptz not null default now, index on
  `user_id`. The spec called the column `customizations`; it is `look` here to match the shared
  `Look` type and `lookSchema` that already validate it.
- `sessionSettings` gains `active_theme_id uuid` nullable, references `themes.id` on delete set null.
- `sessionSettings.user_id` gains a unique index. The save path upserts the settings row on it, and
  the app already treats it as one row per user (`createUserSettings` returns the existing row).
  The migration is applied by a human after a duplicate check (03-02).
- Phase 3 writes exactly one theme per user: the active one. Phase 4 adds the rest.

### Storage shape (guest)
- Same shape in the browser, so the Phase 4 import (spec "Sync strategy") reads one format:
  `befocus.themes` holds `[{ id, name, look }]` (one entry in Phase 3) and `befocus.activeThemeId`
  holds its id. A third key, `befocus.lookPaint`, caches the computed paint tokens for the
  no-flash script. It is derived data and is rewritten on every guest save.

### API
- `GET /user/settings` keeps its path and adds `look: Look | null` (left join on the active theme).
  The look is re-validated with `lookSchema.safeParse` on read; a stored look that no longer parses
  comes back as `null` and the client falls back to the default look.
- New `PUT /user/themes/active` with body `{ look }` saves the active look and returns
  `{ look, themeId, updatedAt }`. It lives in a new `routes/themes/` trio so Phase 4's
  `/user/themes` CRUD lands next to it. It creates the settings row (default 1500 / 300 / 6) and the
  first theme when the user has neither. Owner-scoped; the body carries no ids.
- `lookSchema` (packages/types/look.ts) is the one schema for the look on both sides. The API
  imports it by relative path (drizzle-kit has no tsconfig paths), as Phase 9 does.

### Hydration (FND-05, single owner)
- Signed-in: the `(app)/layout.tsx` server fetch stays the only source. It already calls
  `getUserSettings()`; the result now carries `look`, passed as `initialLook` to
  `CustomizeStoreProvider` (today hard-coded `null`). No client-side fetch of the look on mount.
- Guest: the `CustomizeStoreProvider` mount effect reads the guest look once, before its first
  paint, and seeds `active`, `preview` and `persisted`. No other component reads the guest keys.

### No flash (ENG-05)
- An inline script, rendered as the first child of the `(app)` and `guest` layouts, sets the CSS
  custom properties and `data-progress` / `data-density` on `<html>` before the rest of the body
  is parsed. Signed-in: the server embeds the tokens for the user's look. Guest: the script reads
  `befocus.lookPaint` and paints only allow-listed names and safe values.
- The existing painter effect in `CustomizeStoreProvider` keeps painting after hydration and on
  every change; the script only covers the first frame. Tokens stay on `<html>` because Radix
  portals render outside any wrapper.

### Save semantics (SYN-05)
- The store gets one callable action, `saveLook(look)`, the only path from the store to storage.
  `apply()` calls it when the applied look differs from the `active` look it replaces (the last
  look handed to storage), not from `persisted`: comparing with `persisted` would skip a save that
  returns to the stored look while an older save is still in flight, and that older save would
  then win. Phase 9's `commitKey` calls the same action.
- Signed-in saves go through a coalescing queue: at most one request in flight, a newer look
  replaces any queued one, and when the in-flight request returns the latest queued look is sent.
  The last look the user applied is always the last one written. A failed save is retried by the
  next change ("We'll try again next time you change it"). `persisted` records what storage
  confirmed and moves only on success.
- Guest saves are synchronous `localStorage` writes through the browser-storage helper.

### Browser-storage helper (shared seam)
- `apps/next/src/lib/storage/browser-storage.ts`: `readStored(key, schema, storage?)` returns the
  parsed value or `null` (missing key, bad JSON, failed schema, storage unavailable);
  `writeStored(key, value, storage?)` returns `false` when storage throws or is missing. Storage is
  injectable for checks. The existing ad hoc `localStorage` uses (sounds hidden starters, guest
  intro flag) move onto it, so the repo has one pattern.

### Technical constraints
- Biome style, no test runner: `*.check.ts` scripts with `node:assert/strict` run by Bun, plus
  `bun run check`, `bun run turbo:build`, and E2E in a real browser.
- Migrations are generated with `npx drizzle-kit generate --name look_persistence`, never
  hand-numbered or hand-edited, and never applied by Claude (human checkpoint).
- Deploy order: API before web for this phase (the web reads `look` from GET /user/settings and
  calls the new route).

### Claude's Discretion
- File split inside `lib/customize/`, the exact queue implementation, whether `saveLook` returns a
  promise, the token value regex in the guest script, and the index name.
</decisions>

<captain_picks>
## Captain Picks (2026-10-16, locked)

Answered on the Phase 3 picks board (Lavish session http://127.0.0.1:4387/session/a7eb694b47d9fd36).
Every pick was the recommended option. The free-text notes field was empty.

Visual (specified in 03-UI-SPEC, built in 03-05):
- UI-1 Signed-in save fails: **A, error toast** "Couldn't save your look. It stays on this screen.
  We'll try again next time you change it." (B amber dot and C silent were rejected.)
- UI-2 Save succeeds: **A, nothing**. The look on screen is the confirmation (B "Look saved."
  toast rejected).
- UI-3 Guest note: **B, one line above Revert and Done**, guests only: "Saved in this browser.
  Sign in to keep it on every device." with "Sign in" linking to `/sign-in`. (A no note and C header
  label were rejected.)
- UI-4 Guest storage blocked: **A, toast once per visit** "This browser isn't saving your look.
  Private browsing can block storage." on the first Done that cannot be stored. (B panel warning
  and C silent were rejected.)

Product:
- P1 Session progress preference: **inside the look**. One key in `lookSchema`, saved with the
  rest of the look, as Phase 9 plans (09-08). No separate account setting.
- P2 Save timing: **on Done, close, Escape or leaving the route** (the moments `apply()` already
  runs). Nothing is saved while the user drags a control.
- P3 Order: **execute Phase 7.1 first**. Phase 3's migration is generated after 0010
  (`0011_look_persistence` if nothing else lands in between) and its settings handler changes build
  on 07.1-01's rewrite.
- P4 `/guest` after sign-out: **shows that browser's guest look**. The guest look and the account
  look are separate; sign-out does not clear or copy either.
</captain_picks>

<dependencies>
## Dependencies and Seams (what Phase 9 gets, by name)

Phase 9's plans check these in their Task 1 precondition steps. The names below are the contract.

| Phase 9 seam | What Phase 3 delivers |
| --- | --- |
| Guest storage (09-04, 09-05) | `apps/next/src/lib/storage/browser-storage.ts`: `readStored<T>(key: string, schema: ZodType<T>, storage?): T \| null` and `writeStored(key: string, value: unknown, storage?): boolean`. Read validates with the caller's zod schema and returns `null` on missing, bad or unavailable data; write returns `false` when storage is unavailable. Used by Phase 3 for `befocus.themes`, `befocus.activeThemeId` and `befocus.lookPaint`. |
| Hydration owner (09-04) | Signed-in: `apps/next/src/app/(app)/layout.tsx` server fetch `getUserSettings()` passed into providers as initial props (`initialSettings`, `initialLook`). Guest: the provider mount effect reads storage once before first paint (`CustomizeStoreProvider` for the look). |
| Preference persistence (09-08) | Signed-in: `PUT /user/themes/active` writes `themes.look` (jsonb), validated by the shared `lookSchema` from `packages/types/look.ts`; `GET /user/settings` returns it as `look`. Guest: `befocus.themes` / `befocus.activeThemeId` via the helper. A new optional key with a `.default()` in `lookSchema` parses older stored looks on both sides. Deploy the API before the web when the schema gains a key (the server schema is strict). |
| Save trigger (09-08) | `useCustomizeStore` action `saveLook(look: Look): void` in `apps/next/src/store/useCustomizeStore.tsx`. `apply()` reaches it when the applied look differs from the `active` look it replaces; any caller outside the panel (Phase 9's `commitKey`) calls it directly. |

Phase 3 depends on Phase 2 (shipped: `lookSchema`, `useCustomizeStore`, painter) and, by the
recommended order, on Phase 7.1 having landed its settings route rewrite and migration.
</dependencies>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` Phase 3 entry and notes
- `.planning/REQUIREMENTS.md` ENG-05, SYN-01..05, FND-05
- `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md` "Drizzle tables",
  "Guest localStorage keys", "API surface", "Sync strategy"
- `packages/types/look.ts` (`lookSchema`, `DEFAULT_LOOK`, `lookEquals`)
- `apps/next/src/store/useCustomizeStore.tsx` (store, painter effect)
- `apps/next/src/lib/customize/catalog.ts` (`lookToTokens`)
- `apps/next/src/app/(app)/layout.tsx`, `apps/next/src/app/guest/layout.tsx`
- `apps/next/src/lib/server/getUserSettings.ts`, `apps/next/src/lib/api.client.ts`
- `packages/api/src/db/tables/settings.ts`, `packages/api/src/routes/user/user.*.ts`
- `.planning/phases/BFC-07.1-session-settings-start-card-and-capsule-steppers/07.1-01-PLAN.md`
  (settings route rewrite and migration 0010 that Phase 3 builds on)
- `.planning/phases/BFC-09-tasks-and-time-blocks/09-CONTEXT.md` "Dependencies and Seams"
</canonical_refs>

<specifics>
## Specific Ideas

- The look is small (under 1 KB), so a full-document PUT per save is fine; no patch protocol.
- `keepalive` on the signed-in save so a save started by Done right before navigating away still
  lands.
</specifics>

<deferred>
## Deferred Ideas

- Guest to account migration on sign-up (SYN-04, Phase 4).
- Cross-tab live sync (a `storage` event listener for guests, refetch-on-focus for signed-in). A
  refresh picks up the other tab's save; live sync can follow if it is asked for.
- Server-side conflict detection (`If-Match` / `updatedAt` precondition). Last write wins, as the
  spec accepts for rapid Apply.
</deferred>
