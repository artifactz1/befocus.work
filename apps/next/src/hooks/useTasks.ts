'use client'

import { TASK_TEXT_MAX, type Task } from '@repo/types/tasks'
import { useQuery } from '@tanstack/react-query'
import { api } from '~/lib/api.client'
import { nextNowAfterDone } from '~/lib/plan/now'
import { failToast, pendingCreates, whenTaskSaved } from '~/lib/tasks/task-writes'
import { useTimerStoreApi } from '~/store/useTimerStore'
import { useTasksStoreApi } from '~/store/useToDoStore'
import { usePlanActions, writeCompletion, writeNow } from './usePlan'

export { whenTaskSaved }

// Manual refetch only (the load-error retry); the first load is server-rendered
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
        later: row.later ?? false,
        laterAt: row.laterAt ? String(row.laterAt) : null,
      }))
    },
    refetchOnWindowFocus: false,
    enabled: false,
  })

export function useTaskActions() {
  const store = useTasksStoreApi()
  const { assignTask } = usePlanActions()
  const timer = useTimerStoreApi()

  const find = (id: string) => store.getState().tasks.find(t => t.id === id)

  // Optimistic patch; on account failure restore the previous fields and toast.
  const update = async (
    id: string,
    patch: Partial<Pick<Task, 'text' | 'completed' | 'archived' | 'later' | 'laterAt'>>,
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
      // laterAt is never sent: the server stamps it
      const { laterAt: _laterAt, ...json } = patch
      const res = await api.user.tasks[':id'].$put({ param: { id: current }, json })
      if (!res.ok) throw new Error('update failed')
    } catch {
      store.getState().patchTask(current, before)
      failToast(prev.text)
    }
  }

  const clean = (text: string) => text.trim().slice(0, TASK_TEXT_MAX)

  // Inserts at once; `saved` settles when the account create lands (guests: immediately).
  const start = (raw: string) => {
    const text = clean(raw)
    if (!text) return null
    const tempId = crypto.randomUUID()
    store.getState().insertTask({ id: tempId, text, completed: false, archived: false })
    if (store.getState().mode === 'guest') return { id: tempId, saved: Promise.resolve() }
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
    return { id: tempId, saved: create.then(() => {}) }
  }

  return {
    add: async (raw: string) => {
      await start(raw)?.saved
    },
    addToBlock: async (raw: string, blockId: string) => {
      const started = start(raw)
      if (!started) return
      await Promise.all([assignTask(started.id, blockId), started.saved])
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
    /** Sets the completed flag and applies the live rule (link on the current block). */
    completeTask: async (id: string, checked: boolean) => {
      if (!find(id)) return
      await Promise.all([
        update(id, { completed: checked }),
        writeCompletion(store, timer, id, checked),
      ])
    },
    /** Completes the now task (one completion path) and moves now to the next open task in the block. */
    markDone: async (id: string) => {
      const t = timer.getState()
      const { links, tasks } = store.getState()
      const next = nextNowAfterDone(links, tasks, t.currentBlockId, id)
      await Promise.all([update(id, { completed: true }), writeCompletion(store, timer, id, true)])
      if (next) await writeNow(store, timer, next)
    },
    archive: (id: string, opts?: { keepLinks?: boolean }) => {
      // an archived task leaves its block (discretion, UI-SPEC List > Archive)
      if (!opts?.keepLinks) void assignTask(id, null)
      return update(id, { archived: true })
    },
    /** Sets a task aside as Later (also unplans it) or brings it back. */
    setLater: (id: string, value: boolean, opts?: { keepLinks?: boolean }) => {
      if (value && !opts?.keepLinks) void assignTask(id, null)
      return update(
        id,
        value
          ? { later: true, laterAt: new Date().toISOString() }
          : { later: false, laterAt: null },
      )
    },
    restore: (id: string) => update(id, { archived: false }),
  }
}
