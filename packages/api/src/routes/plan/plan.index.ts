import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './plan.handler'
import * as routes from './plan.route'

const router = createRouter()
  .openapi(routes.getUserPlan, handlers.getUserPlan)
  .openapi(routes.putUserPlan, handlers.putUserPlan)
  .openapi(routes.deleteUserPlan, handlers.deleteUserPlan)

export default router
