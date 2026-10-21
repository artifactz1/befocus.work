import { type TaskLink, type TaskPlan, taskPlanSchema } from '@repo/types/plan'
import { TASK_TEXT_MAX, type Task } from '@repo/types/tasks'
import { z } from 'zod'

export const GUEST_TASKS_KEY = 'befocus.tasks'
const MAX_TASKS = 1000

const guestTaskSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(TASK_TEXT_MAX),
  completed: z.boolean(),
  archived: z.boolean(),
  createdAt: z.string().datetime().optional(),
})

// Items stay unknown here so one bad item cannot discard its valid siblings.
export const guestTasksSchema = z.object({
  version: z.literal(1),
  tasks: z.array(z.unknown()).max(5000),
})

/** Guest storage is untrusted: this is the only path from it to Task objects. */
export function parseGuestTasks(raw: unknown): Task[] {
  const env = guestTasksSchema.safeParse(raw)
  if (!env.success) return []
  const seen = new Set<string>()
  const out: Task[] = []
  for (const item of env.data.tasks) {
    const t = guestTaskSchema.safeParse(item)
    if (!t.success || seen.has(t.data.id)) continue
    seen.add(t.data.id)
    out.push(t.data)
    if (out.length === MAX_TASKS) break
  }
  return out
}

export function toGuestTasks(tasks: Task[]) {
  return { version: 1 as const, tasks }
}

export const GUEST_PLAN_KEY = 'befocus.plan'
const MAX_LINKS = 512

export const guestPlanSchema = z.object({
  version: z.literal(1),
  plan: z.unknown(),
  links: z.array(z.unknown()).max(5000),
})

const guestLinkSchema = z.object({
  blockId: z.string().uuid(),
  taskId: z.string().min(1),
  planned: z.boolean(),
  worked: z.boolean(),
  completed: z.boolean(),
  workedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
})

/** Guest storage is untrusted: this is the only path from it to a plan and its links. */
export function parseGuestPlan(raw: unknown): { plan: TaskPlan | null; links: TaskLink[] } {
  const env = guestPlanSchema.safeParse(raw)
  if (!env.success) return { plan: null, links: [] }
  const plan = taskPlanSchema.safeParse(env.data.plan)
  if (!plan.success) return { plan: null, links: [] }
  const blockIds = new Set(plan.data.blocks.map(b => b.id))
  const links: TaskLink[] = []
  for (const item of env.data.links) {
    const l = guestLinkSchema.safeParse(item)
    if (!l.success || !blockIds.has(l.data.blockId)) continue
    links.push(l.data)
    if (links.length === MAX_LINKS) break
  }
  return { plan: plan.data, links }
}

export function toGuestPlan(plan: TaskPlan, links: TaskLink[]) {
  return { version: 1 as const, plan, links }
}
