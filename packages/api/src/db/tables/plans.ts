import { z } from '@hono/zod-openapi'
import type { InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { type PlanBlock, planBlocksSchema } from '../../../../types/plan'
import { user } from './auth'
import { tasks } from './tasks'

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

// Join table: which task is planned, worked on or completed in which block. No FK on block_id:
// block ids live in the plan jsonb and in focus block records, and links outlive a closed plan
// as history.
export const taskBlockLinks = pgTable(
  'task_block_links',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    blockId: uuid('block_id').notNull(),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    planned: boolean('planned').notNull().default(false),
    worked: boolean('worked').notNull().default(false),
    completed: boolean('completed').notNull().default(false),
    workedAt: timestamp('worked_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  t => [
    unique('task_block_links_block_task').on(t.blockId, t.taskId),
    index('task_block_links_user_block').on(t.userId, t.blockId),
  ],
)

export type TaskBlockLinkRow = InferSelectModel<typeof taskBlockLinks>

export const linkResponseSchema = createSelectSchema(taskBlockLinks, {
  workedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
}).pick({
  blockId: true,
  taskId: true,
  planned: true,
  worked: true,
  completed: true,
  workedAt: true,
  completedAt: true,
})

// Flags only: owner and timestamps are set by the server.
export const putTaskLinksSchema = z.object({
  links: z
    .array(
      z
        .object({
          blockId: z.string().uuid(),
          taskId: z.number().int().positive(),
          planned: z.boolean().optional(),
          worked: z.boolean().optional(),
          completed: z.boolean().optional(),
        })
        .refine(
          l => l.planned !== undefined || l.worked !== undefined || l.completed !== undefined,
          {
            message: 'Send at least one flag',
          },
        ),
    )
    .min(1)
    .max(64),
})

export const getPlanSchema = z.object({
  plan: planResponseSchema.nullable(),
  links: z.array(linkResponseSchema),
})
