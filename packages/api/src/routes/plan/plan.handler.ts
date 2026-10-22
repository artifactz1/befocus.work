import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { and, asc, eq, inArray, ne, or } from 'drizzle-orm'
import {
  type TaskBlockLinkRow,
  type TaskPlanRow,
  taskBlockLinks,
  taskPlans,
} from '../../db/tables/plans'
import { tasks } from '../../db/tables/tasks'
import type {
  DeleteUserPlan,
  GetUserBlockTasks,
  GetUserPlan,
  PutUserPlan,
  PutUserTaskLinks,
} from './plan.route'

const toResponse = (row: TaskPlanRow) => ({
  sessionId: row.sessionId,
  blocks: row.blocks,
  wentLive: row.wentLive,
  updatedAt: row.updatedAt.toISOString(),
})

const toLink = (row: TaskBlockLinkRow) => ({
  blockId: row.blockId,
  taskId: row.taskId,
  planned: row.planned,
  worked: row.worked,
  completed: row.completed,
  workedAt: row.workedAt?.toISOString() ?? null,
  completedAt: row.completedAt?.toISOString() ?? null,
})

// Every query filters on the session user; the owner is never part of the body.
export const getUserPlan: AppRouteHandler<GetUserPlan> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const [row] = await db.select().from(taskPlans).where(eq(taskPlans.userId, user.id))
  const links = row
    ? await db
        .select()
        .from(taskBlockLinks)
        .where(
          and(
            eq(taskBlockLinks.userId, user.id),
            inArray(
              taskBlockLinks.blockId,
              row.blocks.map(b => b.id),
            ),
          ),
        )
    : []
  return c.json(
    { plan: row ? toResponse(row) : null, links: links.map(toLink) },
    HttpStatusCodes.OK,
  )
}

export const putUserPlan: AppRouteHandler<PutUserPlan> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const body = c.req.valid('json')
  const values = { sessionId: body.sessionId, blocks: body.blocks, wentLive: body.wentLive }
  const now = new Date()

  // Blocks the previous plan had and this one drops release their tasks in the same batch.
  // Scoping to the previous plan keeps closed sessions' links intact as history.
  const [previous] = await db.select().from(taskPlans).where(eq(taskPlans.userId, user.id))
  const kept = new Set(body.blocks.map(b => b.id))
  const droppedIds = (previous?.blocks ?? []).map(b => b.id).filter(id => !kept.has(id))

  const upsert = db
    .insert(taskPlans)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: taskPlans.userId, set: { ...values, updatedAt: now } })
    .returning()
  const [[row]] =
    droppedIds.length > 0
      ? await db.batch([
          upsert,
          db
            .update(taskBlockLinks)
            .set({ planned: false, updatedAt: now })
            .where(
              and(
                eq(taskBlockLinks.userId, user.id),
                eq(taskBlockLinks.planned, true),
                inArray(taskBlockLinks.blockId, droppedIds),
              ),
            ),
        ])
      : [await upsert]

  if (!row) throw new Error('task_plans upsert returned no row')
  return c.json({ plan: toResponse(row) }, HttpStatusCodes.OK)
}

export const deleteUserPlan: AppRouteHandler<DeleteUserPlan> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  await db.delete(taskPlans).where(eq(taskPlans.userId, user.id))
  return c.body(null, HttpStatusCodes.NO_CONTENT)
}

export const putUserTaskLinks: AppRouteHandler<PutUserTaskLinks> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const { links } = c.req.valid('json')
  const [plan] = await db.select().from(taskPlans).where(eq(taskPlans.userId, user.id))
  if (!plan) return c.json({ message: 'No open plan' }, HttpStatusCodes.NOT_FOUND)

  const planBlockIds = plan.blocks.map(b => b.id)
  if (links.some(l => !planBlockIds.includes(l.blockId))) {
    return c.json({ message: 'Block not in the open plan' }, HttpStatusCodes.NOT_FOUND)
  }

  // Ownership: every task id must be one of the caller's tasks before any link write.
  const taskIds = [...new Set(links.map(l => l.taskId))]
  const owned = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), inArray(tasks.id, taskIds)))
  if (owned.length !== taskIds.length) {
    return c.json({ message: 'Task not found' }, HttpStatusCodes.NOT_FOUND)
  }

  // Timestamps are server-only. completed forces worked; worked marks the latest work time.
  const now = new Date()
  const statements = links.flatMap(item => {
    const flags: Partial<typeof taskBlockLinks.$inferInsert> = {}
    if (item.planned !== undefined) flags.planned = item.planned
    if (item.worked === true || item.completed === true) {
      flags.worked = true
      flags.workedAt = now
    } else if (item.worked === false) {
      flags.worked = false
      flags.workedAt = null
    }
    if (item.completed === true) {
      flags.completed = true
      flags.completedAt = now
    } else if (item.completed === false) {
      flags.completed = false
      flags.completedAt = null
    }
    const upsert = db
      .insert(taskBlockLinks)
      .values({ userId: user.id, blockId: item.blockId, taskId: item.taskId, ...flags })
      .onConflictDoUpdate({
        target: [taskBlockLinks.blockId, taskBlockLinks.taskId],
        set: { ...flags, updatedAt: now },
        setWhere: eq(taskBlockLinks.userId, user.id),
      })
    if (item.planned !== true) return [upsert]
    // planning a Later task into a block clears its flag
    const clearLater = db
      .update(tasks)
      .set({ later: false, laterAt: null })
      .where(and(eq(tasks.userId, user.id), eq(tasks.id, item.taskId)))
    // a task is planned in at most one block
    const unplanOthers = db
      .update(taskBlockLinks)
      .set({ planned: false, updatedAt: now })
      .where(
        and(
          eq(taskBlockLinks.userId, user.id),
          eq(taskBlockLinks.taskId, item.taskId),
          inArray(taskBlockLinks.blockId, planBlockIds),
          ne(taskBlockLinks.blockId, item.blockId),
        ),
      )
    return [upsert, unplanOthers, clearLater]
  })

  const read = db
    .select()
    .from(taskBlockLinks)
    .where(and(eq(taskBlockLinks.userId, user.id), inArray(taskBlockLinks.blockId, planBlockIds)))
  const results = await db.batch([...statements, read] as unknown as [
    typeof read,
    ...(typeof read)[],
  ])
  const rows = results[results.length - 1] as TaskBlockLinkRow[]
  return c.json({ links: rows.map(toLink) }, HttpStatusCodes.OK)
}

// No plan lookup: the record stays readable after the plan closes.
export const getUserBlockTasks: AppRouteHandler<GetUserBlockTasks> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const { blockId } = c.req.valid('query')
  const rows = await db
    .select({
      taskId: tasks.id,
      text: tasks.text,
      worked: taskBlockLinks.worked,
      completed: taskBlockLinks.completed,
      workedAt: taskBlockLinks.workedAt,
      completedAt: taskBlockLinks.completedAt,
    })
    .from(taskBlockLinks)
    .innerJoin(tasks, eq(tasks.id, taskBlockLinks.taskId))
    .where(
      and(
        eq(taskBlockLinks.userId, user.id),
        eq(tasks.userId, user.id),
        eq(taskBlockLinks.blockId, blockId),
        or(eq(taskBlockLinks.worked, true), eq(taskBlockLinks.completed, true)),
      ),
    )
    .orderBy(asc(taskBlockLinks.workedAt))
  return c.json(
    {
      tasks: rows.map(r => ({
        ...r,
        workedAt: r.workedAt?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
    },
    HttpStatusCodes.OK,
  )
}
