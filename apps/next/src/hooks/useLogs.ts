'use client'

import { type BlockLog, HISTORY_DAYS, type History, type SessionNote } from '@repo/types/logs'
import type { TaskLink } from '@repo/types/plan'
import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { readGuestRecords } from '~/lib/blocks/block-records'
import {
  GUEST_LOGS_KEY,
  GUEST_NOTES_KEY,
  guestHistory,
  guestItemsSchema,
  parseGuestLogs,
  parseGuestNotes,
  upsertGuestLog,
  upsertGuestNote,
} from '~/lib/logs/logs-storage'
import { readStored, writeStored } from '~/lib/storage/browser-storage'
import {
  appendGuestLinkHistory,
  GUEST_LINK_HISTORY_KEY,
  GUEST_TASKS_KEY,
  guestLinkHistorySchema,
  guestTasksSchema,
  parseGuestLinkHistory,
  parseGuestTasks,
  toGuestTasks,
} from '~/lib/tasks/tasks-storage'
import type { createTasksStore, TasksMode } from '~/store/useToDoStore'

// The /log page has no TasksStoreProvider, so callers pass the store (or null).
export type TasksStoreApi = ReturnType<typeof createTasksStore>

const SAVE_CHANGE_FAILED = "Couldn't save that change. Check your connection and try again."
const STORAGE_BLOCKED = "This browser isn't saving your log. Private browsing can block storage."
const HISTORY_KEY = ['history']

let warned = false
const warnStorageOnce = () => {
  if (warned) return
  warned = true
  toast(STORAGE_BLOCKED)
}

// Guest writes bump this so every mounted useHistory re-reads storage.
let guestVersion = 0
const listeners = new Set<() => void>()
const bumpGuest = () => {
  guestVersion++
  for (const l of listeners) l()
}
const subscribeGuest = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function writeGuest(key: string, value: unknown): boolean {
  const ok = writeStored(key, value)
  if (!ok) warnStorageOnce()
  return ok
}

const readItems = (key: string) => readStored(key, guestItemsSchema)

const stamp = () => new Date().toISOString()

type Tick = { blockId: string; taskId: string; completed: boolean }

export function useLogActions(mode: TasksMode, store: TasksStoreApi | null) {
  const queryClient = useQueryClient()
  const done = () => {
    if (mode === 'guest') bumpGuest()
    else void queryClient.invalidateQueries({ queryKey: HISTORY_KEY })
  }

  const hadLog = (blockId: string) =>
    mode === 'guest'
      ? parseGuestLogs(readItems(GUEST_LOGS_KEY)).some(l => l.blockId === blockId)
      : (queryClient.getQueryData<InfiniteData<History>>(HISTORY_KEY)?.pages ?? []).some(p =>
          p.logs.some(l => l.blockId === blockId),
        )

  const saveLog = async (log: BlockLog, blockNumber: number): Promise<boolean> => {
    if (!log.text.trim() && log.rating === null && !hadLog(log.blockId)) return true
    if (mode === 'guest') {
      const ok = writeGuest(GUEST_LOGS_KEY, upsertGuestLog(readItems(GUEST_LOGS_KEY), log))
      if (ok) done()
      return ok
    }
    try {
      const res = await api.user['block-logs'].$put({ json: log })
      if (!res.ok) throw new Error('block log save failed')
      done()
      return true
    } catch {
      toast(`Couldn't save your log for block ${blockNumber}. Check your connection and try again.`)
      return false
    }
  }

  const saveTicks = async (items: Tick[]): Promise<boolean> => {
    if (items.length === 0) return true
    const s = store?.getState()
    const prevLinks = s?.links ?? []
    const prevTasks = s?.tasks ?? []
    const at = stamp()
    const mark = (l: TaskLink, completed: boolean): TaskLink => ({
      ...l,
      worked: true,
      completed,
      workedAt: l.workedAt ?? at,
      completedAt: completed ? at : null,
    })
    const live = (i: Tick) => (l: TaskLink) => l.blockId === i.blockId && l.taskId === i.taskId

    // The tick writes the Phase 9 completed link, never a second completion path.
    if (s) {
      s.setLinks(
        s.links.map(l => {
          const item = items.find(i => live(i)(l))
          return item ? mark(l, item.completed) : l
        }),
      )
      for (const i of items) s.patchTask(i.taskId, { completed: i.completed })
    }

    if (mode === 'guest') {
      // Ticks outside the live plan (a closed session) rewrite the stored link history.
      const stored = parseGuestLinkHistory(
        readStored(GUEST_LINK_HISTORY_KEY, guestLinkHistorySchema),
      )
      const rest = s ? items.filter(i => !prevLinks.some(live(i))) : items
      const changed = rest.map(i => {
        const found = stored.find(live(i))
        return mark(
          found ?? {
            blockId: i.blockId,
            taskId: i.taskId,
            planned: false,
            worked: true,
            completed: false,
            workedAt: null,
            completedAt: null,
          },
          i.completed,
        )
      })
      let ok = true
      if (changed.length > 0) {
        ok = writeGuest(
          GUEST_LINK_HISTORY_KEY,
          appendGuestLinkHistory(
            readStored(GUEST_LINK_HISTORY_KEY, guestLinkHistorySchema),
            changed,
          ),
        )
      }
      if (!s) {
        // No store to persist the tasks: rewrite them directly.
        const tasks = parseGuestTasks(readStored(GUEST_TASKS_KEY, guestTasksSchema)).map(t => {
          const item = items.find(i => i.taskId === t.id)
          return item ? { ...t, completed: item.completed } : t
        })
        ok = writeGuest(GUEST_TASKS_KEY, toGuestTasks(tasks)) && ok
      }
      if (ok) done()
      return ok
    }

    try {
      const links = items.map(i => ({ ...i, taskId: Number(i.taskId) }))
      const res = await api.user['block-links'].$put({ json: { links } })
      if (!res.ok) throw new Error('block links save failed')
      done()
      return true
    } catch {
      if (s) {
        s.setLinks(prevLinks)
        for (const i of items) {
          const before = prevTasks.find(t => t.id === i.taskId)
          if (before) s.patchTask(i.taskId, { completed: before.completed })
        }
      }
      toast(SAVE_CHANGE_FAILED)
      return false
    }
  }

  const saveNote = async (note: SessionNote): Promise<boolean> => {
    if (mode === 'guest') {
      const ok = writeGuest(GUEST_NOTES_KEY, upsertGuestNote(readItems(GUEST_NOTES_KEY), note))
      if (ok) done()
      return ok
    }
    try {
      const res = await api.user['session-notes'].$put({ json: note })
      if (!res.ok) throw new Error('session note save failed')
      done()
      return true
    } catch {
      toast(SAVE_CHANGE_FAILED)
      return false
    }
  }

  return { saveLog, saveTicks, saveNote }
}

const EMPTY: History = { records: [], logs: [], notes: [], links: [], nextBefore: null }

export function useHistory(mode: TasksMode, store: TasksStoreApi | null) {
  const account = mode === 'account'
  const query = useInfiniteQuery({
    queryKey: HISTORY_KEY,
    enabled: account,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await api.user.history.$get({
        query: { before: pageParam, days: HISTORY_DAYS.default },
      })
      if (!res.ok) throw new Error('Failed to fetch history')
      return (await res.json()) as History
    },
    getNextPageParam: last => last.nextBefore ?? undefined,
    refetchOnWindowFocus: false,
  })

  // Guest: read after mount (SSR renders loading); a save or a live tick re-reads.
  const version = useSyncExternalStore(
    subscribeGuest,
    () => guestVersion,
    () => 0,
  )
  const [liveTick, setLiveTick] = useState(0)
  const [windows, setWindows] = useState(1)
  const [guest, setGuest] = useState<History | null>(null)
  useEffect(() => {
    if (account || !store) return
    let last = store.getState().links
    return store.subscribe(s => {
      if (s.links === last) return
      last = s.links
      setLiveTick(n => n + 1)
    })
  }, [account, store])
  // biome-ignore lint/correctness/useExhaustiveDependencies: version and liveTick are re-read triggers
  useEffect(() => {
    if (account) return
    setGuest(
      guestHistory(
        {
          records: readGuestRecords(),
          linkHistory: parseGuestLinkHistory(
            readStored(GUEST_LINK_HISTORY_KEY, guestLinkHistorySchema),
          ),
          liveLinks: store?.getState().links ?? [],
          tasks: parseGuestTasks(readStored(GUEST_TASKS_KEY, guestTasksSchema)),
          logs: parseGuestLogs(readItems(GUEST_LOGS_KEY)),
          notes: parseGuestNotes(readItems(GUEST_NOTES_KEY)),
        },
        { before: Date.now(), days: HISTORY_DAYS.default * windows },
      ),
    )
  }, [account, store, version, liveTick, windows])

  const { refetch, fetchNextPage } = query
  const refetchAll = useCallback(() => {
    if (account) void refetch()
    else bumpGuest()
  }, [account, refetch])
  const fetchOlder = useCallback(() => {
    if (account) void fetchNextPage()
    else setWindows(n => n + 1)
  }, [account, fetchNextPage])

  const pages = query.data?.pages
  const history: History = account
    ? pages
      ? {
          records: pages.flatMap(p => p.records),
          logs: pages.flatMap(p => p.logs),
          notes: pages.flatMap(p => p.notes),
          links: pages.flatMap(p => p.links),
          nextBefore: pages[pages.length - 1]?.nextBefore ?? null,
        }
      : EMPTY
    : (guest ?? EMPTY)

  const status: 'loading' | 'ready' | 'error' = account
    ? query.isError
      ? 'error'
      : query.isPending
        ? 'loading'
        : 'ready'
    : guest
      ? 'ready'
      : 'loading'

  return {
    history,
    status,
    refetch: refetchAll,
    fetchOlder,
    hasOlder: account ? query.hasNextPage : history.nextBefore !== null,
  }
}
