import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './plan.handler'
import * as routes from './plan.route'

const router = createRouter()
  .openapi(routes.getUserPlan, handlers.getUserPlan)
  .openapi(routes.putUserPlan, handlers.putUserPlan)
  .openapi(routes.deleteUserPlan, handlers.deleteUserPlan)
  .openapi(routes.putUserTaskLinks, handlers.putUserTaskLinks)
  .openapi(routes.getUserBlockTasks, handlers.getUserBlockTasks)

export default router
