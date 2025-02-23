import type { AppContext } from '@repo/api/types/app-context'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Context } from 'hono'
import { env } from 'hono/adapter'
import { extractDomain } from '../../extractDomain'

const enabledProviders = ['discord', 'google', 'github']

/**
 * Creates a configuration object for BetterAuth.
 *
 * This function sets up the configuration for BetterAuth, including the base URL,
 * trusted origins, database adapter, authentication methods, and advanced settings.
 *
 * @param dbInstance - The database instance to be used with BetterAuth.
 * @param c - The context object containing environment variables.
 * @returns A configuration object for BetterAuth.
 */
export function createBetterAuthConfig(dbInstance: any, c: Context<AppContext>) {
  // Use the context to access environment variables
  const configuredProviders = enabledProviders.reduce<
    Record<string, { clientId: string; clientSecret: string }>
  >((acc, provider) => {
    const id = env(c)[`${provider.toUpperCase()}_CLIENT_ID`] as string
    const secret = env(c)[`${provider.toUpperCase()}_CLIENT_SECRET`] as string
    if (id && id.length > 0 && secret && secret.length > 0) {
      acc[provider] = { clientId: id, clientSecret: secret }
    }
    return acc
  }, {})

  const isProduction = env(c).env === 'production'

  return {
    baseURL: env(c).API_DOMAIN, // API URL
    trustedOrigins: [env(c).API_DOMAIN, env(c).WEB_DOMAIN], // Needed for cross domain cookies
    database: drizzleAdapter(dbInstance, {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: configuredProviders,
    advanced: {
      crossSubDomainCookies: {
        enabled: true, // Enables cross-domain cookies
      },
      defaultCookieAttributes: {
        sameSite: isProduction ? 'lax' : 'none',
        secure: true,
        domain: isProduction ? extractDomain(env(c).WEB_DOMAIN) : undefined // Use env var for frontend domain
      },
    },
    rateLimit: {
      window: 10, // time window in seconds
      max: 100, // max requests in the window
    },
  }
}

export default createBetterAuthConfig
