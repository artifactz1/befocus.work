import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import jsonContent from '@repo/api/lib/openapi/helpers/json-content'
import { createErrorSchema } from '@repo/api/lib/openapi/schemas'
import {
  getPlanSchema,
  linkResponseSchema,
  planResponseSchema,
  putPlanSchema,
  putTaskLinksSchema,
} from '../../db/tables/plans'

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

export const putUserTaskLinks = createRoute({
  path: '/user/task-links',
  method: 'put',
  tags,
  request: {
    body: { content: { 'application/json': { schema: putTaskLinksSchema } }, required: true },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ links: z.array(linkResponseSchema) }),
      "The plan's links after the write",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(messageSchema, 'User not authenticated'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(messageSchema, 'No open plan, block or task'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(putTaskLinksSchema),
      'Invalid links',
    ),
  },
})

export type GetUserPlan = typeof getUserPlan
export type PutUserPlan = typeof putUserPlan
export type DeleteUserPlan = typeof deleteUserPlan
export type PutUserTaskLinks = typeof putUserTaskLinks
