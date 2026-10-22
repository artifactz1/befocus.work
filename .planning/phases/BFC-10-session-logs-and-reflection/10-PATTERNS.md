# Phase 10: Session Logs and Reflection - Pattern Map

**Mapped:** 2026-10-21
**Files analyzed:** 52 (new + modified)
**Analogs found:** 48 / 52

All paths are relative to the repo root. Line numbers refer to the code at commit `2a36593`. A "~" means the number is approximate.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/api/src/db/tables/logs.ts` (new: `block_logs` and `session_notes`) | model | CRUD | `packages/api/src/db/tables/focus-blocks.ts`, `plans.ts` | exact |
| `packages/api/src/db/tables/tasks.ts` (mod: `later`, `laterAt`) | model | CRUD | `tasks.ts` `archived` column, `settings.ts:16` | exact |
| `packages/api/src/db/schemas.ts` (mod) | config | barrel | itself | exact |
| `packages/api/src/db/drizzle/0015_session_logs.sql` (new) | migration | DDL | `0012_focus_blocks.sql`, `0014_task_block_links.sql`, `0010_*` (add column) | exact |
| `packages/api/src/db/drizzle/meta/0015_snapshot.json` + `_journal.json` (new/mod) | migration | DDL meta | `meta/0014_snapshot.json`, journal idx 14 | exact |
| `packages/api/src/routes/logs/logs.route.ts` (new) | route | request-response | `routes/plan/plan.route.ts`, `routes/blocks/blocks.route.ts` | exact |
| `packages/api/src/routes/logs/logs.handler.ts` (new) | controller | CRUD (upsert + read) | `routes/plan/plan.handler.ts`, `routes/blocks/blocks.handler.ts` | exact |
| `packages/api/src/routes/logs/logs.index.ts` (new) | route | wiring | `routes/plan/plan.index.ts` | exact |
| `packages/api/src/routes/logs/logs.check.ts` (new) | test | schema check | `routes/blocks/blocks.check.ts` | exact |
| `packages/api/src/routes/blocks/blocks.{route,handler,index}.ts` (mod: `GET /user/blocks`) | route/controller | read | `plan.handler.ts` `getUserBlockTasks` (202-240) | exact |
| `packages/api/src/routes/user/user.handler.ts` (mod: set `laterAt` when `later` toggles) | controller | CRUD | itself, `updateUserTask` (~444-540) | exact |
| `packages/api/src/app.ts` (mod) | config | wiring | itself, line 14 | exact |
| `packages/types/logs.ts` (new) | model (shared type + zod) | transform | `packages/types/blocks.ts`, `packages/types/plan.ts` | exact |
| `packages/types/tasks.ts` (mod: `later?`, `laterAt?`) | model | - | itself | exact |
| `packages/types/look.ts` (mod: `askAtBreak`, if Look key route chosen) | model | - | `sessionProgress` key in same file | exact |
| `apps/next/src/lib/logs/logs-storage.ts` (new, guest) | utility | file-I/O (localStorage) | `lib/blocks/block-records.ts`, `lib/tasks/tasks-storage.ts` link history | exact |
| `apps/next/src/lib/logs/summary.ts` (new: session snapshot, done / not done / later derivation, stat chips) | utility | transform | `lib/plan/now.ts` `blockRecordTasks` (56-68), `lib/plan/plan.ts` `buildSessionView` | role-match |
| `apps/next/src/lib/logs/insights.ts` (new: rules) | utility | transform | `lib/plan/strip.ts` (pure fn + check) | role-match |
| `apps/next/src/lib/logs/export.ts` (new: text / md formatting) | utility | transform | `lib/plan/plan.ts` `formatDuration`, `formatRange` | role-match |
| `apps/next/src/lib/logs/carry.ts` (new: pending "Next session" list) | utility | transform + file-I/O | `lib/session/session.ts` ask key, `lib/plan/plan.ts` `planTask` | role-match |
| `apps/next/src/lib/logs/*.check.ts` (new: summary, insights, export, carry) | test | - | `lib/plan/strip.check.ts`, `lib/plan/plan.check.ts` | exact |
| `apps/next/src/lib/tasks/tasks-storage.ts` (mod: `later` on guest tasks) | utility | file-I/O | itself `guestTaskSchema` | exact |
| `apps/next/src/lib/session/session.ts` (mod: guest `askAtBreak`, if settings route chosen) | utility | file-I/O | `readAskBeforeStart` / `writeAskBeforeStart` in same file | exact |
| `apps/next/src/lib/server/getUserHistory.ts` (new) | service (server loader) | request-response | `lib/server/getUserTasks.ts` (`getUserTasks`, `getUserPlan`) | exact |
| `apps/next/src/hooks/useLogs.ts` (new: save / edit log, notes, guest + account) | hook | CRUD (optimistic) | `hooks/useTasks.ts` `useTaskActions`, `hooks/usePlan.ts` `writeLinks` | exact |
| `apps/next/src/hooks/useHistory.ts` (new) | hook | request-response | `hooks/useTasks.ts` `useUserTasks` (useQuery) | exact |
| `apps/next/src/hooks/useBreakLog.ts` (new: open modal at break start, snapshot at finish) | hook | event-driven | `hooks/usePlan.ts` `usePlanSync` (378-487), `hooks/useEndedCues.ts` | exact |
| `apps/next/src/hooks/useTasks.ts` (mod: `setLater`, patch type) | hook | CRUD | `archive` action in same file | exact |
| `apps/next/src/hooks/usePlan.ts` (mod: seed carry list in `closePlan`) | hook | event-driven | `closePlan` (330-376) | exact |
| `apps/next/src/components/logs/BreakLogModal.tsx` (new) | component | event-driven form | `components/settings/SessionCard.tsx` | exact |
| `apps/next/src/components/logs/LogForm.tsx` (new, shared by modal / summary / history) | component | form | `SessionCard.tsx` body, `customize/controls.tsx` `SegmentedControl` | role-match |
| `apps/next/src/components/logs/SessionSummary.tsx` (new, replaces `SessionCompleteModal.tsx`) | component | read + actions | `SessionCompleteModal.tsx`, `timer/Timer.tsx` ended branch | role-match |
| `apps/next/src/components/SessionCompleteModal.tsx` (delete or reduce to wrapper) | component | - | - | - |
| `apps/next/src/components/logs/DoneList.tsx` (new) | component | CRUD (task actions) | `components/tasks/ListTab.tsx` groups (210-283) | exact |
| `apps/next/src/components/logs/ExportMenu.tsx` (new) | component | file-I/O (clipboard / blob / share) | `components/records/SoundOptions.tsx` (DropdownMenu) | partial |
| `apps/next/src/components/logs/InsightsPanel.tsx` (new) | component | read | `customize/controls.tsx` `SegmentedControl`, `progress/MiniStrip.tsx` | role-match |
| `apps/next/src/components/logs/HistoryList.tsx` (new) | component | read | `tasks/ListTab.tsx` grouped list + `progress/MiniStrip.tsx` | role-match |
| `apps/next/src/components/logs/LogButton.tsx` (new footer entry) | component | navigation | `components/tasks/TasksButton.tsx` | exact |
| `apps/next/src/components/logs/logs.module.css` (new) | config (style) | - | `settings/session-card.module.css`, `progress/progress.module.css` | exact |
| `apps/next/src/components/tasks/ListTab.tsx` (mod: Later group) | component | read | Done / Archived groups in same file | exact |
| `apps/next/src/components/customize/sections/StyleSection.tsx` + `sections/index.ts` (mod: toggle) | component | preference | `SessionProgressSection` (45-67) | exact |
| `apps/next/src/components/settings/MenuSettings.tsx`, `MenuSettingsMobile.tsx` (mod) | component | navigation | footer order in same files | exact |
| `apps/next/src/components/timer/Timer.tsx` (mod: summary takes over stage when finished) | component | read | itself, `ended` branch (line 112) | exact |
| `apps/next/src/app/log/page.tsx` + `layout.tsx` (new) | route (page) | request-response | `app/(app)/layout.tsx`, `app/guest/GuestShell.tsx` | role-match |
| `apps/next/src/app/(app)/page.tsx`, `app/guest/page.tsx` (mod) | route (page) | wiring | themselves (line 15 / line 39) | exact |
| `apps/next/src/middleware.ts` (mod: allow `/log`) | middleware | request-response | `isHomeRoute` in same file | exact |
| `packages/api/src/db/tables/settings.ts` (mod, only if the settings route is chosen for `askAtBreak`) | model | CRUD | line 16 `askBeforeStart` | exact |

## Pattern Assignments

### `packages/api/src/db/tables/logs.ts` (model, CRUD)

**Analog:** `packages/api/src/db/tables/focus-blocks.ts` (table shape) and `plans.ts` (hand-written zod plus a table keyed by user).

**Imports** (focus-blocks.ts 1-5). The types import is relative on purpose, because drizzle-kit resolves no tsconfig paths:
```ts
import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { ... } from '../../../../types/blocks'
import { user } from './auth'
```
`plans.ts` line 1 imports `z` from `@hono/zod-openapi` (not `zod`) for the hand-written schemas.

**Table pattern** (focus-blocks.ts 10-30):
```ts
export const focusBlocks = pgTable('focus_blocks', {
  id: uuid('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull(),
  ...
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('focus_blocks_user_session_idx').on(t.userId, t.sessionId)])
```

**No FK on the block id** (plans.ts 47-69, `taskBlockLinks`). The comment there says links outlive the plan. Recommendation for `block_logs.block_id`: make it a uuid primary key with no FK to `focus_blocks`. Block records reach the server through an async queue (`createRecordQueue`), so a log can be saved before its record lands. Add `session_id uuid not null`, an index on `(user_id, session_id)`, `text`, `rating` (text enum `scattered|okay|deep`, nullable), and timestamps.

**Session notes** (`session_notes`): copy `taskPlans` (plans.ts 22-30), but key it by `sessionId` uuid primary key plus `userId` FK cascade. Columns: `nextTime` text, `extraDone` `jsonb(...).$type<string[]>()`, timestamps.

**Schemas** (focus-blocks.ts 32-35; plans.ts 35-42, 73-84):
```ts
export type FocusBlock = InferSelectModel<typeof focusBlocks>
export const selectFocusBlockSchema = createSelectSchema(focusBlocks)
export const insertFocusBlockSchema = createInsertSchema(focusBlocks)
// plans.ts: putPlanSchema = createInsertSchema(taskPlans, {...}).pick({...})
// response: .extend({ updatedAt: z.string() }) ; dates as z.string().nullable()
```
Hand-written body schemas with limits follow plans.ts 87-107: `z.array(...).min(1).max(64)` plus `.refine`. Query schemas follow plans.ts 114-128: `z.object({ blockId: z.string().uuid() })`.

---

### `packages/api/src/db/tables/tasks.ts` (model, mod)

**Analog:** the `archived` column in the same file (lines 8-18) and `settings.ts:16`.
```ts
archived: boolean('archived').notNull().default(false),
// add:
later: boolean('later').notNull().default(false),
laterAt: timestamp('later_at', { withTimezone: true }),
```
`updateTaskSchema` (lines 26-41, `createUpdateSchema(...).omit({ id, userId, createdAt })`) picks up `later` automatically. Add `laterAt` to the `.omit(...)` on both the insert and update schemas so that the server owns it.

---

### `packages/api/src/db/schemas.ts` (barrel, mod)

Append `export * from '@repo/api/db/tables/logs'`, in the same style as the existing auth, focus-blocks, plans, settings, sounds, tasks and themes lines.

---

### `packages/api/src/db/drizzle/0015_session_logs.sql` + meta (migration)

**Analog:** `0012_focus_blocks.sql` (table + FK + index), `0014_task_block_links.sql` (inline UNIQUE), `0010_*.sql` (add a column).
```sql
CREATE TABLE "focus_blocks" ( ... );
--> statement-breakpoint
ALTER TABLE "focus_blocks" ADD CONSTRAINT "focus_blocks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "focus_blocks_user_session_idx" ON "focus_blocks" USING btree ("user_id","session_id");
```
Add-column form (0010):
```sql
ALTER TABLE "sessionSettings" ADD COLUMN "ask_before_start" boolean DEFAULT true NOT NULL;
```
Tasks: `ALTER TABLE "tasks" ADD COLUMN "later" boolean DEFAULT false NOT NULL;--> statement-breakpoint ALTER TABLE "tasks" ADD COLUMN "later_at" timestamp with time zone;`

**Journal** (`meta/_journal.json`). The last entry is:
```json
{"idx":14,"version":"7","when":1792654000000,"tag":"0014_task_block_links","breakpoints":true}
```
Append idx 15 with a larger `when` and the tag `0015_session_logs`.

**Snapshot:** copy `meta/0014_snapshot.json`, then set `prevId` to `2422b1b2-67eb-47d6-872b-64cf37446166` and give it a fresh `id`. Add the new tables and columns. Write all of this by hand, as 09-02 and 09-06 did: `drizzle-kit generate` is broken in this checkout because of an esbuild mismatch. Never apply the migration.

---

### `packages/api/src/routes/logs/logs.route.ts` (route, request-response)

**Analog:** `routes/plan/plan.route.ts`. Copy `bodyLimit` from `routes/blocks/blocks.route.ts`.

**Imports + tags** (blocks.route.ts top):
```ts
import { createRoute, z } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
const tags = ['Logs']
```
(Copy the exact `stoker` import paths from blocks.route.ts.)

**PUT with body limit** (blocks.route.ts):
```ts
export const putUserBlocks = createRoute({
  path: '/user/blocks', method: 'put', tags,
  middleware: [bodyLimit({ maxSize: 64 * 1024,
    onError: c => c.json({ message }, HttpStatusCodes.REQUEST_TOO_LONG) })] as const,
  request: { body: { content: { 'application/json': { schema } }, required: true } },
  responses: { OK, UNAUTHORIZED, REQUEST_TOO_LONG,
    UNPROCESSABLE_ENTITY: jsonContent(createErrorSchema(schema), '...'), INTERNAL_SERVER_ERROR },
})
export type PutUserBlocks = typeof putUserBlocks
```
**GET with a query** (plan.route.ts `getUserBlockTasks`): `request: { query: blockTasksQuerySchema }`. Error bodies use `messageSchema = z.object({ message: z.string() })`. DELETE returns `{ description }` with NO_CONTENT.

Suggested routes:
- `PUT /user/logs` (upsert one log by blockId)
- `GET /user/logs?sessionId=` or GET all within a window
- `PUT /user/session-notes`
- `GET /user/session-notes`

The history read could also be a single `GET /user/history?days=` that returns records + logs + notes + links. That choice is the planner's.

---

### `packages/api/src/routes/logs/logs.handler.ts` (controller, CRUD)

**Analog:** `routes/plan/plan.handler.ts` and `routes/blocks/blocks.handler.ts`.

**Auth guard** (used by every handler):
```ts
const db = c.get('db')
const user = c.get('user')
if (!user) return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
```
**Owner-scoped upsert** (blocks.handler.ts):
```ts
const excluded = (column: string) => sql.raw(`excluded.${column}`)
await db.insert(t).values(rows).onConflictDoUpdate({
  target: t.id,
  set: { text: excluded('text'), rating: excluded('rating'), updatedAt: sql`now()` },
  setWhere: eq(t.userId, user.id),
}).returning(...)
```
The `setWhere` stops one user from overwriting another user's row with a guessed uuid. Keep it.

**Mappers** (plan.handler.ts `toResponse` / `toLink`): ISO-stringify dates, as in `row.workedAt?.toISOString() ?? null`.

**Read with ownership** (plan.handler.ts 202-240 `getUserBlockTasks`): `innerJoin` with a user filter on both tables and `orderBy(asc(...))`.

**Errors:** wrap the body in `try { ... } catch (error) { console.error('...', error); return c.json({ message }, INTERNAL_SERVER_ERROR) }`. Use `db.batch([...])` for writes with several statements (plan.handler.ts).

**Task ownership for carry or later writes** (plan.handler.ts 137-144):
```ts
const owned = await db.select({ id: tasks.id }).from(tasks)
  .where(and(eq(tasks.userId, user.id), inArray(tasks.id, taskIds)))
if (owned.length !== taskIds.length) return c.json({ message }, HttpStatusCodes.NOT_FOUND)
```

---

### `packages/api/src/routes/logs/logs.index.ts` + `app.ts`

**Analog:** `routes/blocks/blocks.index.ts`, `plan.index.ts`.
```ts
const router = createRouter()
  .openapi(routes.putUserLog, handlers.putUserLog)
  .openapi(routes.getUserLogs, handlers.getUserLogs)
export default router
```
**app.ts line 14:** `const routes = [index, user, themes, blocks, plan] as const`. Append `logs`. A route is missing from `AppType` and the `hono/client` unless it is part of the chain.

---

### `packages/api/src/routes/blocks/*` (mod: `GET /user/blocks`)

Add `getUserBlocks` to blocks.route.ts. It takes an optional query (`since` epoch ms or `days`) and its response is `z.array(blockRecordSchema)`. The handler uses `db.select().from(focusBlocks).where(and(eq(focusBlocks.userId, user.id), gte(focusBlocks.endedAt, since))).orderBy(asc(focusBlocks.startedAt))` and maps rows back to `BlockRecord` (epoch ms). It is the reverse of `toRows`. Chain it in `blocks.index.ts`.

---

### `packages/api/src/routes/logs/logs.check.ts` (test)

**Analog:** `routes/blocks/blocks.check.ts`.
```ts
// Run: cd packages/api && bun run src/routes/blocks/blocks.check.ts
import assert from 'node:assert/strict'
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
assert.equal(schema.safeParse(bad).success, false)
console.log('blocks.check: ok')
```

---

### `packages/api/src/routes/user/user.handler.ts` (mod)

**Analog:** `updateUserTask` in the same file (~444-540): `updateTaskSchema.safeParse(body)`, then `findFirst` with `and(eq(t.id, taskId), eq(t.userId, user.id))`, then `.update(tasks).set(parsed.data).where(and(...)).returning()`. Add this in the set: `...(parsed.data.later !== undefined && { laterAt: parsed.data.later ? new Date() : null })`.

---

### `packages/types/logs.ts` (shared type + zod)

**Analog:** `packages/types/blocks.ts`. It is zod-only and its header says so. The pattern is: `as const` arrays, then the limits, then an interface, then a `z.ZodType<T>` schema with `.strict()`.
```ts
export const BLOCK_OUTCOMES = [...] as const
export interface BlockRecord { id: string; sessionId: string; ... }
export const blockRecordSchema: z.ZodType<BlockRecord> = z.object({...}).strict().refine(...)
```
New exports:
- `FOCUS_RATINGS = ['scattered','okay','deep'] as const`
- `LOG_TEXT_MAX`
- `BlockLog {blockId, sessionId, text, rating: FocusRating | null, updatedAt}`
- `SessionNote {sessionId, nextTime, extraDone: string[]}`
- their schemas
- `LOG_LIMITS`, mirroring `PLAN_LIMITS` in `types/plan.ts`

### `packages/types/tasks.ts` (mod)

`interface Task { id: string; text; completed; archived; createdAt?: string }`. Add `later?: boolean; laterAt?: string | null`.

### `packages/types/look.ts` (mod, if the Look route is chosen)

The analog is `sessionProgress: z.enum(SESSION_PROGRESS_IDS).default('strip')`. Add `askAtBreak: z.boolean().default(true)`. Also add the key to `DEFAULT_LOOK`, and to `lookEquals`, which compares each key explicitly. A missing key there makes the Customize dirty-state wrong.

---

### `apps/next/src/lib/logs/logs-storage.ts` (utility, guest file-I/O)

**Analog:** `lib/blocks/block-records.ts` and `lib/tasks/tasks-storage.ts` (link history).
```ts
export const GUEST_RECORDS_KEY = 'befocus.blockRecords'
export const MAX_STORED_RECORDS = 500
// readRecordList: readStored(key, z.array(z.unknown()), storage) -> per-item safeParse -> .slice(-cap)
// mergeRecords(existing, incoming, cap): upsert by id
```
Envelope style (`tasks-storage.ts`): `{ version: z.literal(1), items: z.array(z.unknown()).max(N) }`, parsed item by item so that one bad entry never loses the rest.

Keys (none of them taken yet): `befocus.blockLogs` (cap 500, upsert by blockId), `befocus.sessionNotes` (cap ~200), `befocus.carryNext` (pending list), `befocus.insightsView` (the Insights/Charts/Both choice, per device for both modes).

Read and write only through `readStored(key, schema, storage = defaultStorage())` and `writeStored(key, value, storage)` from `lib/storage/browser-storage.ts`.

### `apps/next/src/lib/tasks/tasks-storage.ts` (mod)

Extend `guestTaskSchema` (id uuid, text, completed, archived, createdAt optional) with `later: z.boolean().optional()` and `laterAt: z.string().nullable().optional()`. They must be optional, or every stored guest task would fail to parse. Keep `parseGuestTasks` / `toGuestTasks` round-tripping both fields.

### `apps/next/src/lib/session/session.ts` (mod, only if the settings route is chosen)

```ts
const ASK_KEY = 'befocus.askBeforeStart'
const askSchema = z.union([z.literal(0), z.literal(1)])
export const readAskBeforeStart = (storage = defaultStorage()) => readStored(ASK_KEY, askSchema, storage) !== 0
export const writeAskBeforeStart = (v: boolean, storage = defaultStorage()) => writeStored(ASK_KEY, v ? 1 : 0, storage)
```
Copy it for `befocus.askAtBreak`. Because the check is `!== 0`, the setting defaults to on.

---

### `apps/next/src/lib/logs/summary.ts` (utility, transform)

**Analog / reuse:** `lib/plan/now.ts` `blockRecordTasks(links, tasks, blockId)` (56-68) returns `{ worked, completed }` per block. Call it per block, then fold:
- **done** = links with `completed` in this session's blocks
- **not done** = planned or worked links whose task is still open; the default action is `next` if the task was worked in the last focus block, otherwise `later`
- **later** = tasks with `later && !archived && !completed`

Stat chips come from `BlockRecord` (`outcome`, `addedSeconds`, `actualSeconds`). Format with `formatDuration` and `formatRange` (`lib/plan/plan.ts`).

**Critical seam (finish snapshot):** `finish()` in `lib/blocks/blocks.ts` (~289) returns `{ ...createRun(newSessionId, seed), completed: true }`. That replaces `blocks` and `sessionId`. `usePlanSync` then sees the sessionId change and calls `closePlan`, which sends DELETE /user/plan for accounts and clears `links` (guests append them to `befocus.taskLinkHistory` first). So the summary cannot read the live timer or plan store after finishing. Either snapshot `{ sessionId, blocks, links }` from the `prev` state in a timer subscriber at the `completed` transition, or rebuild from records + link history keyed by the previous sessionId. The snapshot is simpler and works for both modes. History rebuilds from storage or the server.

### `apps/next/src/lib/logs/insights.ts` (rules, pure)

**Analog:** `lib/plan/strip.ts` (a small pure export plus its check). The signature should look like `insights(sessions: SessionDigest[], now: number): Insight[]`, where `Insight = { id, sentence, series: number[] }`. It takes the 14-day window, returns `[]` below 3 finished sessions, and caps the result at 3. Inject `now` so that the check is deterministic.

### `apps/next/src/lib/logs/export.ts` (pure)

**Analog:** `formatDuration(minutes)` returns "25 min" or "2 h 55 min". `formatRange(start, end)` uses `Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })` and returns "09:00 - 10:44". Both are in `lib/plan/plan.ts`. Exports: `toMarkdown(summary)` and `toText(summary)`, where the text version is the same lines without the markdown syntax. Build both from one line model.

### `apps/next/src/lib/logs/carry.ts` (pure + storage)

**Analog:** `planTask(links, taskId, blockId | null)` (`lib/plan/plan.ts` 117-137) and `seedFromSettings(settings, newId?)`. Signature: `applyCarry(links, carry: string[], firstFocusBlockId)` applies `planTask` once per task id. The pending list is stored at `befocus.carryNext` for guests. Accounts store it there too, keyed per user (`befocus.carryNext.${userId}`, the same idea as `queueKey`), or in the store. It is per device either way. Note that tradeoff in the plan.

### `apps/next/src/lib/logs/*.check.ts` (tests)

**Analog:** `lib/plan/strip.check.ts`.
```ts
// Runnable self-check ... Run with: bun run src/lib/plan/strip.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
...
console.log('strip.check OK')
```
`plan.check.ts` contributes the deterministic `at()` time helper and the `newId` counter (lines 1-2 header).

---

### `apps/next/src/lib/server/getUserHistory.ts` (server loader)

**Analog:** `lib/server/getUserTasks.ts`.
```ts
const cookie = (await headers()).get('cookie')
if (!cookie) return null
const { data, error } = await betterFetch<T>(`${env.API_URL}/user/blocks`, { headers: { cookie } })
if (error) { console.error('getUserHistory failed', { status: error.status }); return null }
```
A `null` result also means "guest", so `/log` can choose its mode from it.

---

### `apps/next/src/hooks/useLogs.ts` (hook, optimistic CRUD)

**Analog:** `hooks/useTasks.ts` `useTaskActions().update(id, patch)`. It applies the store change optimistically, returns early for guests (the provider persists), awaits `pendingCreates`, and calls `api.user.tasks[':id'].$put`. On failure it rolls back and calls `failToast(text)` from `lib/tasks/task-writes.ts`:
```ts
const message = `Couldn't save ${text}. Check your connection and try again.`
toast.error(message, { id: message })
```
Serialize writes the way `writeLinks` does in `hooks/usePlan.ts` (one chained promise per store), so that rapid edits of the same log cannot reorder.

### `apps/next/src/hooks/useHistory.ts` (hook, query)

**Analog:** `useUserTasks` in `hooks/useTasks.ts`, a `useQuery` calling the typed `api` client from `lib/api.client.ts`. For guests, read `logs-storage` + `GUEST_RECORDS_KEY` + `GUEST_LINK_HISTORY_KEY` synchronously instead (no query). Seed the initial data from the server loader so there is no flash (the server-fetched-then-hydrate rule in CLAUDE.md).

### `apps/next/src/hooks/useBreakLog.ts` (hook, event-driven)

**Analog:** `usePlanSync` in `hooks/usePlan.ts` (378-487). It subscribes to the timer store, keeps `prev` and `last`, and announces "Break started" when `currentBlockId` changes while `status === 'running'` and the new block is a break. Open the modal at exactly that spot, for the focus block that just ended (`prev` current block), and only when `askAtBreak` is on. `useEndedCues.ts` is a smaller example of the same effect-on-transition subscription (`status`, `currentBlockId`, `endedAt`). Put the `completed` snapshot (see summary.ts) in the same subscriber.

### `apps/next/src/hooks/useTasks.ts` (mod)

**Analog:** `archive` in the same file:
```ts
archive: id => { void assignTask(id, null); return update(id, { archived: true }) },
// add:
setLater: id => { void assignTask(id, null); return update(id, { later: true }) },
```
Widen the patch type to `Partial<Pick<Task, 'text' | 'completed' | 'archived' | 'later'>>`. On guests, set `laterAt` client-side inside `patchTask`.

### `apps/next/src/hooks/usePlan.ts` (mod)

- **Carry seeding:** in `closePlan(store, timer)` (330-376), right after the `seedFromSettings` reseed, read the pending carry list. Apply `planTask` into the first focus block id, write it through `writeLinks`, then clear the list.
- **Break "Move to":** reuse `usePlanActions().assignTask(taskId, blockId | null)` (~273-299). It already does `planTask`, announces "moved to Block N", calls `writeLinks`, and rolls back with `failToast`. Do not add a second re-plan path.
- **Ticks:** write the Phase 9 completed link through the existing `completeTask` / `markDone` in `useTasks.ts`.

---

### `apps/next/src/components/logs/BreakLogModal.tsx` (component)

**Analog:** `components/settings/SessionCard.tsx` (the #122 restart-confirm style).
```tsx
<DialogPrimitive.Root open={open} onOpenChange={o => !o && skip()}>
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={styles.scrim} />
    <DialogPrimitive.Content className={styles.confirm}
      onOpenAutoFocus={e => { e.preventDefault(); textRef.current?.focus() }}>
      <DialogPrimitive.Title>...</DialogPrimitive.Title>
      <DialogPrimitive.Description>...</DialogPrimitive.Description>
      <DialogPrimitive.Close className={styles.x} aria-label='Close'>...</DialogPrimitive.Close>
      ...footer: styles.ghost (Skip), styles.primary (Save)
```
Radix already handles the focus trap, the restore, and Esc mapping to `onOpenChange(false)`, which equals Skip. Never touch the timer in the close path.

The break countdown inside the card reads the timer store the same way the timer does (`useTick` from `usePlan.ts`).

### `apps/next/src/components/logs/LogForm.tsx` (shared form)

- **Rating** (Scattered / Okay / Deep) and **Move to** (Block N ... Later): use `SegmentedControl({ name, legend, options, value, onChange })` from `customize/controls.tsx` (136-168). It is a radio fieldset (`styles.seg` / `segItem` / `segLabel`), so keyboard and screen reader support come built in.
- **Task ticks:** native checkbox or the `@repo/ui/checkbox`.
- **Block title meta:** `formatRange` + `plannedBlockNumber` from `lib/plan/plan.ts`.

### `apps/next/src/components/logs/SessionSummary.tsx` (replaces SessionCompleteModal)

**Existing:** `components/SessionCompleteModal.tsx`. An effect on `currentSession > sessions` runs a 5 s `confetti` interval, then `setShow` after 1 s; the modal says "Congratulations" and calls `resetAll()`. It is rendered by `app/(app)/page.tsx:15` and `app/guest/page.tsx:39`. `legacy()` in `lib/blocks/blocks.ts` (347-358) sets `currentSession = Math.max(sessions, focus.length) + 1` when `completed`, which is why that check works.

Keep the trigger condition (or `isFinished` from `lib/session/session.ts`) and `resetAll()` for "Start new session". Replace the interval with one `confetti({...})` call, guarded by `useReducedMotion()` from framer-motion.

**Stage takeover:** in `components/timer/Timer.tsx`, `const ended = status === 'ended'` (line 112) already switches the stage layout, and `strip` (line 47) stays on top. Add a `finished` branch that renders `<SessionSummary snapshot=... />` in place of the digits.

The same component renders a past session on `/log`. Feed it the snapshot or digest only, never a live store.

### `apps/next/src/components/logs/DoneList.tsx`

**Analog:** `components/tasks/ListTab.tsx` groups (210-283).
```tsx
<h3 className={records.sec}>Open <em>{open.length}</em></h3>
<ul className={styles.rows}>...</ul>
// Done heading: className={cn(records.sec, styles.later)}
// Archived: disclosure <button aria-expanded={...}> with <ChevronDown />
```
Use `AddRow` (exported from ListTab with `label` and `onAdd`) for "Add something you did". Each not-done row gets Next session / Later / Drop through `SegmentedControl`, mapped to carry.ts / `setLater` / `archive`.

### `apps/next/src/components/tasks/ListTab.tsx` (mod: Later group)

Add a `later` filter, `t.later && !t.archived && !t.completed`, and exclude those tasks from `open`. Render a heading styled like the Done group, `<h3 className={cn(records.sec, styles.later)}>Later <em>{n}</em></h3>`. The class name `styles.later` already exists, so check that its look fits. Show `laterAt` with `Intl` relative or short date formatting.

### `apps/next/src/components/logs/ExportMenu.tsx` (partial analog)

**Analog for the menu shell only:** `components/records/SoundOptions.tsx` (`DropdownMenu`, `DropdownMenuTrigger asChild`, `DropdownMenuContent`, `DropdownMenuItem` from `@repo/ui/dropdown-menu`).

There is no existing clipboard writer, Blob download or share code. The only near analogs are `URL.createObjectURL(blob)` in `AddSoundDialog.tsx:220` and the clipboard read in `RecordRoomBody.tsx:40`. Use the platform APIs directly:
- `navigator.clipboard.writeText` + `toast.success`
- `new Blob([text], { type })` + a temporary `<a download>` + `URL.revokeObjectURL`
- Share only `if (typeof navigator.share === 'function')`

### `apps/next/src/components/logs/InsightsPanel.tsx` / `HistoryList.tsx`

- **Switch:** `SegmentedControl` with options Insights · Charts · Both, persisted at `befocus.insightsView` through `readStored` / `writeStored`.
- **Bars:** copy `components/progress/MiniStrip.tsx`, a CSS row driven by `stripWidths` with `styles.mini` / `block` / `fill` / `plus` from `progress.module.css` and `data-kind` / `data-state`. The added-time hatch is `styles.plus` with a width %. Planned vs actual = outline block + fill + plus hatch.
- **History row:** end time, focus time, tasks done / total, `<MiniStrip>` and the first log line. Group by day with `Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })`.

### `apps/next/src/components/logs/LogButton.tsx` + `MenuSettings.tsx` / `MenuSettingsMobile.tsx`

**Analog:** `components/tasks/TasksButton.tsx`, a `MenuButton` + `Tooltip` with a hover / focus-visible guard and a lucide icon. Wrap it in a Next `Link href='/log'` (or `asChild`) for navigation.

Footer order is TasksButton, RecordsButton, SessionSettingsButton, CustomizeButton, AccountButton. Insert LogButton after TasksButton in both MenuSettings and MenuSettingsMobile.

### `apps/next/src/components/customize/sections/StyleSection.tsx` + `index.ts`

**Analog:** `SessionProgressSection` (45-67).
```tsx
<ControlGroup id='customize-session-progress' label='Session progress' value={...}>
  <SegmentedControl name=... legend=... options=... value=... onChange=... />
  <p style={{ fontSize: 13, lineHeight: 1.4, marginTop: 8, opacity: 0.6 }}>...</p>
</ControlGroup>
```
`controls.tsx` has no switch control. Copy the switch from `SessionCard.tsx`: a `role='switch'` `aria-checked` button with `className={styles.switch}` and `<span className={styles.track} aria-hidden />`. A two-option `SegmentedControl` (On / Off) also works and needs no new CSS. Register the section in the `CUSTOMIZE_SECTIONS` array (`sections/index.ts`) after `customize-session-progress`.

**Persistence choice (Q8 says "persisted the same way" as Session progress):**
- (a) **Look key, recommended.** Add `askAtBreak` to `lookSchema`. It saves via `PUT /user/themes/active` / `writeGuestLook` and gets the Customize preview/save flow for free (`useCustomizeStore.setPreview`). Cost: a behavior flag inside a visual look object, plus `lookEquals` / `DEFAULT_LOOK` updates. No migration.
- (b) **Settings column**, mirroring `askBeforeStart`: `settings.ts:16` + an 0010-style ALTER + a guest 0/1 key in `session.ts`, and the timer store field `askBeforeStart` (`useTimerStore.tsx` lines 60, 136, 171, `setAskBeforeStart`). Cost: a migration column and a second save path outside the Customize flow.

### `apps/next/src/components/logs/logs.module.css`

**Analog:** `settings/session-card.module.css`.
- Token block on `.card, .confirm` (3-13): `--panel-surface: color-mix(in srgb, var(--bg-solid), #fff 5%)`, `--panel-hair`, `--panel-ring`, `--btn: 36px` (44px under `pointer: coarse`).
- `.scrim` (194-204): fixed, `rgb(0 0 0 / 0.55)`, fade animation.
- `.confirm` (207+): fixed and centered, `width: min(400px, calc(100vw - 32px))`, `max-height: calc(100dvh - 32px)`, radius 18px, `box-shadow: 0 24px 60px ...`.

Wrap the animations in `@media (prefers-reduced-motion: reduce)` the way Phase 9 did (commits 7672780, fd991b3). The break card on phone is 358px, so set the width with `min(358px, ...)` under the phone breakpoint, or reuse the 400px min.

---

### `apps/next/src/app/log/page.tsx` + `layout.tsx` (page)

**Analogs:**
- `app/(app)/layout.tsx`: an async server layout that loads `[settings, tasks, plan] = await Promise.all([getUserSettings(), getUserTasks(), getUserPlan()])` and nests TimerStoreProvider (account), CustomizeStoreProvider, TasksStoreProvider, then children + CustomizePanel, RecordRoom, TasksCard, SessionCard.
- `app/guest/GuestShell.tsx`: the same stack in guest mode. `guest/layout.tsx` adds `LookPaintScript tokens={null}`.

Recommended layout: a top-level `app/log/` whose layout calls the loaders. A `null` cookie or result renders the GuestShell-style providers; otherwise it renders the account stack. Do not put the page under `(app)`, because that layout assumes a session. The page needs the tasks store (for done / not done actions) and the look paint. It does not need the timer.

### `apps/next/src/middleware.ts` (mod)

**Current logic:**
- `authRoutes`, `passwordRoutes`, `isHomeRoute = pathName === '/guest'`.
- Without a session: allow auth, password and home routes, otherwise redirect to `/guest`.
- With a session on home: redirect to `/`.
- Matcher: `'/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sounds|guest).*)'`.

**Change:** add `const isLogRoute = pathName === '/log' || pathName.startsWith('/log/')`. Return `NextResponse.next()` before both redirect branches. Leave the matcher alone so the session lookup still runs.

### `apps/next/src/app/(app)/page.tsx`, `app/guest/page.tsx`

Swap `<SessionCompleteModal />` (line 15 / line 39) for the summary mount, or drop it if `Timer.tsx` renders the summary inline. Mount `<BreakLogModal />` next to it in both pages.

## Shared Patterns

### Auth + owner scoping (all new API handlers)
**Source:** `routes/plan/plan.handler.ts`, `routes/blocks/blocks.handler.ts`
```ts
const user = c.get('user')
if (!user) return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
// every where: and(eq(t.userId, user.id), ...); every upsert: setWhere: eq(t.userId, user.id)
```
`requireAuth` on `*` in `lib/create-app.ts` gates the new routes automatically.

### Guest storage envelope (all browser persistence)
**Source:** `lib/storage/browser-storage.ts`, `lib/blocks/block-records.ts`, `lib/tasks/tasks-storage.ts`.
Read `z.array(z.unknown())`, `safeParse` each item, dedupe or upsert by id, and cap with `.slice(-cap)`. New fields are optional so that old data still parses. All storage goes through `readStored` / `writeStored`; never call `localStorage` directly.

### Optimistic write + rollback + toast (all account mutations)
**Source:** `hooks/useTasks.ts` `update`, `hooks/usePlan.ts` `writeLinks` / `assignTask`, `lib/tasks/task-writes.ts` `failToast`, `whenTaskSaved`.

### Pure function + `*.check.ts` (summary, insights, export, carry)
**Source:** `lib/plan/strip.check.ts`, `lib/plan/plan.check.ts`, `routes/blocks/blocks.check.ts`. Use `node:assert/strict`, deterministic ids and time, and finish with a `console.log('<name>.check OK')`. Run with `bun run` from the package dir.

### Modal card (break log; any confirm)
**Source:** `components/settings/SessionCard.tsx` + `session-card.module.css` (`.scrim`, `.confirm`, `.x`, `.ghost`, `.primary`, `.switch`, `.track`).

### Reduced motion
**Source:** `components/tasks/TasksCard.tsx` (`useReducedMotion` + `motion.section`), plus the Phase 9 fixes 7672780 and fd991b3, which open popovers and sheets without animation under reduced motion. Apply this to the confetti burst, the modal open, and the summary takeover.

### Segmented choice controls
**Source:** `customize/controls.tsx` `SegmentedControl` (136-168). Use it for the rating, Move to, Next session / Later / Drop, and Insights · Charts · Both.

### Formatting
**Source:** `lib/plan/plan.ts` `formatDuration`, `formatClock`, `formatRange`. Use `Intl` only, with no date library.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `components/logs/ExportMenu.tsx` (actions) | component | file-I/O | No clipboard write, Blob download or `navigator.share` code exists. Use the platform APIs from CONTEXT Q6. Only the menu shell has an analog (`SoundOptions.tsx`). |
| `components/logs/InsightsPanel.tsx` 5-week calendar | component | read | No calendar grid exists. Use a CSS grid of 35 cells with `data-*` intensity in the `progress.module.css` cell style. |
| `lib/logs/insights.ts` rule set | utility | transform | No rules engine exists. Shape only from `strip.ts`. Thresholds are Claude's discretion and each rule must carry its evidence series. |
| Single-burst confetti | component | - | The only existing use is the 5 s interval in `SessionCompleteModal.tsx`. Use one `confetti()` call, skipped under `useReducedMotion()`. |

## Metadata

**Analog search scope:** `packages/api/src/{db,routes,lib}`, `packages/types`, `apps/next/src/{app,components,hooks,lib,store}`, `apps/next/src/middleware.ts`, `packages/ui/src/components/ui`
**Files scanned:** ~70
**Pattern extraction date:** 2026-10-21
