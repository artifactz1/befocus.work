import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string(),
  WORKER_ENV: z.enum(['production', 'staging', 'development']),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  APPLE_CLIENT_ID: z.string(),
  APPLE_PRIVATE_KEY: z.string(),
  APPLE_TEAM_ID: z.string(),
  APPLE_WEB_CLIENT_ID: z.string(),
  APPLE_KEY_ID: z.string(),
  API_DOMAIN: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  WEB_DOMAIN: z.string(),
  RATE_LIMITER: z.any(), // Assuming DurableObjectNamespace is not a Zod type, use z.any() or a custom validation
})

export type Env = z.infer<typeof EnvSchema>
