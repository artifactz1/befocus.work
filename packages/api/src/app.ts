import index from '@repo/api/routes/index.route'
import user from '@repo/api/routes/user/user.index'
import { showRoutes } from 'hono/dev'
import configureOpenAPI from './lib/configure-open-api'
import createApp from './lib/create-app'

const app = createApp()

configureOpenAPI(app)

// const routes = [index, user] as const
const routes = [index, user] as const

for (const route of routes) {
  app.route('/', route)
}

showRoutes(app)

export type AppType = (typeof routes)[number]

export default app
