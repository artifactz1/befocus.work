'use client'

import { TASK_TEXT_MAX, type Task } from '@repo/types/tasks'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { useTasksStoreApi } from '~/store/useToDoStore'

// Fetch user tasks (manual refetch only; 09-04 replaces this with server-rendered hydration)
export const useUserTasks = () =>
  useQuery<Task[]>({
    queryKey: ['userTasks'],
    queryFn: async () => {
      const res = await api.user.tasks.$get()
      if (!res.ok) throw new Error('Failed to fetch user tasks')
      const rows = await res.json()
      return rows.map(row => ({
        id: String(row.id),
        text: row.text,
        completed: row.completed,
        archived: row.archived,
        createdAt: row.createdAt ? String(row.createdAt) : undefined,
      }))
    },
    refetchOnWindowFocus: false,
    enabled: false,
  })

// tempId -> in-flight create, so later actions on a fresh task wait for its server id
const pendingCreates = new Map<string, Promise<string | null>>()

const failToast = (text: string) =>
  toast.error(`Couldn't save ${text}. Check your connection and try again.`)

export function useTaskActions() {
  const store = useTasksStoreApi()

  const find = (id: string) => store.getState().tasks.find(t => t.id === id)

  // Optimistic patch; on account failure restore the previous fields and toast.
  const update = async (
    id: string,
    patch: Partial<Pick<Task, 'text' | 'completed' | 'archived'>>,
  ) => {
    const prev = find(id)
    if (!prev) return
    const before = Object.fromEntries(
      Object.keys(patch).map(k => [k, prev[k as keyof typeof patch]]),
    )
    store.getState().patchTask(id, patch)
    if (store.getState().mode === 'guest') return
    // the id is swapped for the server id once a pending create lands
    let current = id
    try {
      if (pendingCreates.has(id)) {
        const serverId = await pendingCreates.get(id)
        if (!serverId) throw new Error('create failed')
        current = serverId
      }
      const res = await api.user.tasks[':id'].$put({ param: { id: current }, json: patch })
      if (!res.ok) throw new Error('update failed')
    } catch {
      store.getState().patchTask(current, before)
      failToast(prev.text)
    }
  }

  const clean = (text: string) => text.trim().slice(0, TASK_TEXT_MAX)

  return {
    add: async (raw: string) => {
      const text = clean(raw)
      if (!text) return
      const tempId = crypto.randomUUID()
      store.getState().insertTask({ id: tempId, text, completed: false, archived: false })
      if (store.getState().mode === 'guest') return
      const create = (async () => {
        try {
          const res = await api.user.tasks.$post({ json: { text } })
          if (!res.ok) throw new Error('create failed')
          const row = await res.json()
          const id = String(row.id)
          store.getState().replaceTaskId(tempId, id)
          return id
        } catch {
          store.getState().dropTask(tempId)
          failToast(text)
          return null
        }
      })()
      pendingCreates.set(tempId, create)
      await create
      pendingCreates.delete(tempId)
    },
    edit: (id: string, raw: string) => {
      const text = clean(raw)
      if (!text || text === find(id)?.text) return
      return update(id, { text })
    },
    toggle: (id: string) => {
      const task = find(id)
      if (task) return update(id, { completed: !task.completed })
    },
    archive: (id: string) => update(id, { archived: true }),
    restore: (id: string) => update(id, { archived: false }),
  }
}
