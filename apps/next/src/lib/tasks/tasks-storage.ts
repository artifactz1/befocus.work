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
