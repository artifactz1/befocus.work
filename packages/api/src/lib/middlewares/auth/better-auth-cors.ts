import * as HttpStatusCodes from '@repo/api/lib/http-status-codes'
import * as HttpStatusPhrases from '@repo/api/lib/http-status-phrases'
import type { AppContext } from '@repo/api/types/app-context'
import type { Context } from 'hono'
import { env } from 'hono/adapter'
import { cors } from 'hono/cors'

/**
 * CORS Middleware for better authentication.
 *
 * This middleware configures Cross-Origin Resource Sharing (CORS) settings
 * for the application. It allows the application to handle requests from
 * specified origins and supports specific HTTP methods and headers.
 *
 * @param origin - The allowed origins for CORS requests
 * @param allowHeaders - The headers allowed in CORS requests
 * @param allowMethods - The HTTP methods allowed in CORS requests
 * @param exposeHeaders - The headers exposed to the client
 * @param maxAge - The maximum age for the CORS preflight request cache
 * @param credentials - Whether credentials are supported in CORS requests
 */
export function betterAuthCorsMiddleware(c: Context<AppContext>) {
  return cors({
    origin: [
      env(c).WEB_DOMAIN || 'http://localhost:3000', // Use env var for frontend domain
      env(c).API_DOMAIN || 'http://localhost:8787'  // and backend 
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true, // Required for cookies to work cross-origin
  })
}

export async function requireAuth(c: Context<AppContext>, next: () => Promise<void>) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED)
  }
  await next()
}
