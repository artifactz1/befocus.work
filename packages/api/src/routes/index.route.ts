import { createRoute } from '@hono/zod-openapi'
import { createRouter } from '@repo/api/lib/create-app'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { createMessageObjectSchema } from '@repo/api/lib/openapi/schemas'

const router = createRouter().openapi(
  createRoute({
    tags: ['Index'],
    method: 'get',
    path: '/',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(createMessageObjectSchema('Hono APi'), 'Hono API Index'),
    },
  }),
  c => {
    return c.json(
      {
        message: 'Hono API',
      },
      HttpStatusCodes.OK,
    )
  },
)

export default router
