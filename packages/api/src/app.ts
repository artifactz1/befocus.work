import blocks from '@repo/api/routes/blocks/blocks.index'
import index from '@repo/api/routes/index.route'
import logs from '@repo/api/routes/logs/logs.index'
import plan from '@repo/api/routes/plan/plan.index'
import themes from '@repo/api/routes/themes/themes.index'
import user from '@repo/api/routes/user/user.index'
import { showRoutes } from 'hono/dev'
import configureOpenAPI from './lib/configure-open-api'
import createApp from './lib/create-app'

const app = createApp()

configureOpenAPI(app)

const routes = [index, user, themes, blocks, plan, logs] as const

for (const route of routes) {
  app.route('/', route)
}

showRoutes(app)

export type AppType = (typeof routes)[number]

export default app
