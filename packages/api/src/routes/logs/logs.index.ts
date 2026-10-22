import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './logs.handler'
import * as routes from './logs.route'

const router = createRouter()
  .openapi(routes.putUserBlockLogs, handlers.putUserBlockLogs)
  .openapi(routes.putUserBlockLinks, handlers.putUserBlockLinks)
  .openapi(routes.putUserSessionNotes, handlers.putUserSessionNotes)
  .openapi(routes.getUserHistory, handlers.getUserHistory)

export default router
