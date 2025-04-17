import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './user.handler'
import * as routes from './user.route'

const router = createRouter()
  .openapi(routes.getUser, handlers.getUser)
  .openapi(routes.getUserSession, handlers.getUserSession)
  .openapi(routes.getUserAccounts, handlers.getUserAccounts)
  // .openapi(routes.getUserSettings, handlers.getUserSettings)
  .openapi(routes.postUserSettings, handlers.postUserSettings) 
  // .openapi(routes.putUserSettings, handlers.putUserSettings)

export default router
