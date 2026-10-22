import { betterFetch } from '@better-fetch/fetch'
import { env } from '@repo/app/env/next'
import type { PlanBlock, TaskLink, TaskPlan } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { headers } from 'next/headers'

interface TaskRow {
  id: number
  text: string
  completed: boolean
  archived: boolean
  createdAt?: string | null
  later?: boolean
  laterAt?: string | null
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
      later: row.later ?? false,
      laterAt: row.laterAt ? String(row.laterAt) : null,
    }))
  } catch {
    console.error('getUserTasks failed', { status: 'exception' })
    return null
  }
}

interface PlanResponse {
  plan: { sessionId: string; blocks: PlanBlock[]; wentLive: boolean } | null
  links: (Omit<TaskLink, 'taskId'> & { taskId: number })[]
}

/** The open plan and its links for the server render, or null on any failure (no seeding then). */
export async function getUserPlan(): Promise<{ plan: TaskPlan | null; links: TaskLink[] } | null> {
  const cookie = (await headers()).get('cookie')

  if (!cookie) return null

  try {
    const { data, error } = await betterFetch<PlanResponse>(`${env.API_URL}/user/plan`, {
      headers: { cookie },
    })

    if (error || !data) {
      console.error('getUserPlan failed', { status: error?.status })
      return null
    }

    return {
      plan: data.plan
        ? { sessionId: data.plan.sessionId, blocks: data.plan.blocks, wentLive: data.plan.wentLive }
        : null,
      links: data.links.map(l => ({ ...l, taskId: String(l.taskId) })),
    }
  } catch {
    console.error('getUserPlan failed', { status: 'exception' })
    return null
  }
}
