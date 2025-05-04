import { createRoute, z } from '@hono/zod-openapi'
import {
  getSoundPreferencesSchema,
  getSoundSchema,
  getUserAccountsSchema,
  getUserSchema,
  getUserSessionSchema,
  getUserSettingsSchema,
  insertSoundPreferencesSchema,
  insertSoundSchema,
  updateSoundPreferencesSchema,
  updateSoundSchema,
  updateUserSettingsSchema,
} from '@repo/api/db/schemas'
import { notFoundSchema } from '@repo/api/lib/constants'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'

const tags = ['User']

export const getUser = createRoute({
  path: '/user',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getUserSchema, 'The requested user'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
  },
})

export const getUserSession = createRoute({
  path: '/user/session',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getUserSessionSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const getUserAccounts = createRoute({
  path: '/user/accounts',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(getUserAccountsSchema.pick({ providerId: true })),
      'The requested accounts',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const getUserSettings = createRoute({
  path: '/user/settings',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getUserSettingsSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const createUserSettingsSchema = z.object({
  workDuration: z.number(),
  breakDuration: z.number(),
  numberOfSessions: z.number(),
})

export const createUserSettings = createRoute({
  path: '/user/settings',
  method: 'post',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSettingsSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getUserSettingsSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const updateUserSettings = createRoute({
  path: '/user/settings',
  method: 'put',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateUserSettingsSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getUserSettingsSchema, 'Successfully updated settings'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User or settings not found'),
  },
})

export const getUserSounds = createRoute({
  path: '/user/sounds',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(getSoundSchema), 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const createUserSounds = createRoute({
  path: '/user/sounds',
  method: 'post',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: insertSoundSchema,
        },
      },
      required: true,
    },
  },
  // responses: {
  //   [HttpStatusCodes.OK]: jsonContent(insertSoundSchema, 'The requested session'),
  //   [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  // },
  responses: {
    // ← use getSoundSchema here so the client knows the response has id, url, etc.
    [HttpStatusCodes.OK]: jsonContent(getSoundSchema, 'The newly created sound'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string(), errors: z.any() }),
      'Invalid sound data',
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({
        message: z.string(),
        duplicates: z.array(z.object({ id: z.string(), url: z.string() })),
      }),
      'Duplicate sound detected',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      'Failed to insert sound',
    ),
  },
})

export const updateUserSounds = createRoute({
  path: '/user/sounds',
  method: 'put',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateSoundSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(updateUserSettingsSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const deleteUserSound = createRoute({
  path: '/user/sounds/:id',
  method: 'delete',
  tags,
  request: {
    params: z.object({
      id: z.string().uuid(), // Assuming your sound ID is a UUID
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      'Sound deleted successfully',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Sound not found'),
  },
})

export const getSoundPreference = createRoute({
  path: '/user/sounds/preferences',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getSoundPreferencesSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const createSoundPreference = createRoute({
  path: '/user/sounds/preferences',
  method: 'post',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: insertSoundPreferencesSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(insertSoundPreferencesSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const updateSoundPreference = createRoute({
  path: '/user/sounds/preferences',
  method: 'put',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateSoundPreferencesSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(updateSoundPreferencesSchema, 'The requested session'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Session not found'),
  },
})

export const deleteSoundPreference = createRoute({
  path: '/user/sounds/preferences/:id',
  method: 'delete',
  tags,
  request: {
    params: z.object({
      id: z.string().uuid(), // Adjust if not a UUID
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      'Sound preference deleted successfully',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Sound preference not found'),
  },
})

export type CreateUserSettings = typeof createUserSettings
export type GetUserAccountsRoute = typeof getUserAccounts
export type GetUserRoute = typeof getUser
export type GetUserSessionRoute = typeof getUserSession
export type GetUserSettings = typeof getUserSettings
export type UpdateUserSettings = typeof updateUserSettings
export type GetUserSounds = typeof getUserSounds
export type CreateUserSounds = typeof createUserSounds
export type UpdateUserSounds = typeof updateUserSounds
export type DeleteUserSound = typeof deleteUserSound
export type GetSoundPreference = typeof getSoundPreference
export type CreateSoundPreference = typeof createSoundPreference
export type UpdateSoundPreference = typeof updateSoundPreference
export type DeleteSoundPreference = typeof deleteSoundPreference