import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { createErrorSchema } from '@repo/api/lib/openapi/schemas'
import { getPlanSchema, planResponseSchema, putPlanSchema } from '../../db/tables/plans'

const tags = ['Plan']
const messageSchema = z.object({ message: z.string() })

export const getUserPlan = createRoute({
  path: '/user/plan',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(getPlanSchema, "The user's open plan, or null"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(messageSchema, 'User not authenticated'),
  },
})

export const putUserPlan = createRoute({
  path: '/user/plan',
  method: 'put',
  tags,
  request: {
    body: { content: { 'application/json': { schema: putPlanSchema } }, required: true },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ plan: planResponseSchema }), 'Plan saved'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(messageSchema, 'User not authenticated'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(putPlanSchema),
      'Invalid plan',
    ),
  },
})

export const deleteUserPlan = createRoute({
  path: '/user/plan',
  method: 'delete',
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: 'Plan deleted' },
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(messageSchema, 'User not authenticated'),
  },
})

export type GetUserPlan = typeof getUserPlan
export type PutUserPlan = typeof putUserPlan
export type DeleteUserPlan = typeof deleteUserPlan
