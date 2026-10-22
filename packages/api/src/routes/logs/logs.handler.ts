import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm'
import type { BlockRecord } from '../../../../types/blocks'
import type { BlockLog, SessionNote } from '../../../../types/logs'
import { focusBlocks } from '../../db/tables/focus-blocks'
import { blockLogs, sessionNotes } from '../../db/tables/logs'
import { taskBlockLinks } from '../../db/tables/plans'
import { tasks } from '../../db/tables/tasks'
import type {
  GetUserHistory,
  PutUserBlockLinks,
  PutUserBlockLogs,
  PutUserSessionNotes,
} from './logs.route'

const DAY_MS = 86_400_000
const HISTORY_RECORD_CAP = 2000

const toLog = (row: typeof blockLogs.$inferSelect): BlockLog => ({
  blockId: row.blockId,
  sessionId: row.sessionId,
  text: row.text,
  rating: row.rating,
})

const toNote = (row: typeof sessionNotes.$inferSelect): SessionNote => ({
  sessionId: row.sessionId,
  nextTime: row.nextTime,
  extraDone: row.extraDone,
  carried: row.carried,
})

const unauthorized = { message: HttpStatusPhrases.UNAUTHORIZED }

export const putUserBlockLogs: AppRouteHandler<PutUserBlockLogs> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) return c.json(unauthorized, HttpStatusCodes.UNAUTHORIZED)

  const { blockId, sessionId, text, rating } = c.req.valid('json')
  const [row] = await db
    .insert(blockLogs)
    .values({ userId: user.id, blockId, sessionId, text, rating })
    .onConflictDoUpdate({
      target: [blockLogs.userId, blockLogs.blockId],
      set: { text, rating, sessionId, updatedAt: new Date() },
      setWhere: eq(blockLogs.userId, user.id),
    })
    .returning()
  if (!row) throw new Error('block_logs upsert returned no row')
  return c.json(toLog(row), HttpStatusCodes.OK)
}

export const putUserBlockLinks: AppRouteHandler<PutUserBlockLinks> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) return c.json(unauthorized, HttpStatusCodes.UNAUTHORIZED)

  const { links } = c.req.valid('json')

  // Ownership: every task id must be one of the caller's tasks before any write.
  const ids = [...new Set(links.map(l => l.taskId))]
  const owned = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), inArray(tasks.id, ids)))
  if (owned.length !== ids.length) {
    return c.json({ message: 'Task not found' }, HttpStatusCodes.NOT_FOUND)
  }

  // Same completed / completedAt columns and tasks.completed as Phase 9: one completion state.
  const now = new Date()
  const statements = links.flatMap(item => {
    const completedAt = item.completed ? now : null
    return [
      db
        .insert(taskBlockLinks)
        .values({
          userId: user.id,
          blockId: item.blockId,
          taskId: item.taskId,
          worked: true,
          completed: item.completed,
          workedAt: now,
          completedAt,
        })
        .onConflictDoUpdate({
          target: [taskBlockLinks.blockId, taskBlockLinks.taskId],
          set: { completed: item.completed, completedAt, updatedAt: now },
          setWhere: eq(taskBlockLinks.userId, user.id),
        }),
      db
        .update(tasks)
        .set({ completed: item.completed })
        .where(and(eq(tasks.userId, user.id), eq(tasks.id, item.taskId))),
    ]
  })

  const read = db
    .select()
    .from(taskBlockLinks)
    .where(
      and(
        eq(taskBlockLinks.userId, user.id),
        inArray(taskBlockLinks.blockId, [...new Set(links.map(l => l.blockId))]),
        inArray(taskBlockLinks.taskId, ids),
      ),
    )
  const results = await db.batch([...statements, read] as unknown as [
    typeof read,
    ...(typeof read)[],
  ])
  const rows = results[results.length - 1] as (typeof taskBlockLinks.$inferSelect)[]
  return c.json(
    {
      links: rows.map(r => ({
        blockId: r.blockId,
        taskId: String(r.taskId),
        completed: r.completed,
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
    },
    HttpStatusCodes.OK,
  )
}

export const putUserSessionNotes: AppRouteHandler<PutUserSessionNotes> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) return c.json(unauthorized, HttpStatusCodes.UNAUTHORIZED)

  const { sessionId, nextTime, extraDone, carried } = c.req.valid('json')
  const [row] = await db
    .insert(sessionNotes)
    .values({ userId: user.id, sessionId, nextTime, extraDone, carried })
    .onConflictDoUpdate({
      target: [sessionNotes.userId, sessionNotes.sessionId],
      set: { nextTime, extraDone, carried, updatedAt: new Date() },
      setWhere: eq(sessionNotes.userId, user.id),
    })
    .returning()
  if (!row) throw new Error('session_notes upsert returned no row')
  return c.json(toNote(row), HttpStatusCodes.OK)
}

export const getUserHistory: AppRouteHandler<GetUserHistory> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  if (!user) return c.json(unauthorized, HttpStatusCodes.UNAUTHORIZED)

  const query = c.req.valid('query')
  const before = query.before ? new Date(query.before) : new Date()
  const start = new Date(before.getTime() - query.days * DAY_MS)

  // Is there anything older than this window? Gives the cursor for the next page.
  const [older] = await db
    .select({ id: focusBlocks.id })
    .from(focusBlocks)
    .where(and(eq(focusBlocks.userId, user.id), lt(focusBlocks.startedAt, start)))
    .limit(1)
  const nextBefore = older ? start.toISOString() : null

  // Sessions are picked by any record starting in the window; all their records come back.
  const sessions = await db
    .selectDistinct({ sessionId: focusBlocks.sessionId })
    .from(focusBlocks)
    .where(
      and(
        eq(focusBlocks.userId, user.id),
        gte(focusBlocks.startedAt, start),
        lt(focusBlocks.startedAt, before),
      ),
    )
  const sessionIds = sessions.map(s => s.sessionId)
  if (sessionIds.length === 0) {
    return c.json({ records: [], logs: [], notes: [], links: [], nextBefore }, HttpStatusCodes.OK)
  }

  const rows = await db
    .select()
    .from(focusBlocks)
    .where(and(eq(focusBlocks.userId, user.id), inArray(focusBlocks.sessionId, sessionIds)))
    .orderBy(asc(focusBlocks.startedAt))
    .limit(HISTORY_RECORD_CAP)
  const blockIds = rows.map(r => r.id)

  const [logRows, noteRows, linkRows] = await Promise.all([
    db
      .select()
      .from(blockLogs)
      .where(and(eq(blockLogs.userId, user.id), inArray(blockLogs.sessionId, sessionIds))),
    db
      .select()
      .from(sessionNotes)
      .where(and(eq(sessionNotes.userId, user.id), inArray(sessionNotes.sessionId, sessionIds))),
    db
      .select({
        blockId: taskBlockLinks.blockId,
        taskId: taskBlockLinks.taskId,
        text: tasks.text,
        planned: taskBlockLinks.planned,
        worked: taskBlockLinks.worked,
        completed: taskBlockLinks.completed,
        completedAt: taskBlockLinks.completedAt,
      })
      .from(taskBlockLinks)
      .innerJoin(tasks, eq(tasks.id, taskBlockLinks.taskId))
      .where(
        and(
          eq(taskBlockLinks.userId, user.id),
          eq(tasks.userId, user.id),
          inArray(taskBlockLinks.blockId, blockIds),
        ),
      )
      .orderBy(asc(taskBlockLinks.id)),
  ])

  const records: BlockRecord[] = rows.map(r => ({
    id: r.id,
    sessionId: r.sessionId,
    kind: r.kind,
    index: r.index,
    plannedSeconds: r.plannedSeconds,
    actualSeconds: r.actualSeconds,
    addedSeconds: r.addedSeconds,
    startedAt: r.startedAt.getTime(),
    endedAt: r.endedAt.getTime(),
    outcome: r.outcome,
  }))

  return c.json(
    {
      records,
      logs: logRows.map(toLog),
      notes: noteRows.map(toNote),
      links: linkRows.map(l => ({
        ...l,
        taskId: String(l.taskId),
        completedAt: l.completedAt?.toISOString() ?? null,
      })),
      nextBefore,
    },
    HttpStatusCodes.OK,
  )
}
