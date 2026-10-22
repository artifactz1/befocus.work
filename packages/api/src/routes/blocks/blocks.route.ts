import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { createErrorSchema } from '@repo/api/lib/openapi/schemas'
import { bodyLimit } from 'hono/body-limit'
import { blockRecordSchema, MAX_BLOCK_RECORDS_PER_REQUEST } from '../../../../types/blocks'

const tags = ['Blocks']

export const putBlocksBodySchema = z.object({
  records: z.array(blockRecordSchema).min(1).max(MAX_BLOCK_RECORDS_PER_REQUEST),
})

// Upserts the session user's block records by id. The owner is never part of the body.
export const putUserBlocks = createRoute({
  path: '/user/blocks',
  method: 'put',
  tags,
  middleware: [
    bodyLimit({
      maxSize: 64 * 1024,
      onError: c =>
        c.json(
          { message: 'At most 64 KB of block records per request.' },
          HttpStatusCodes.REQUEST_TOO_LONG,
        ),
    }),
  ] as const,
  request: {
    body: {
      content: { 'application/json': { schema: putBlocksBodySchema } },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ saved: z.number().int() }), 'Records saved'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      'User not authenticated',
    ),
    [HttpStatusCodes.REQUEST_TOO_LONG]: jsonContent(
      z.object({ message: z.string() }),
      'Body is larger than 64 KB',
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(putBlocksBodySchema),
      'Invalid block records',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      'Failed to save the block records',
    ),
  },
})

export type PutUserBlocks = typeof putUserBlocks
