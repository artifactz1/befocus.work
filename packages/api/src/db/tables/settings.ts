import type { InferSelectModel } from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { user } from './auth'

export const sessionSettings = pgTable('sessionSettings', {
  id: text('id').primaryKey(),
  workDuration: integer('work_duration').notNull(),
  breakDuration: integer('break_duration').notNull(),
  numberOfSessions: integer('number_of_sessions').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
})

export type Settings = InferSelectModel<typeof sessionSettings>

export const getUserSettingsSchema = createSelectSchema(sessionSettings)
