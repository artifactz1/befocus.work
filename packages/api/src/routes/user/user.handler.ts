import { useSoundsStore } from '~/store/useSoundsStore';
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppRouteHandler } from '@repo/api/types/app-context'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { sessionSettings } from './../../db/tables/settings'
import { insertSoundSchema, sounds } from './../../db/tables/sounds'
import type {
  CreateUserSettings,
  CreateUserSounds,
  GetUserAccountsRoute,
  GetUserRoute,
  GetUserSessionRoute,
  GetUserSettings,
  GetUserSounds,
  UpdateUserSettings,
} from './user.route'
import { z } from 'zod'
import { base } from 'framer-motion/client';

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
  const parsed = z.array(insertSoundSchema).safeParse(body)
  if (!parsed.success) {
    return c.json(
      { message: 'Invalid sound data', errors: parsed.error.format() },
      HttpStatusCodes.BAD_REQUEST,
    )
  }

  const inputSounds = parsed.data

  // Get user's existing sounds
  const existingSounds = await db.query.sounds.findMany({
    where: (s, { eq }) => eq(s.userId, user.id),
  })

  const existingIds = new Set(existingSounds.map(s => s.id))
  const existingUrls = new Set(existingSounds.map(s => s.url))

  // const duplicates = inputSounds.filter(s => existingIds.has(s.id) || existingUrls.has(s.url))
  const duplicates = inputSounds.filter(
    s => (s.id && existingIds.has(s.id)) || (s.url && existingUrls.has(s.url)),
  )

  if (duplicates.length > 0) {
    return c.json(
      {
        message: 'Duplicate sound(s) detected. No sounds were added.',
        duplicates: duplicates.map(d => ({ id: d.id, url: d.url })),
      },
      HttpStatusCodes.CONFLICT,
    )
  }

  // Add userId + fallback for id (in case)
  const toInsert = inputSounds.map(sound => ({
    ...sound,
    id: sound.id || nanoid(),
    userId: user.id,
  }))

  const inserted = await db.insert(sounds).values(toInsert).returning()

  return c.json(inserted, HttpStatusCodes.CREATED)
}

