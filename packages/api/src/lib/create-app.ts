import { OpenAPIHono } from '@hono/zod-openapi'

import type { AppContext, AppOpenAPI } from '@repo/api/types/app-context'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
import { initializeDrizzleNeonDB } from '../db'
import { notFound, onError } from './middlewares'
import {
  betterAuthCorsMiddleware,
  handleSessionMiddleware,
  initializeBetterAuth,
  requireAuth,
} from './middlewares/auth'
import { defaultHook } from './openapi'

// Router for OPENAPI
export function createRouter() {
  return new OpenAPIHono<AppContext>({
    strict: false,
    defaultHook,
  })
}

// Create app with all the middlwares
export default function createApp() {
  const app = createRouter()
  app
    // TODO: https://www.notion.so/nextjs-expo-hono-19463b9e1e3b80c8a338ddfa535470e2?p=19563b9e1e3b80199834e976aefea0fe&pm=s
    // app.use(pinoLogger())
    .use('*', prettyJSON())
    .use('*', secureHeaders())
    .use('*', timing())
    // Middleware to initialize auth
    .use('*', (c, next) => {
      initializeDrizzleNeonDB(c)
      initializeBetterAuth(c)
      return next()
    })
    // Use CORS middleware for auth routes
    // /auth/**  auth routes or * for all routes to have cors*/
    .use('*', (c, next) => betterAuthCorsMiddleware(c)(c, next))
    .use('*', handleSessionMiddleware)
    // Better Auth route config
    // Note: /api is needed for better auth
    .on(['POST', 'GET'], '/api/auth/**', c => {
      const auth = c.get('auth')
      return auth.handler(c.req.raw)
    })
    .notFound(notFound)
    .onError(onError)

    // All routes will be protected now
    .use('*', requireAuth)

  return app
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route('/', router)
}
