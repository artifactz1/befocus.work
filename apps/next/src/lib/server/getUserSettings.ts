'use server'

import { betterFetch } from '@better-fetch/fetch'
import type { Settings } from '@repo/api/db/schemas'
import { env } from '@repo/app/env/next'
import { cookies } from 'next/headers'

export async function getUserSettings(): Promise<Settings | null> {
  // NOTE: example of getting session
  // const reqHeaders = await headers()

  // const { data } = await authClient.getSession({
  //   fetchOptions: {
  //     headers: reqHeaders,
  //   },
  // })

  // if (!data?.session?.token) {
  //   console.error('No session token found')
  //   return null
  // }

  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('better-auth.session_token')

  if (!cookieHeader) return null

  const { data: settings } = await betterFetch<Settings>(`${env.API_URL}/user/settings`, {
    headers: {
      cookie: `better-auth.session_token=${cookieHeader.value}`,
    },
  })

  if (!settings) {
    console.error('Failed to fetch user settings', settings)
    return null
  }

  return settings
}
