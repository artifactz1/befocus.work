import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { lookSchema } from '../../../../types/look'

const tags = ['Themes']

export const putActiveTheme = createRoute({
  path: '/user/themes/active',
  method: 'put',
  tags,
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ look: lookSchema }) } },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ look: lookSchema, themeId: z.string().uuid(), updatedAt: z.string() }),
      'The saved active look',
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      'User not authenticated',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      'Failed to save the look',
    ),
  },
})

export type PutActiveTheme = typeof putActiveTheme
