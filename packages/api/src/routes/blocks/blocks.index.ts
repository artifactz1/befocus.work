import { createRouter } from '@repo/api/lib/create-app'
import * as handlers from './blocks.handler'
import * as routes from './blocks.route'

const router = createRouter().openapi(routes.putUserBlocks, handlers.putUserBlocks)

export default router
