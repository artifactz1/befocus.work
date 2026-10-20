import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './themes.handler'
import * as routes from './themes.route'

const router = createRouter().openapi(routes.putActiveTheme, handlers.putActiveTheme)

export default router
