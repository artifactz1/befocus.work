'use client'

import type { AppType } from '@repo/api/src/app'
import { env } from '@repo/app/env/next'
import { hc as honoRPC } from 'hono/client'

const API_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

// Create and return the client with the Authorization header
export const api = honoRPC<AppType>(API_URL, {
  fetch: (input: URL | RequestInfo, requestInit?: RequestInit) =>
    fetch(input, {
      ...requestInit,
      credentials: 'include',
    }),
})
