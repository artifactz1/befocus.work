import { betterFetch } from '@better-fetch/fetch'
import type { Settings } from '@repo/api/db/schemas'
import { env } from '@repo/app/env/next'
import { headers } from 'next/headers'

export async function getUserSettings(): Promise<Settings | null> {
  const cookie = (await headers()).get('cookie')

  if (!cookie) return null

  try {
    const { data: settings, error } = await betterFetch<Settings>(`${env.API_URL}/user/settings`, {
      headers: { cookie },
    })

    if (error) {
      if (error.status === 404) return null
      console.error('getUserSettings failed', { status: error.status })
      return null
    }

    return settings
  } catch {
    console.error('getUserSettings failed', { status: 'exception' })
    return null
  }
}
