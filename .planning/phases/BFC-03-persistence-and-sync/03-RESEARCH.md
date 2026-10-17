# Phase 3: Persistence and Sync - Research

**Researched:** 2026-10-16
**Domain:** Drizzle (neon-http) schema and migration, Hono/zod-openapi route, Next.js 15 App Router
first-paint script, Zustand context store, `localStorage`
**Confidence:** HIGH for every integration point (read from the code); three runtime behaviours
flagged ASSUMED with a check in the plan that exercises them

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Storage in its final shape: `themes` table (one row per saved look; Phase 3 writes only the
  active one) plus `sessionSettings.active_theme_id`. Unique index on `sessionSettings.user_id`.
- Guest storage mirrors it: `befocus.themes`, `befocus.activeThemeId`, plus the derived
  `befocus.lookPaint` cache.
- `GET /user/settings` gains `look`; new `PUT /user/themes/active`.
- Hydration stays with the FND-05 owner: the `(app)/layout.tsx` server fetch for signed-in users;
  the provider mount effect for guests.
- No flash: an inline script as the first child of the `(app)` and `guest` layouts.
- `saveLook(look)` is the one store action that writes storage; a coalescing queue makes rapid
  Apply converge.
- Shared helper `lib/storage/browser-storage.ts` (`readStored`, `writeStored`).
- Captain picks: UI-1 A, UI-2 A, UI-3 B, UI-4 A; P1 in the look, P2 on Done or close, P3 7.1
  first, P4 guest look after sign-out.

### Claude's Discretion
- File split inside `lib/customize/`, the queue implementation, whether `saveLook` returns a
  promise, the guest script's value regex, the index name.

### Deferred Ideas (OUT OF SCOPE)
- SYN-04 guest import, cross-tab live sync, server-side conflict detection.
</user_constraints>

## Phase Requirements

| ID | Description | Research support |
|----|-------------|------------------|
| ENG-05 | Customizations paint on first render, no flash of defaults | Pattern 4 (inline paint script) and Pitfall 3 |
| SYN-01 | Signed-in look persists server-side and survives refresh | Patterns 1-3 |
| SYN-02 | Signed-in look appears on another device after sign-in | Pattern 3 (server is the source; no device-local cache for accounts) |
| SYN-03 | Guest look persists in `localStorage` and survives refresh | Patterns 5-6 |
| SYN-05 | Rapid repeated Apply converges to one correct persisted state | Pattern 7 (coalescing queue) and the server's last-write-wins update |

## Project Constraints (from CLAUDE.md)

- Biome (single quotes, no semicolons, 100 columns, trailing commas). No ESLint or Prettier.
- No test runner: `*.check.ts` scripts with `node:assert/strict`, run by Bun (precedents
  `lib/sounds/sounds.check.ts`, `lib/customize/customize.check.ts`).
- Routes use the three-file split and must be chained in `*.index.ts` and added to the `routes`
  array in `packages/api/src/app.ts` to exist on the typed client.
- Per-request DB client (`c.get('db')`); no module-level clients.
- Middleware order: everything not mounted before `requireAuth` is auth-gated. Both routes here
  need auth.
- Reuse drizzle-zod schemas colocated with the table.
- Never hand-edit generated files (migrations, snapshots, journal).

## Architectural Responsibility Map

| Concern | Owner | File |
|---------|-------|------|
| Look shape and validation | shared types | `packages/types/look.ts` (`lookSchema`, unchanged here) |
| Look to CSS tokens | client lib | `apps/next/src/lib/customize/catalog.ts` `lookToTokens` (unchanged) |
| Theme rows and pointer | API DB | `packages/api/src/db/tables/themes.ts` (new), `settings.ts` |
| Read look for hydration | API | `GET /user/settings` handler (left join) |
| Write active look | API | `PUT /user/themes/active` (new `routes/themes/` trio) |
| Server fetch (signed-in hydration owner) | Next server | `lib/server/getUserSettings.ts`, `app/(app)/layout.tsx` |
| Guest read and write | client lib | `lib/storage/browser-storage.ts`, `lib/customize/guest-look.ts` (new) |
| First-frame paint | Next server component | `components/customize/LookPaintScript.tsx` (new) built from `lib/customize/look-paint.ts` |
| Live paint after hydration | client store | `useCustomizeStore.tsx` painter effect (unchanged behaviour) |
| Save ordering | client lib | `lib/customize/look-saver.ts` (new) |

## Summary

The look already exists as one validated JSON object (`Look`, about 300 bytes) with one function
that turns it into CSS (`lookToTokens`). Phase 3 stores that object, returns it on the request the
dashboard already makes, and paints it before React runs. Nothing in the look is rendered by React
on the dashboard except the open Customize panel; everything else reads CSS custom properties and
`data-*` attributes on `<html>`. That makes a plain inline script enough for a flash-free first
frame, with no SSR of styles and no hydration mismatch risk.

## Standard Stack

### Core (already installed, versions from package.json)
- drizzle-orm `^0.38` with `drizzle-orm/neon-http`, drizzle-kit `^0.30`, drizzle-zod `^0.7`
- hono `^4.6.14`, `@hono/zod-openapi`, `hono/client` (typed `api` in `apps/next/src/lib/api.client.ts`)
- zod `^3.24`, zustand (vanilla `createStore` in a context provider), sonner (toasts)
- Next.js `15.1.9` App Router

### Alternatives Considered
| Instead of | Could use | Why not |
|------------|-----------|---------|
| Inline script | `next/script` `strategy="beforeInteractive"` | Only allowed in the root layout, which does not know the user's look |
| Inline script | Server-rendered `<style>:root{...}</style>` | Sets properties but cannot set `data-progress` / `data-density` on `<html>`, which the CSS keys on; still needs a script for guests |
| Inline script | zustand `persist` middleware | Rehydrates after mount, so the first frame is the default look (the flash ENG-05 forbids); also no first-frame path for signed-in users |
| Coalescing queue | TanStack `useMutation` per Apply | Parallel mutations can land out of order (SYN-05); the queue guarantees the last applied look is the last write |
| `themes` table | JSON column on `sessionSettings` | ROADMAP note: land the final shape now so Phase 4 does not migrate a throwaway column |

## Package Legitimacy Audit

No new packages.

## Architecture Patterns

### System Architecture Diagram

```
Signed-in first load
  browser -> Next (app)/layout.tsx (server)
               getUserSettings() --cookie--> API GET /user/settings
                                              sessionSettings LEFT JOIN themes ON active_theme_id
                                              <- { ...settings, look | null }
               <LookPaintScript tokens={lookToTokens(look ?? DEFAULT)} />   (first child)
               <CustomizeStoreProvider mode='account' initialLook={look}>
  HTML parse: script sets --tokens and data-* on <html> before the dashboard markup
  hydrate: painter effect repaints the same values (no visible change)

Guest first load
  /guest layout (server) -> <LookPaintScript tokens={null} />  (script reads befocus.lookPaint)
                           <GuestShell> (client) -> CustomizeStoreProvider mode='guest'
  mount effect: readGuestLook() -> setState(active, preview, persisted) -> first paint()

Apply (Done / close / Escape / route leave)
  apply(): if !lookEquals(preview, active) saveLook(preview); active = preview
  saveLook: guest  -> writeGuestLook(look) (themes, activeThemeId, lookPaint) -> persisted = look
            account-> saver.save(look) -> PUT /user/themes/active (one in flight, latest wins)
                                       -> onSaved: persisted = look | onError: toast (03-05)
```

### Recommended Project Structure

```
apps/next/src/lib/storage/browser-storage.ts        readStored, writeStored
apps/next/src/lib/storage/browser-storage.check.ts
apps/next/src/lib/customize/guest-look.ts           GUEST_* keys, readGuestLook, writeGuestLook
apps/next/src/lib/customize/look-saver.ts           createLookSaver
apps/next/src/lib/customize/look-paint.ts           buildPaintScript, PAINT_* allowlists
apps/next/src/lib/customize/persistence.check.ts    checks guest-look, look-saver, look-paint
apps/next/src/components/customize/LookPaintScript.tsx   server component, <script>
apps/next/src/app/guest/GuestShell.tsx              today's guest layout body ('use client')
packages/api/src/db/tables/themes.ts
packages/api/src/routes/themes/themes.{route,handler,index}.ts
```

### Pattern 1: Tables

```ts
// packages/api/src/db/tables/themes.ts
import { type Look, lookSchema } from '../../../../types/look' // relative: drizzle-kit has no paths
export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('My look'),
  look: jsonb('look').$type<Look>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('themes_user_id_idx').on(t.userId)])
```

`settings.ts` adds `activeThemeId: uuid('active_theme_id').references(() => themes.id, { onDelete:
'set null' })` and a unique index on `userId`. `settings.ts` importing `themes` and `themes.ts`
importing `user` from `auth.ts` has no cycle. drizzle 0.38's third `pgTable` argument accepts an
array (the object form is deprecated). [VERIFIED from the existing table files' import style;
array form CITED from drizzle 0.36+ docs]

### Pattern 2: Save route algorithm (neon-http has no interactive transactions)

```
PUT /user/themes/active { look }          (look validated by lookSchema via the zod hook, 422 on fail)
1. insert sessionSettings (id nanoid, 1500, 300, 6, userId) onConflictDoNothing({ target: userId })
2. select activeThemeId where userId = me
3. if set: update themes set look, updatedAt = now where id = activeThemeId and userId = me returning
   -> 1 row: return 200
4. else (or 0 rows): newId = crypto.randomUUID()
   db.batch([ insert themes { id: newId, userId: me, look },
              update sessionSettings set activeThemeId = newId
                where userId = me and activeThemeId is null returning ])
   -> update returned 1 row: return 200
   -> 0 rows (another request set the pointer first): delete themes where id = newId and userId = me,
      go to step 3 once; if it still fails return 500
```

`db.batch` on neon-http runs the statements in one non-interactive transaction. [CITED: drizzle
docs "Batch API" lists neon-http] Two tabs saving at once both end with the latest write on the one
active theme, and no orphan rows are left. Step 1 is why the unique index is needed (`ON CONFLICT`
needs a unique target). It also makes `createUserSettings` safe to keep returning the existing row.

### Pattern 3: Read on the hydration request

```ts
const [row] = await db
  .select({ settings: sessionSettings, look: themes.look })
  .from(sessionSettings)
  .leftJoin(themes, and(eq(themes.id, sessionSettings.activeThemeId), eq(themes.userId, user.id)))
  .where(eq(sessionSettings.userId, user.id))
if (!row) return 404 (unchanged)
const look = lookSchema.safeParse(row.look)
return { ...row.settings, look: look.success ? look.data : null }
```

The response schema becomes `getUserSettingsSchema.extend({ look: lookSchema.nullable() })`.
`getUserSettings.ts` (server) types its result as the new `UserSettingsWithLook` type. TanStack's
`['userSettings']` cache (seeded in the layout) gains the field harmlessly.

### Pattern 4: First-frame paint script

```tsx
// LookPaintScript.tsx (server component, no 'use client')
export function LookPaintScript({ tokens }: { tokens: PaintTokens | null }) {
  return <script dangerouslySetInnerHTML={{ __html: buildPaintScript(tokens) }} />
}
```

`buildPaintScript(tokens)` returns a self-invoking function in a `try {}`. With tokens, it embeds
`JSON.stringify(tokens)` with every `<` replaced by `<` (so a value can never close the script
tag). With `null`, it reads `localStorage.getItem('befocus.lookPaint')`, `JSON.parse`s it and
checks it. It then sets each property whose name is in the allowlist (the keys of
`lookToTokens(DEFAULT_LOOK).props`) and whose value matches `^[^;{}<>\\]{0,200}$` and does not
contain `url(`. It sets `data-progress` and `data-density` only when the value is in
`PROGRESS_IDS` / `DENSITY_IDS`. The allowlists are serialised into the script at build time from
the same constants the painter uses, so a new token or enum value cannot drift.

Rendered as the first child inside the layout, it runs while the parser reaches it, before the
dashboard markup after it is parsed or painted. [ASSUMED A1: no paint happens between `<body>`
start and this script. The stylesheet in `<head>` blocks rendering until it loads, and the script
is the first element in the layout's output. 03-06 checks it with a throttled-network reload.]

### Pattern 5: Browser-storage helper

```ts
type Readable = Pick<Storage, 'getItem'>
type Writable = Pick<Storage, 'setItem'>
const defaultStorage = (): Storage | undefined => {
  try { return globalThis.localStorage } catch { return undefined } // access itself can throw (Safari, blocked cookies)
}
export function readStored<T>(key: string, schema: ZodType<T>, storage: Readable | undefined = defaultStorage()): T | null
export function writeStored(key: string, value: unknown, storage: Writable | undefined = defaultStorage()): boolean
```

The existing `readHiddenStarters` / `hideStarter` in `lib/sounds/sounds.ts` and the guest intro flag
in `app/guest/page.tsx` move onto it, so there is one pattern for 09-04 and 09-05 to reuse.

### Pattern 6: Guest look record

```ts
GUEST_THEMES_KEY = 'befocus.themes'          // [{ id: uuid, name: string, look: Look }]
GUEST_ACTIVE_KEY = 'befocus.activeThemeId'   // uuid
GUEST_PAINT_KEY  = 'befocus.lookPaint'       // { props, attrs } from lookToTokens
readGuestLook(storage?): Look | null   // active id -> matching theme -> lookSchema; else null
writeGuestLook(look, storage?): boolean // keeps the existing theme id or makes one; writes all three
```

The guest themes schema validates each entry's `look` with `lookSchema`, so a Phase 9 key with a
`.default()` parses old guest data too.

### Pattern 7: Coalescing saver

```ts
createLookSaver({ send: (look) => Promise<void>, onSaved: (look) => void, onError: (err) => void })
  .save(look)   // if idle: send now; if busy: pending = look (replaces older pending)
// when send settles: success -> onSaved(sent) (persisted = what the server has); failure -> onError(err);
// then if pending: send(pending)
```

There is at most one request in flight per tab, and the latest look always goes last. The server
update is last-write-wins, so the last request to arrive is the stored state. With one tab, that is
the last look applied. Across tabs, the last tab to save wins, which the spec accepts.

### Anti-Patterns to Avoid
- Reading `localStorage` in a component render or in `useState` initialisers (SSR mismatch).
- A second client fetch of the look on mount (breaks FND-05).
- Painting inside the store setter (the existing effect already paints on every change).
- Writing the look on every `setPreview` (P2: save only on the existing keep moments).
- Spreading the request body into the insert (mass assignment). Destructure `look` only.

## Don't Hand-Roll

| Problem | Use |
|---------|-----|
| Look validation | `lookSchema` (shared, strict) |
| Tokens | `lookToTokens` |
| Migration SQL | `drizzle-kit generate --name look_persistence` |
| Toasts | `sonner` `toast` / `toast.error` |
| Ids | `crypto.randomUUID()` (Workers and browsers) |

## Runtime State Inventory

| State | Where | Lifetime |
|-------|-------|----------|
| Signed-in look | `themes.look` row pointed to by `sessionSettings.active_theme_id` | durable |
| Guest look | `localStorage` `befocus.themes` + `befocus.activeThemeId` | per browser profile |
| Guest paint cache | `localStorage` `befocus.lookPaint` | rewritten on every guest save |
| `persisted` in the store | memory | page load |
| Saver pending look | memory | page load |
| Storage-blocked toast flag | module variable | page load |

## Common Pitfalls

1. **Guest first paint order.** The provider effect must read storage before it calls `paint()` for
   the first time. Otherwise one frame of the default look shows between the script and the effect.
2. **`localStorage` access throws.** In Safari with blocked site data, reading
   `window.localStorage` itself throws a `SecurityError`, not just `setItem`. The helper wraps the
   access too.
3. **Soft navigation from sign-in.** `/sign-in` -> `/` is a client navigation. The layout's script
   element arrives through the RSC payload and React does not execute inserted scripts, so the
   painter effect paints on mount (one frame of default is possible on that path only). Hard loads,
   refreshes and new devices use the script. Sign-in may already do a full redirect for OAuth.
   03-06 records which path each flow takes. [ASSUMED A2]
4. **React dev warning for `<script>`.** React 19 (vendored by Next 15 App Router) may log "Encountered
   a script tag while rendering React component" in dev when the element is created on the client
   (soft navigation). It is harmless; 03-06 records whether it appears. [ASSUMED A3]
5. **Strict schema and deploy order.** `lookSchema` is `.strict()`. A client that sends a key the
   server's schema does not know gets 422. Deploy the API first whenever the schema gains a key
   (Phase 9).
6. **Migration numbering with 7.1.** 07.1-01 claims `0010_ask_before_start`. With P3 (7.1 first),
   Phase 3 generates the next index. Plans check the tag suffix `_look_persistence`, never a number.
7. **Unique index on existing data.** If production has two `sessionSettings` rows for one user,
   the migration fails. 03-02's human checkpoint runs the duplicate query first.
8. **`keepalive` body limit.** keepalive requests are capped at 64 KB in flight. The look is under
   1 KB.

## Code Examples

The typed client call (`api.client.ts` already wraps fetch with `credentials: 'include'` and spreads
`init`):

```ts
await api.user.themes.active.$put({ json: { look } }, { init: { keepalive: true } })
```

[ASSUMED A4: hono 4.6 `ClientRequestOptions` accepts `init`. If the type check rejects it, drop
`init` and pass `keepalive` through the custom `fetch` wrapper for this call. Note it in the
SUMMARY.]

## State of the Art

`localStorage` with a pre-hydration inline script is the standard no-flash pattern (as next-themes
does for the colour scheme). Server-embedded tokens are the signed-in equivalent, with no cookie
mirror needed because the layout already fetches settings server-side.

## Assumptions Log

| ID | Assumption | Checked by |
|----|------------|-----------|
| A1 | No paint before the first-child script on a hard load | 03-06 throttled reload, frame-by-frame |
| A2 | Sign-in to dashboard may be a soft navigation; the painter covers it | 03-06 records the path |
| A3 | React dev warning for client-created script is harmless | 03-06 console capture |
| A4 | hono client `init` option exists in 4.6 | 03-04 type check |
| A5 | drizzle 0.38 neon-http `db.batch` is available | 03-03 type check and round trip |

## Open Questions

None. All product and visual questions were answered on the board (03-CONTEXT "Captain Picks").

## Environment Availability

| Need | Status |
|------|--------|
| `node_modules` | Not installed in the planning worktree; executor runs `bun install` first |
| Neon dev database | Via `packages/api/.dev.vars`; migration applied by a human |
| Two browser profiles | chrome-devtools-axi with a second isolated context for SYN-02 |

## Validation Architecture

| Layer | Check |
|-------|-------|
| Pure logic | `browser-storage.check.ts`, `persistence.check.ts` (guest-look, saver ordering, paint script), existing `sounds.check.ts` still passes |
| Types and lint | `bun run check`, `bun run turbo:build` |
| API | Signed-in round trip with a throwaway user: PUT 200, GET returns look, invalid look 422, first save creates settings row, concurrent PUTs leave one theme |
| E2E | 03-06: guest and signed-in, refresh, second profile, rapid Apply, HTML order, throttled reload, 1440 and 390 widths, UI-SPEC copy |

## Security Domain

| Concern | Control |
|---------|---------|
| Another user's theme | Every query filters on `c.var.user.id`; the body has no ids |
| Script injection through tokens | Server path: `<` escaped in embedded JSON, tokens come from `lookToTokens` of a schema-valid look (hex colours, enum fonts). Guest path: allowlisted names, value regex, enum attrs |
| Oversized body | `lookSchema` is strict with bounded fields |
| Migration on the wrong database | Human checkpoint names the target; Claude never runs migrate or push |

## Sources

- Code: files listed in 03-CONTEXT "Canonical References"
- `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md`
- drizzle docs (Batch API, indexes), MDN (`fetch` keepalive, `Storage` exceptions), React 19 docs
  (script elements)
