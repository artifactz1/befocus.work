import { z } from '@hono/zod-openapi'
import type { InferSelectModel } from 'drizzle-orm'
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type PlanBlock, planBlocksSchema } from '../../../../types/plan'
import { user } from './auth'

// One row per user is the "one open plan at a time" rule. The relative types import is deliberate:
// drizzle-kit resolves no tsconfig paths.
export const taskPlans = pgTable('task_plans', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull(),
  blocks: jsonb('blocks').$type<PlanBlock[]>().notNull(),
  wentLive: boolean('went_live').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type TaskPlanRow = InferSelectModel<typeof taskPlans>

// Picking drops userId and updatedAt so the client can never set them.
export const putPlanSchema = createInsertSchema(taskPlans, {
  blocks: planBlocksSchema,
  sessionId: schema => schema.uuid(),
}).pick({ sessionId: true, blocks: true, wentLive: true })

export const planResponseSchema = createSelectSchema(taskPlans, { blocks: planBlocksSchema })
  .pick({ sessionId: true, blocks: true, wentLive: true })
  .extend({ updatedAt: z.string() })

// 09-06 replaces this with the select schema of its link table and fills the array.
export const linkResponseSchema = z.object({
  blockId: z.string().uuid(),
  taskId: z.number().int(),
  planned: z.boolean(),
  worked: z.boolean(),
  completed: z.boolean(),
  workedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
})

export const getPlanSchema = z.object({
  plan: planResponseSchema.nullable(),
  links: z.array(linkResponseSchema),
})
