import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { sessionSettings } from './../../db/tables/settings'
import { insertSoundSchema, sounds, updateSoundSchema } from './../../db/tables/sounds'
import type {
  CreateUserSettings,
  CreateUserSounds,
  DeleteUserSound,
  GetUserAccountsRoute,
  GetUserRoute,
  GetUserSessionRoute,
  GetUserSettings,
  GetUserSounds,
  UpdateUserSettings,
  UpdateUserSounds,
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

export const updateUserSettings: AppRouteHandler<UpdateUserSettings> = async c => {
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

  const updated = await db
    .update(sessionSettings)
    .set({
      workDuration: data.workDuration,
      breakDuration: data.breakDuration,
      numberOfSessions: data.numberOfSessions,
    })
    .where(eq(sessionSettings.userId, user.id))
    .returning()

  return c.json(updated[0], HttpStatusCodes.OK)
}

export const getUserSounds: AppRouteHandler<GetUserSounds> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  const soundData = await db.query.sounds.findMany({
    where: (sounds, { eq }) => eq(sounds.userId, user.id),
  })

  if (!soundData) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  // Convert createdAt to string
  const transformedSoundData = soundData.map(sound => ({
    ...sound,
    createdAt: sound.createdAt ? sound.createdAt.toISOString() : null,
  }))

  return c.json(transformedSoundData, HttpStatusCodes.OK)
}

// Suggestion for Sounds Store for default values

// If user doesn't have any sounds by getting the data from database
// - load default sounds from the client which is saved in the useSoundsStore
// If user does have sounds from data base
// - don't load default sounds

// However give option to enable / disable default sounds

export const createUserSounds: AppRouteHandler<CreateUserSounds> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  const body = await c.req.json()

  // Validate input as an array of insertSoundSchema
  const parsed = insertSoundSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { message: 'Invalid sound data', errors: parsed.error.format() },
      HttpStatusCodes.BAD_REQUEST,
    )
  }

  const sound = parsed.data

  // Get user's existing sounds to check for duplicates
  const existingSounds = await db.query.sounds.findMany({
    where: (s, { eq }) => eq(s.userId, user.id),
  })

  const existingIds = new Set(existingSounds.map(s => s.id))
  const existingUrls = new Set(existingSounds.map(s => s.url))

  if ((sound.id && existingIds.has(sound.id)) || existingUrls.has(sound.url)) {
    return c.json(
      {
        message: 'Duplicate sound detected. No sound was added.',
        duplicates: [{ id: sound.id, url: sound.url }],
      },
      HttpStatusCodes.CONFLICT,
    )
  }

  const toInsert = {
    id: sound.id || nanoid(),
    name: sound.name,
    url: sound.url,
    isCustom: sound.isCustom,
    soundType: sound.soundType,
    userId: user.id,
  }

  const inserted = await db.insert(sounds).values(toInsert).returning()

  if (inserted.length === 0) {
    return c.json({ message: 'Failed to insert sound' }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
  }

  // Take the one-and-only row
  const saved = inserted[0]

  const result = {
    id: saved.id,
    name: saved.name,
    userId: saved.userId,
    url: saved.url,
    isCustom: saved.isCustom,
    soundType: saved.soundType,
    createdAt: saved.createdAt ? saved.createdAt.toISOString() : null,
  }

  return c.json(result, HttpStatusCodes.OK)

  // return c.json(inserted, HttpStatusCodes.CREATED)
}

export const deleteUserSound: AppRouteHandler<DeleteUserSound> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  // const params = c.req.param // ← params, not param
  const soundId = c.req.param('id')

  if (!user) {
    // ← use `param('id')`, not `params`

    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }

  // only delete if it exists & not already deleted
  const existing = await db.query.sounds.findFirst({
    where: (s, { eq, and }) => and(eq(s.id, soundId), eq(s.userId, user.id)),
  })

  if (!existing) {
    return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND)
  }

  await db.delete(sounds).where(eq(sounds.id, soundId))

  // return c.json(undefined, HttpStatusCodes.NO_CONTENT)
  return c.json({ message: 'Sound deleted successfully' }, HttpStatusCodes.OK)


}

export const updateUserSounds: AppRouteHandler<UpdateUserSounds> = async c => {
  const db = c.get('db')
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ message: 'User or session not found' }, HttpStatusCodes.NOT_FOUND)
  }

  const body = await c.req.json()
  const parsed = updateSoundSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { message: 'Invalid update data', errors: parsed.error.format() },
      HttpStatusCodes.BAD_REQUEST,
    )
  }

  const data = parsed.data

  const existing = await db.query.sounds.findFirst({
    where: (s, { eq, and }) => and(eq(s.id, data.id), eq(s.userId, user.id)),
  })

  if (!existing) {
    return c.json({ message: 'Sound not found' }, HttpStatusCodes.NOT_FOUND)
  }

  const updated = await db
    .update(sounds)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.url && { url: data.url }),
      ...(data.soundType && { soundType: data.soundType }),
      ...(typeof data.isCustom === 'boolean' && { isCustom: data.isCustom }),
    })
    .where(eq(sounds.id, data.id))
    .returning()

  return c.json(updated[0], HttpStatusCodes.OK)
}

