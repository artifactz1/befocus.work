import type { InferSelectModel } from 'drizzle-orm'
import { boolean, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { user } from './auth'
import { themes } from './themes'

export const sessionSettings = pgTable(
  'sessionSettings',
  {
    id: text('id').primaryKey(),
    workDuration: integer('work_duration').notNull(),
    breakDuration: integer('break_duration').notNull(),
    numberOfSessions: integer('number_of_sessions').notNull(),
    askBeforeStart: boolean('ask_before_start').notNull().default(true),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    activeThemeId: uuid('active_theme_id').references(() => themes.id, { onDelete: 'set null' }),
  },
  t => [uniqueIndex('session_settings_user_id_unique').on(t.userId)],
)

export type Settings = InferSelectModel<typeof sessionSettings>

// Schemas
export const getUserSettingsSchema = createSelectSchema(sessionSettings)

// Sanity bounds in seconds, wider than the UI limits so the command menu keeps working.
const bounds = {
  workDuration: (schema: z.ZodNumber) => schema.int().min(60).max(14400),
  breakDuration: (schema: z.ZodNumber) => schema.int().min(60).max(14400),
  numberOfSessions: (schema: z.ZodNumber) => schema.int().min(1).max(24),
}

export const createUserSettingsSchema = createInsertSchema(sessionSettings, bounds).omit({
  id: true,
  userId: true,
  activeThemeId: true,
})
export const updateUserSettingsSchema = createUpdateSchema(sessionSettings, bounds).omit({
  id: true,
  userId: true,
  activeThemeId: true,
})
