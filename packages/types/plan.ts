// ~/types/plan.ts - shared plan contracts (zod, no React)
import { z } from 'zod'

export const PLAN_LIMITS = { maxFocus: 16, minMinutes: 5, maxMinutes: 90, step: 5 } as const

export const planBlockSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['focus', 'break']),
  minutes: z.number().int().min(1).max(90),
})

/**
 * Focus and break alternate, first and last are focus, ids are unique, at most 16 focus blocks.
 * Focus minutes are any integer 5-90 (no multiple-of-5 rule) so seeds from any Session setting
 * stay valid; the nudge steps by 5 from there.
 */
export const planBlocksSchema = z
  .array(planBlockSchema)
  .min(1)
  .max(PLAN_LIMITS.maxFocus * 2 - 1)
  .superRefine((blocks, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message })
    if (blocks[0]?.kind !== 'focus') issue('A plan starts with a focus block')
    if (blocks[blocks.length - 1]?.kind !== 'focus') issue('A plan ends with a focus block')
    if (blocks.some((b, i) => i > 0 && b.kind === blocks[i - 1]?.kind)) {
      issue('Focus and break blocks alternate')
    }
    if (new Set(blocks.map(b => b.id)).size !== blocks.length) issue('Block ids are unique')
    const focus = blocks.filter(b => b.kind === 'focus')
    if (focus.length > PLAN_LIMITS.maxFocus) issue('At most 16 focus blocks')
    if (focus.some(b => b.minutes < PLAN_LIMITS.minMinutes)) issue('Focus blocks are 5-90 minutes')
  })

export const taskPlanSchema = z.object({
  sessionId: z.string().uuid(),
  blocks: planBlocksSchema,
  // Set once the plan's first block starts, so a session reset never adopts a plan whose block
  // ids already have records.
  wentLive: z.boolean().default(false),
})

export type PlanBlock = z.infer<typeof planBlockSchema>
export type TaskPlan = z.infer<typeof taskPlanSchema>

/** Client shape; server task ids are stringified like tasks. */
export interface TaskLink {
  blockId: string
  taskId: string
  planned: boolean
  worked: boolean
  completed: boolean
  workedAt: string | null
  completedAt: string | null
}
