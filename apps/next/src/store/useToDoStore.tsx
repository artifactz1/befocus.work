'use client'

import type { TaskLink, TaskPlan } from '@repo/types/plan'
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
  plan: TaskPlan | null
  links: TaskLink[]
  planLoad: 'ready' | 'error'
  // bumped by every setPlan; savedRevision is the revision the server is known to hold
  planRevision: number
  savedRevision: number
  setPlan: (plan: TaskPlan) => void
  setLinks: (links: TaskLink[]) => void
  hydratePlan: (plan: TaskPlan | null, links: TaskLink[]) => void
  markSaved: (revision: number) => void
  markUnsaved: () => void
  // polite live region text for assignment results
  announcement: string
  announce: (message: string) => void
}

export type InitialPlan = { plan: TaskPlan | null; links: TaskLink[] } | null

// Per-request (never module-level) so one user's tasks cannot leak into another server render.
export function createTasksStore({
  mode,
  tasks,
  initialPlan = null,
}: {
  mode: TasksMode
  tasks: Task[] | null
  initialPlan?: InitialPlan
}) {
  return createStore<TasksState>()(set => ({
    mode,
    tasks: tasks ?? [],
    // a failed server fetch arrives as null; guests have no fetch
    loadState: mode === 'account' && tasks === null ? 'error' : 'ready',
    hydrateTasks: next => set({ tasks: next, loadState: 'ready' }),
    insertTask: task => set(s => ({ tasks: [task, ...s.tasks] })),
    patchTask: (id, patch) =>
      set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) })),
    replaceTaskId: (tempId, id) =>
      set(s => ({
        tasks: s.tasks.map(t => (t.id === tempId ? { ...t, id } : t)),
        links: s.links.map(l => (l.taskId === tempId ? { ...l, taskId: id } : l)),
      })),
    dropTask: id => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
    setLoadState: loadState => set({ loadState }),
    plan: initialPlan?.plan ?? null,
    links: initialPlan?.links ?? [],
    // a failed server fetch arrives as null; seeding then would overwrite a plan we could not read
    planLoad: mode === 'account' && initialPlan === null ? 'error' : 'ready',
    planRevision: 0,
    // server and local agree only when the server sent a plan
    savedRevision: initialPlan?.plan ? 0 : -1,
    setPlan: plan => set(s => ({ plan, planRevision: s.planRevision + 1 })),
    setLinks: links => set({ links }),
    // a plan read from the server agrees with the server by definition
    hydratePlan: (plan, links) =>
      set(s => ({ plan, links, planLoad: 'ready', savedRevision: plan ? s.planRevision : -1 })),
    markSaved: revision => set(s => ({ savedRevision: Math.max(s.savedRevision, revision) })),
    markUnsaved: () => set({ savedRevision: -1 }),
    announcement: '',
    announce: announcement => set({ announcement }),
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
  initialPlan = null,
  children,
}: {
  mode: TasksMode
  initialTasks: Task[] | null
  initialPlan?: InitialPlan
  children: ReactNode
}) {
  const ref = useRef<TasksStoreApi | null>(null)
  if (!ref.current) ref.current = createTasksStore({ mode, tasks: initialTasks, initialPlan })
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
