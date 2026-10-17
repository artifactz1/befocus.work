import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { and, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { sessionSettings } from './../../db/tables/settings'
import { themes } from './../../db/tables/themes'
import type { PutActiveTheme } from './themes.route'

// Same defaults the timer store starts with, so a first save never changes the timer.
const DEFAULT_SETTINGS = { workDuration: 1500, breakDuration: 300, numberOfSessions: 6 }

// Saves the user's one active theme: updates it, or creates it and points the settings row at it.
// Every query is scoped to user.id and the body carries no ids.
export const putActiveTheme: AppRouteHandler<PutActiveTheme> = async c => {
  const db = c.get('db')
  const user = c.get('user')

  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  const { look } = c.req.valid('json')

  await db
    .insert(sessionSettings)
    .values({ id: nanoid(), userId: user.id, ...DEFAULT_SETTINGS })
    .onConflictDoNothing({ target: sessionSettings.userId })

  // Second pass only runs when a concurrent first save won the pointer.
  for (let attempt = 0; attempt < 2; attempt++) {
    const [settings] = await db
      .select({ activeThemeId: sessionSettings.activeThemeId })
      .from(sessionSettings)
      .where(eq(sessionSettings.userId, user.id))

    if (settings?.activeThemeId) {
      const [updated] = await db
        .update(themes)
        .set({ look, updatedAt: new Date() })
        .where(and(eq(themes.id, settings.activeThemeId), eq(themes.userId, user.id)))
        .returning()
      if (updated) return respond(c, updated)
    }

    const id = crypto.randomUUID()
    const [[inserted], pointed] = await db.batch([
      db.insert(themes).values({ id, userId: user.id, look }).returning(),
      db
        .update(sessionSettings)
        .set({ activeThemeId: id })
        .where(and(eq(sessionSettings.userId, user.id), isNull(sessionSettings.activeThemeId)))
        .returning({ id: sessionSettings.id }),
    ])
    if (inserted && pointed.length === 1) return respond(c, inserted)

    // Lost the race: drop the orphan and go around once more to update the winner's theme.
    await db.delete(themes).where(and(eq(themes.id, id), eq(themes.userId, user.id)))
  }

  return c.json({ message: "Couldn't save the look" }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
}

function respond(
  c: Parameters<AppRouteHandler<PutActiveTheme>>[0],
  row: typeof themes.$inferSelect,
) {
  return c.json(
    { look: row.look, themeId: row.id, updatedAt: row.updatedAt.toISOString() },
    HttpStatusCodes.OK,
  )
}
