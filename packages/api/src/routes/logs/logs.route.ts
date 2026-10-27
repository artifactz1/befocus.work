import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { createErrorSchema } from '@repo/api/lib/openapi/schemas'
import { bodyLimit } from 'hono/body-limit'
import { blockRecordSchema } from '../../../../types/blocks'
import { blockLogSchema, HISTORY_DAYS, sessionNoteSchema } from '../../../../types/logs'

const tags = ['Logs']

const messageSchema = z.object({ message: z.string() })

const limit = (kb: number) =>
  bodyLimit({
    maxSize: kb * 1024,
    onError: c =>
      c.json({ message: `Body is larger than ${kb} KB.` }, HttpStatusCodes.REQUEST_TOO_LONG),
  })

const putResponses = (schema: z.ZodTypeAny, okText: string, invalid: z.ZodTypeAny) => ({
  [HttpStatusCodes.OK]: jsonContent(schema, okText),
  [HttpStatusCodes.UNAUTHORIZED]: jsonContent(messageSchema, 'User not authenticated'),
  [HttpStatusCodes.REQUEST_TOO_LONG]: jsonContent(messageSchema, 'Body is too large'),
  [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(invalid), 'Invalid body'),
  [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(messageSchema, 'Failed to save'),
})

const blockLinksBodySchema = z
  .object({
    links: z
      .array(
        z
          .object({
            blockId: z.string().uuid(),
            taskId: z.number().int().positive(),
            completed: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(64),
  })
  .strict()

const blockLinksResponseSchema = z.object({
  links: z.array(
    z.object({
      blockId: z.string(),
      taskId: z.string(),
      completed: z.boolean(),
      completedAt: z.string().nullable(),
    }),
  ),
})

const historyQuerySchema = z.object({
  before: z.string().datetime().optional(),
  days: z.coerce.number().int().min(1).max(HISTORY_DAYS.max).default(HISTORY_DAYS.default),
})

const historyResponseSchema = z.object({
  records: z.array(blockRecordSchema),
  logs: z.array(blockLogSchema),
  notes: z.array(sessionNoteSchema),
  links: z.array(
    z.object({
      blockId: z.string(),
      taskId: z.string(),
      text: z.string(),
      planned: z.boolean(),
      worked: z.boolean(),
      completed: z.boolean(),
      completedAt: z.string().nullable(),
    }),
  ),
  nextBefore: z.string().nullable(),
})

// Upserts the one log of a block; editing later overwrites it.
export const putUserBlockLogs = createRoute({
  path: '/user/block-logs',
  method: 'put',
  tags,
  middleware: [limit(16)] as const,
  request: {
    body: { content: { 'application/json': { schema: blockLogSchema } }, required: true },
  },
  responses: putResponses(blockLogSchema, 'Log saved', blockLogSchema),
})

// Ticks tasks on any owned block, including blocks of a closed plan.
export const putUserBlockLinks = createRoute({
  path: '/user/block-links',
  method: 'put',
  tags,
  middleware: [limit(16)] as const,
  request: {
    body: { content: { 'application/json': { schema: blockLinksBodySchema } }, required: true },
  },
  responses: {
    ...putResponses(blockLinksResponseSchema, 'Links saved', blockLinksBodySchema),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(messageSchema, 'Task not found'),
  },
})

export const putUserSessionNotes = createRoute({
  path: '/user/session-notes',
  method: 'put',
  tags,
  middleware: [limit(32)] as const,
  request: {
    body: { content: { 'application/json': { schema: sessionNoteSchema } }, required: true },
  },
  responses: putResponses(sessionNoteSchema, 'Note saved', sessionNoteSchema),
})

export const getUserHistory = createRoute({
  path: '/user/history',
  method: 'get',
  tags,
  request: { query: historyQuerySchema },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(historyResponseSchema, 'History window'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(messageSchema, 'User not authenticated'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(historyQuerySchema),
      'Invalid query',
    ),
  },
})

export type PutUserBlockLogs = typeof putUserBlockLogs
export type PutUserBlockLinks = typeof putUserBlockLinks
export type PutUserSessionNotes = typeof putUserSessionNotes
export type GetUserHistory = typeof getUserHistory
