import { createRoute, z } from '@hono/zod-openapi'
import {
  getSoundSchema,
  getTaskSchema,
  getUserAccountsSchema,
  getUserSchema,
  getUserSessionSchema,
  getUserSettingsSchema,
  insertSoundSchema,
  insertTaskSchema,
  updateSoundSchema,
  updateTaskSchema,
  updateUserSettingsSchema,
} from '@repo/api/db/schemas'
import { notFoundSchema } from '@repo/api/lib/constants'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import { LABEL_MAX_BYTES } from '@repo/api/lib/label-image'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { bodyLimit } from 'hono/body-limit'

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
    [HttpStatusCodes.OK]: jsonContent(getSoundSchema, 'The updated sound'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Sound not found'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string(), errors: z.any() }),
      'Invalid sound data',
    ),
  },
})

export const deleteUserSound = createRoute({
  path: '/user/sounds/:id',
  method: 'delete',
  tags,
  request: {
    params: z.object({
      // id: z.string().uuid(), // Assuming your sound ID is a UUID
      id: z.string(), // Assuming your sound ID is a UUID
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      'Sound deleted successfully',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Sound not found'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      'User not authenticated',
    ),
  },
})

const labelParams = z.object({ id: z.string().min(1).max(64) })

// Body is the raw image (image/jpeg, image/png or image/webp, at most 1 MB). bodyLimit caps the
// stream before it is buffered, with or without Content-Length; the handler checks the type
// against the bytes, not the header.
export const putUserSoundLabel = createRoute({
  path: '/user/sounds/:id/label',
  method: 'put',
  tags,
  middleware: [
    bodyLimit({
      maxSize: LABEL_MAX_BYTES,
      onError: c =>
        c.json({ message: 'Label images can be at most 1 MB.' }, HttpStatusCodes.REQUEST_TOO_LONG),
    }),
  ] as const,
  request: { params: labelParams },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getSoundSchema, 'The sound, now with an uploaded label'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Sound not found'),
    [HttpStatusCodes.REQUEST_TOO_LONG]: jsonContent(
      z.object({ message: z.string() }),
      'Image is larger than 1 MB',
    ),
    [HttpStatusCodes.UNSUPPORTED_MEDIA_TYPE]: jsonContent(
      z.object({ message: z.string() }),
      'Not a JPEG, PNG or WebP image',
    ),
  },
})

export const getUserSoundLabel = createRoute({
  path: '/user/sounds/:id/label',
  method: 'get',
  tags,
  request: { params: labelParams },
  responses: {
    [HttpStatusCodes.OK]: { description: 'The label image' },
    [HttpStatusCodes.NOT_MODIFIED]: { description: 'Unchanged since the given ETag' },
    [HttpStatusCodes.NOT_FOUND]: { description: 'No uploaded label for this sound' },
  },
})

export const getUserTasks = createRoute({
  path: '/user/tasks',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(getTaskSchema), 'All user tasks'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
  },
})

export const createUserTask = createRoute({
  path: '/user/tasks',
  method: 'post',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: insertTaskSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getTaskSchema, 'Created task'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string(), errors: z.any() }),
      'Invalid task data',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(z.object({ message: z.string() }), 'User not found'), //
  },
})

export const updateUserTask = createRoute({
  path: '/user/tasks/:id',
  method: 'put',
  tags,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: updateTaskSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getTaskSchema, 'Updated task'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string(), errors: z.any() }),
      'Invalid task data',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      'Task or user not found',
    ),
  },
})

export const deleteUserTask = createRoute({
  path: '/user/tasks/:id',
  method: 'delete',
  tags,
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ message: z.string() }), 'Deleted task'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Task not found'),
  },
})

export type GetUserTasks = typeof getUserTasks
export type CreateUserTask = typeof createUserTask
export type UpdateUserTask = typeof updateUserTask
export type DeleteUserTask = typeof deleteUserTask

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
export type PutUserSoundLabel = typeof putUserSoundLabel
export type GetUserSoundLabel = typeof getUserSoundLabel
