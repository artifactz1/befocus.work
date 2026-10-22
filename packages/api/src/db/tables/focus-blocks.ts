import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { BLOCK_KINDS, BLOCK_OUTCOMES } from '../../../../types/blocks'
import { user } from './auth'

// One row per finished/skipped/reset block. The id is the client's uuid (no default) so retries and
// re-runs upsert the same row. The relative blocks import is deliberate: drizzle-kit resolves no
// tsconfig paths.
export const focusBlocks = pgTable(
  'focus_blocks',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    kind: text('kind', { enum: BLOCK_KINDS }).notNull(),
    index: integer('block_index').notNull(),
    plannedSeconds: integer('planned_seconds').notNull(),
    actualSeconds: integer('actual_seconds').notNull(),
    addedSeconds: integer('added_seconds').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
    outcome: text('outcome', { enum: BLOCK_OUTCOMES }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  t => [
    index('focus_blocks_user_session_idx').on(t.userId, t.sessionId),
    index('focus_blocks_user_started_idx').on(t.userId, t.startedAt),
  ],
)

export type FocusBlock = InferSelectModel<typeof focusBlocks>

export const selectFocusBlockSchema = createSelectSchema(focusBlocks)
export const insertFocusBlockSchema = createInsertSchema(focusBlocks)
