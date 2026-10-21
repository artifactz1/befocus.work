import { betterFetch } from '@better-fetch/fetch'
import { env } from '@repo/app/env/next'
import type { Task } from '@repo/types/tasks'
import { headers } from 'next/headers'

interface TaskRow {
  id: number
  text: string
  completed: boolean
  archived: boolean
  createdAt?: string | null
}

/** Tasks for the dashboard server render, or null on any failure (the List then shows a retry). */
export async function getUserTasks(): Promise<Task[] | null> {
  const cookie = (await headers()).get('cookie')

  if (!cookie) return null

  try {
    const { data, error } = await betterFetch<TaskRow[]>(`${env.API_URL}/user/tasks`, {
      headers: { cookie },
    })

    if (error || !data) {
      console.error('getUserTasks failed', { status: error?.status })
      return null
    }

    return data.map(row => ({
      id: String(row.id),
      text: row.text,
      completed: row.completed,
      archived: row.archived,
      createdAt: row.createdAt ? String(row.createdAt) : undefined,
    }))
  } catch {
    console.error('getUserTasks failed', { status: 'exception' })
    return null
  }
}
