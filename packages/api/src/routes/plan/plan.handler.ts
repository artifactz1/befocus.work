import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { eq } from 'drizzle-orm'
import { type TaskPlanRow, taskPlans } from '../../db/tables/plans'
import type { DeleteUserPlan, GetUserPlan, PutUserPlan } from './plan.route'

const toResponse = (row: TaskPlanRow) => ({
  sessionId: row.sessionId,
  blocks: row.blocks,
  wentLive: row.wentLive,
  updatedAt: row.updatedAt.toISOString(),
})

// Every query filters on the session user; the owner is never part of the body.
export const getUserPlan: AppRouteHandler<GetUserPlan> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const [row] = await db.select().from(taskPlans).where(eq(taskPlans.userId, user.id))
  // links stay empty until 09-06 adds the task link table
  return c.json({ plan: row ? toResponse(row) : null, links: [] }, HttpStatusCodes.OK)
}

export const putUserPlan: AppRouteHandler<PutUserPlan> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const body = c.req.valid('json')
  const values = { sessionId: body.sessionId, blocks: body.blocks, wentLive: body.wentLive }
  const [row] = await db
    .insert(taskPlans)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: taskPlans.userId, set: { ...values, updatedAt: new Date() } })
    .returning()

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
