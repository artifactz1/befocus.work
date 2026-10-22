import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { BlockRecord } from '../../../../types/blocks'
import { focusBlocks, type insertFocusBlockSchema } from './../../db/tables/focus-blocks'
import type { PutUserBlocks } from './blocks.route'

// Pure: dedupes by id (last copy wins, a Postgres upsert cannot touch one row twice in a
// statement) and stamps the owner from the session, never from the body.
export function toRows(
  userId: string,
  records: BlockRecord[],
): z.infer<typeof insertFocusBlockSchema>[] {
  const byId = new Map<string, BlockRecord>()
  for (const r of records) byId.set(r.id, r)
  return [...byId.values()].map(r => ({
    id: r.id,
    userId,
    sessionId: r.sessionId,
    kind: r.kind,
    index: r.index,
    plannedSeconds: r.plannedSeconds,
    actualSeconds: r.actualSeconds,
    addedSeconds: r.addedSeconds,
    startedAt: new Date(r.startedAt),
    endedAt: new Date(r.endedAt),
    outcome: r.outcome,
  }))
}

const excluded = (column: string) => sql.raw(`excluded.${column}`)

export const putUserBlocks: AppRouteHandler<PutUserBlocks> = async c => {
  const db = c.get('db')
  const user = c.get('user')

  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const { records } = c.req.valid('json')

  try {
    // userId is not in the update set and setWhere requires ownership, so a colliding id that
    // belongs to someone else is left untouched (and not counted in the returning rows).
    const returned = await db
      .insert(focusBlocks)
      .values(toRows(user.id, records))
      .onConflictDoUpdate({
        target: focusBlocks.id,
        set: {
          sessionId: excluded('session_id'),
          kind: excluded('kind'),
          index: excluded('block_index'),
          plannedSeconds: excluded('planned_seconds'),
          actualSeconds: excluded('actual_seconds'),
          addedSeconds: excluded('added_seconds'),
          startedAt: excluded('started_at'),
          endedAt: excluded('ended_at'),
          outcome: excluded('outcome'),
          updatedAt: sql`now()`,
        },
        setWhere: eq(focusBlocks.userId, user.id),
      })
      .returning({ id: focusBlocks.id })

    return c.json({ saved: returned.length }, HttpStatusCodes.OK)
  } catch (error) {
    console.error('putUserBlocks failed', error)
    return c.json(
      { message: "Couldn't save the block records" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
