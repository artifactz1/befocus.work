import type { InferSelectModel } from 'drizzle-orm'
import {
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { type CarriedTask, FOCUS_RATINGS } from '../../../../types/logs'
import { user } from './auth'

// One log per block. No FK on block_id: records arrive later through the Phase 8 queue, so a log
// can land before its record. The relative types import is deliberate: drizzle-kit resolves no
// tsconfig paths.
export const blockLogs = pgTable(
  'block_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    blockId: uuid('block_id').notNull(),
    sessionId: uuid('session_id').notNull(),
    text: text('text').notNull().default(''),
    rating: text('rating', { enum: FOCUS_RATINGS }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  t => [
    unique('block_logs_user_block').on(t.userId, t.blockId),
    index('block_logs_user_session').on(t.userId, t.sessionId),
  ],
)

// One note per (user, session). A row also marks the session as finished in history.
export const sessionNotes = pgTable(
  'session_notes',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    nextTime: text('next_time').notNull().default(''),
    extraDone: jsonb('extra_done').$type<string[]>().notNull().default([]),
    carried: jsonb('carried').$type<CarriedTask[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  t => [unique('session_notes_user_session').on(t.userId, t.sessionId)],
)

export type BlockLogRow = InferSelectModel<typeof blockLogs>
export type SessionNoteRow = InferSelectModel<typeof sessionNotes>

export const selectBlockLogSchema = createSelectSchema(blockLogs)
export const selectSessionNoteSchema = createSelectSchema(sessionNotes)
