// schema/todo.ts
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import type { InferSelectModel } from 'drizzle-orm'
import { user } from './auth'

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  editMode: boolean('edit_mode').notNull().default(false),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// Types
export type Task = InferSelectModel<typeof tasks>

// Zod Schemas
export const getTaskSchema = createSelectSchema(tasks)

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  editMode: true,
  createdAt: true, // let DB handle the timestamp
})

export const updateTaskSchema = createUpdateSchema(tasks).omit({
  id: true,
  userId: true,
  createdAt: true, // prevent updating created timestamp
})
