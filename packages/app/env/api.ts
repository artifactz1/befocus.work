import { z } from 'zod'

// ponytail: the slice of R2Bucket the label routes use, so this file needs no workers-types global
export interface LabelBucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>
  get(key: string): Promise<{
    body: ReadableStream
    httpEtag: string
    httpMetadata?: { contentType?: string }
  } | null>
  delete(key: string): Promise<void>
}

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
  LABELS: z.custom<LabelBucket>(), // R2 bucket for uploaded record label images
  RATE_LIMITER: z.any(), // Assuming DurableObjectNamespace is not a Zod type, use z.any() or a custom validation
})

export type Env = z.infer<typeof EnvSchema>
