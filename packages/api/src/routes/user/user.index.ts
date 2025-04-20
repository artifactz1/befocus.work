import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './user.handler'
import * as routes from './user.route'

const router = createRouter()
  .openapi(routes.getUser, handlers.getUser)
  .openapi(routes.getUserSession, handlers.getUserSession)
  .openapi(routes.getUserAccounts, handlers.getUserAccounts)
  .openapi(routes.getUserSettings, handlers.getUserSettings)
  .openapi(routes.createUserSettings, handlers.createUserSettings)
  .openapi(routes.updateUserSettings, handlers.updateUserSettings)

export default router
