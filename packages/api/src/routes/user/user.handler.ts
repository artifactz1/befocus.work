import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { sessionSettings } from './../../db/tables/settings'
import type {
  CreateUserSettings,
  GetUserAccountsRoute,
  GetUserRoute,
  GetUserSessionRoute,
  GetUserSettings,
  PutUserSettings,
} from './user.route'

export const getUser: AppRouteHandler<GetUserRoute> = async c => {
  const user = c.get('user')
  if (!user) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }
  // Ensure the success response matches the expected schema
  return c.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    HttpStatusCodes.OK,
  )
}

export const getUserSession: AppRouteHandler<GetUserSessionRoute> = async c => {
  const session = c.get('session')
  const user = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  return c.json(session, HttpStatusCodes.OK)
}

export const getUserAccounts: AppRouteHandler<GetUserAccountsRoute> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  const accounts = await db.query.account.findMany({
    columns: { providerId: true },
    where: (accounts, { eq }) => eq(accounts.userId, user.id),
  })

  if (!accounts) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  return c.json(accounts, HttpStatusCodes.OK)
}

export const getUserSettings: AppRouteHandler<GetUserSettings> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  const settings = await db.query.sessionSettings.findFirst({
    where: (sessionSettings, { eq }) => eq(sessionSettings.userId, user.id),
  })

  if (!settings) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  return c.json(settings, HttpStatusCodes.OK)
}

export const createUserSettings: AppRouteHandler<CreateUserSettings> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  // Check if settings already exist
  const existingSettings = await db.query.sessionSettings.findFirst({
    where: (sessionSettings, { eq }) => eq(sessionSettings.userId, user.id),
  })

  if (existingSettings) {
    return c.json(existingSettings, HttpStatusCodes.OK)
  }

  // 👇 Get values from the POST body
  const body = await c.req.json()
  const { workDuration, breakDuration, numberOfSessions } = body

  const inserted = await db
    .insert(sessionSettings)
    .values({
      id: nanoid(),
      userId: user.id,
      workDuration,
      breakDuration,
      numberOfSessions,
    })
    .returning()

  return c.json(inserted[0], HttpStatusCodes.OK)
}

export const putUserSettings: AppRouteHandler<PutUserSettings> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')
  const data = await c.req.json()

  if (!user || !session) {
    return c.json({ message: 'User or session not found' }, HttpStatusCodes.NOT_FOUND)
  }

  const existingSettings = await db.query.sessionSettings.findFirst({
    where: (sessionSettings, { eq }) => eq(sessionSettings.userId, user.id),
  })

  if (!existingSettings) {
    return c.json({ message: 'Settings not found' }, HttpStatusCodes.NOT_FOUND)
  }

  console.log('DATA PUT', data)
  console.log('ID', sessionSettings.id)

  const updated = await db
    .update(sessionSettings)
    .set({
      workDuration: data.workDuration,
      breakDuration: data.breakDuration,
      numberOfSessions: data.numberOfSessions,
    })
    // .where((sessionSettings, { eq }) => eq(sessionSettings.id, user.id))
    .where(eq(sessionSettings.userId, user.id))
    .returning()

  return c.json(updated[0], HttpStatusCodes.OK)
}
