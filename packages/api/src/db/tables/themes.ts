import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { Look } from '../../../../types/look'
import { user } from './auth'

// One row per saved look. Phase 3 writes only the active one (sessionSettings.active_theme_id).
// The relative Look import is deliberate: drizzle-kit resolves no tsconfig paths.
export const themes = pgTable(
  'themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('My look'),
    look: jsonb('look').$type<Look>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  t => [index('themes_user_id_idx').on(t.userId)],
)

export type Theme = InferSelectModel<typeof themes>
