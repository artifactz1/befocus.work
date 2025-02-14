import type { AppContext } from '@repo/api/types/app-context'
import { betterAuth } from 'better-auth'
import type { Context } from 'hono'
import createBetterAuthConfig from './create-better-auth-config'

/**
 * Initializes BetterAuth and stores it in the context.
 *
 * This function retrieves the database instance from the context, creates a BetterAuth
 * configuration using the `createBetterAuthConfig` function, and initializes BetterAuth.
 * The initialized BetterAuth instance is then stored in the context for later use.
 *
 * @param c - The context object containing the database instance and environment variables.
 * @returns The initialized BetterAuth instance.
 */
export const initializeBetterAuth = (c: Context<AppContext>) => {
  const db = c.get('db')
  const betterAuthConfig = createBetterAuthConfig(db, c)
  const auth = betterAuth({
    ...betterAuthConfig,
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
      crossSubDomainCookies: {
        enabled: true,
      },
    },
  })
  c.set('auth', auth)
  return auth
}

/**
 * Type definition for the Auth object returned by BetterAuth.
 */
export type Auth = ReturnType<typeof betterAuth>
