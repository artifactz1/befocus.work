'use client'

import type { Task } from '@repo/types/tasks'
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useStore } from 'zustand/react'
import { createStore } from 'zustand/vanilla'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'
import {
  GUEST_TASKS_KEY,
  guestTasksSchema,
  parseGuestTasks,
  toGuestTasks,
} from '~/lib/tasks/tasks-storage'

export type TasksMode = 'guest' | 'account'

interface TasksState {
  mode: TasksMode
  tasks: Task[] // newest first
  loadState: 'ready' | 'error'
  hydrateTasks: (tasks: Task[]) => void
  insertTask: (task: Task) => void
  patchTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  replaceTaskId: (tempId: string, id: string) => void
  dropTask: (id: string) => void
  setLoadState: (state: 'ready' | 'error') => void
}

// Per-request (never module-level) so one user's tasks cannot leak into another server render.
export function createTasksStore({ mode, tasks }: { mode: TasksMode; tasks: Task[] | null }) {
  return createStore<TasksState>()(set => ({
    mode,
    tasks: tasks ?? [],
    loadState: 'ready',
    hydrateTasks: next => set({ tasks: next, loadState: 'ready' }),
    insertTask: task => set(s => ({ tasks: [task, ...s.tasks] })),
    patchTask: (id, patch) =>
      set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) })),
    replaceTaskId: (tempId, id) =>
      set(s => ({ tasks: s.tasks.map(t => (t.id === tempId ? { ...t, id } : t)) })),
    dropTask: id => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
    setLoadState: loadState => set({ loadState }),
  }))
}

type TasksStoreApi = ReturnType<typeof createTasksStore>

let warned = false
function warnStorageOnce() {
  if (warned) return
  warned = true
  toast("This browser isn't saving your tasks. Private browsing can block storage.")
}

// Guest only: read once after mount, then write on every change. Hydrating first means the
// empty initial state never overwrites saved tasks.
function useGuestPersistence(store: TasksStoreApi) {
  useEffect(() => {
    if (store.getState().mode !== 'guest') return
    if (!defaultStorage()) warnStorageOnce()
    store.getState().hydrateTasks(parseGuestTasks(readStored(GUEST_TASKS_KEY, guestTasksSchema)))
    let last = store.getState().tasks
    return store.subscribe(state => {
      if (state.tasks === last) return
      last = state.tasks
      if (!writeStored(GUEST_TASKS_KEY, toGuestTasks(state.tasks))) warnStorageOnce()
    })
  }, [store])
}

const TasksStoreContext = createContext<TasksStoreApi | undefined>(undefined)

export function TasksStoreProvider({
  mode,
  initialTasks,
  children,
}: {
  mode: TasksMode
  initialTasks: Task[] | null
  children: ReactNode
}) {
  const ref = useRef<TasksStoreApi | null>(null)
  if (!ref.current) ref.current = createTasksStore({ mode, tasks: initialTasks })
  useGuestPersistence(ref.current)
  return <TasksStoreContext.Provider value={ref.current}>{children}</TasksStoreContext.Provider>
}

export function useTasksStoreApi() {
  const store = useContext(TasksStoreContext)
  if (!store) throw new Error('useTasksStoreApi must be used within TasksStoreProvider')
  return store
}

export function useTasksStore<T>(selector: (state: TasksState) => T): T {
  return useStore(useTasksStoreApi(), selector)
}
