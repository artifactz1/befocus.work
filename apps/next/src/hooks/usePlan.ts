'use client'

import type { PlanBlock, TaskLink } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { isLive } from '~/lib/blocks/blocks'
import { deriveNow, openInBlock } from '~/lib/plan/now'
import {
  addFocusBlock,
  buildSessionView,
  followTimerBlocks,
  nudgeBlock,
  planTask,
  reconcilePlan,
  removeBlock,
  reseedFromSettings,
  type SessionView,
  seedFromSettings,
  toSeed,
} from '~/lib/plan/plan'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'
import { failToast, whenTaskSaved } from '~/lib/tasks/task-writes'
import {
  appendGuestLinkHistory,
  GUEST_LINK_HISTORY_KEY,
  GUEST_PLAN_KEY,
  guestLinkHistorySchema,
  guestPlanSchema,
  parseGuestPlan,
  toGuestPlan,
} from '~/lib/tasks/tasks-storage'
import { useTimerStore, useTimerStoreApi } from '~/store/useTimerStore'
import { useTasksStore, useTasksStoreApi } from '~/store/useToDoStore'

type TasksApi = ReturnType<typeof useTasksStoreApi>

const DEBOUNCE_MS = 300
const SAVE_FAILED = "Couldn't save your plan. Check your connection and try again."

// One saver per store, shared by every hook instance. Saves run one at a time: a request made
// while one is in flight waits, then sends whatever the latest plan is (or nothing if saved).
interface Saver {
  timer: ReturnType<typeof setTimeout> | null
  chain: Promise<void>
}
const savers = new WeakMap<TasksApi, Saver>()
const saverOf = (store: TasksApi) => {
  let saver = savers.get(store)
  if (!saver) {
    saver = { timer: null, chain: Promise.resolve() }
    savers.set(store, saver)
  }
  return saver
}

async function send(store: TasksApi) {
  const { mode, plan, planRevision, savedRevision, markSaved } = store.getState()
  if (mode === 'guest' || !plan || savedRevision >= planRevision) return
  const res = await api.user.plan.$put({
    json: { sessionId: plan.sessionId, blocks: plan.blocks, wentLive: plan.wentLive },
  })
  if (!res.ok) throw new Error('plan save failed')
  markSaved(planRevision)
}

function enqueue(store: TasksApi): Promise<void> {
  const saver = saverOf(store)
  if (saver.timer) clearTimeout(saver.timer)
  saver.timer = null
  const next = saver.chain.catch(() => {}).then(() => send(store))
  saver.chain = next
  return next
}

// Fire-and-forget save that surfaces failure as a retry toast (no rollback).
function save(store: TasksApi) {
  enqueue(store).catch(() =>
    toast(SAVE_FAILED, { action: { label: 'Try again', onClick: () => save(store) } }),
  )
}

function saveSoon(store: TasksApi) {
  if (store.getState().mode === 'guest') return
  const saver = saverOf(store)
  if (saver.timer) clearTimeout(saver.timer)
  saver.timer = setTimeout(() => save(store), DEBOUNCE_MS)
}

// ponytail: minutes are whole numbers in Session settings, rounding guards a stray legacy value
const minutes = (seconds: number) => Math.round(seconds / 60)

/**
 * Mount once (TasksCard, rendered by both layouts): reads the guest plan, seeds a missing plan
 * from Session settings, adopts the current session id while the plan is not live, and persists.
 */
export function usePlanBootstrap() {
  const store = useTasksStoreApi()
  const timer = useTimerStoreApi()
  // a successful retry after a failed server read flips this to 'ready' and re-runs the effect
  const planLoad = useTasksStore(s => s.planLoad)

  useEffect(() => {
    const s = store.getState()
    if (s.mode === 'account' && planLoad === 'error') return

    if (s.mode === 'guest') {
      if (defaultStorage()) {
        const stored = parseGuestPlan(readStored(GUEST_PLAN_KEY, guestPlanSchema))
        if (stored.plan) {
          s.setPlan(stored.plan)
          s.setLinks(stored.links)
        }
      }
    }

    const { sessionId, sessions, workDuration, breakDuration } = timer.getState()
    const current = store.getState().plan
    if (!current) {
      store.getState().setPlan({
        sessionId,
        wentLive: false,
        blocks: seedFromSettings({
          sessions,
          workMinutes: minutes(workDuration),
          breakMinutes: minutes(breakDuration),
        }),
      })
    } else if (current.sessionId !== sessionId && !current.wentLive) {
      // the session id is not persisted, so a stored plan from a past load is adopted
      store.getState().setPlan({ ...current, sessionId })
    }
    if (store.getState().mode === 'account') save(store)

    if (store.getState().mode !== 'guest') return
    let { plan: lastPlan, links: lastLinks } = store.getState()
    const write = () => {
      const { plan, links } = store.getState()
      if (plan) writeStored(GUEST_PLAN_KEY, toGuestPlan(plan, links))
    }
    write()
    return store.subscribe(state => {
      if (state.plan === lastPlan && state.links === lastLinks) return
      lastPlan = state.plan
      lastLinks = state.links
      write()
    })
  }, [store, timer, planLoad])
}

type LinkWrite = {
  blockId: string
  taskId: string
  planned?: boolean
  worked?: boolean
  completed?: boolean
}

const focusNumber = (store: TasksApi, blockId: string) => {
  const focus = store.getState().plan?.blocks.filter(b => b.kind === 'focus') ?? []
  return focus.findIndex(b => b.id === blockId) + 1
}

// Link writes run one at a time per store so a quick move never lands out of order.
const linkChains = new WeakMap<TasksApi, Promise<unknown>>()

/** Account mode: PUT /user/task-links after the plan and every task create have landed. */
async function writeLinks(store: TasksApi, writes: LinkWrite[]) {
  const run = async () => {
    await ensureSaved(store)
    const links = await Promise.all(
      writes.map(async w => {
        const taskId = await whenTaskSaved(w.taskId)
        if (!taskId) throw new Error('task create failed')
        return { ...w, taskId: Number(taskId) }
      }),
    )
    const put = () => api.user['task-links'].$put({ json: { links } })
    let res = await put()
    if (res.status === 404) {
      // the server has no plan (deleted elsewhere): send ours again, then retry once
      store.getState().markUnsaved()
      await ensureSaved(store)
      res = await put()
    }
    if (!res.ok) throw new Error('task link write failed')
  }
  const next = (linkChains.get(store) ?? Promise.resolve()).catch(() => {}).then(run)
  linkChains.set(store, next)
  return next
}

function ensureSaved(store: TasksApi): Promise<void> {
  const { mode, savedRevision, planRevision } = store.getState()
  if (mode === 'guest') return Promise.resolve()
  if (saverOf(store).timer !== null || savedRevision < planRevision) return enqueue(store)
  return Promise.resolve()
}

export function usePlanActions() {
  const store = useTasksStoreApi()
  const timer = useTimerStoreApi()

  // Index of the last block that can no longer change (done or current); -1 while planning.
  const lockedUpTo = (blocks: PlanBlock[]) => {
    const t = timer.getState()
    return isLive(t) ? blocks.findIndex(b => b.id === t.currentBlockId) : -1
  }

  const edit = (blocks: PlanBlock[]) => {
    const { plan, setPlan } = store.getState()
    if (!plan) return
    setPlan({ ...plan, blocks })
    saveSoon(store)
  }

  return {
    addFocus: () => {
      const plan = store.getState().plan
      // planning only (the live Session card has no add row)
      if (!plan || isLive(timer.getState())) return
      const { workDuration, breakDuration } = timer.getState()
      edit(
        addFocusBlock(plan.blocks, {
          workMinutes: minutes(workDuration),
          breakMinutes: minutes(breakDuration),
        }),
      )
    },
    removeFocus: (id: string) => {
      const { plan, links } = store.getState()
      if (!plan) return
      const { blocks, removedIndex } = removeBlock(plan.blocks, id)
      if (removedIndex < 0) return
      const locked = lockedUpTo(plan.blocks)
      const survivors = new Set(blocks.map(b => b.id))
      if (plan.blocks.some((b, i) => !survivors.has(b.id) && i <= locked)) return
      const number = plan.blocks.slice(0, removedIndex + 1).filter(b => b.kind === 'focus').length
      const kept = new Set(blocks.map(b => b.id))
      // Tasks of the removed block go unplanned locally; the plan save clears them on the server.
      const released = links.filter(l => l.planned && !kept.has(l.blockId))
      store
        .getState()
        .setLinks(links.map(l => (released.includes(l) ? { ...l, planned: false } : l)))
      edit(blocks)
      toast(`Block ${number} removed`, {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: async () => {
            edit(plan.blocks)
            // a task the user has since planned elsewhere stays where it is
            const back = released.filter(
              l => !store.getState().links.some(x => x.taskId === l.taskId && x.planned),
            )
            for (const l of back) {
              store.getState().setLinks(planTask(store.getState().links, l.taskId, l.blockId))
            }
            if (store.getState().mode === 'guest' || back.length === 0) return
            try {
              await writeLinks(
                store,
                back.map(l => ({ blockId: l.blockId, taskId: l.taskId, planned: true })),
              )
            } catch {
              toast.error("Couldn't restore the tasks of that block. Check your connection.")
            }
          },
        },
      })
    },
    /** Plans a task in a block (moving it from any other), or in none with `null`. */
    assignTask: async (taskId: string, blockId: string | null) => {
      const state = store.getState()
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) return
      const from = state.links.find(l => l.taskId === taskId && l.planned)?.blockId ?? null
      if (from === blockId) return
      const previous = state.links.filter(l => l.taskId === taskId)
      state.setLinks(planTask(state.links, taskId, blockId))
      const n = focusNumber(store, blockId ?? from ?? '')
      state.announce(
        blockId === null
          ? `${task.text} removed from Block ${n}`
          : from
            ? `${task.text} moved to Block ${n}`
            : `${task.text} added to Block ${n}`,
      )
      if (state.mode === 'guest') return
      const write =
        blockId === null ? { blockId: from ?? '', planned: false } : { blockId, planned: true }
      try {
        await writeLinks(store, [{ ...write, taskId }])
      } catch {
        // restore only this task's links; other tasks may have changed meanwhile
        const rest = store.getState().links.filter(l => l.taskId !== taskId)
        store.getState().setLinks([...rest, ...previous])
        failToast(task.text)
      }
    },
    /** Makes a task the now task of the current focus block (moving it in when planned elsewhere). */
    setNow: (taskId: string) => writeNow(store, timer, taskId),
    nudge: (id: string, delta: number) => {
      const plan = store.getState().plan
      if (!plan || plan.blocks.findIndex(b => b.id === id) <= lockedUpTo(plan.blocks)) return
      edit(nudgeBlock(plan.blocks, id, delta))
    },
    /** Resolves once the server holds the current local plan; rejects when the PUT fails. */
    ensurePlanSaved: () => ensureSaved(store),
    /** The next ensurePlanSaved PUTs again (09-06 retries once on 404 "No open plan"). */
    markPlanUnsaved: () => store.getState().markUnsaved(),
  }
}

type TimerApi = ReturnType<typeof useTimerStoreApi>

const CLOSE_FAILED = "Couldn't close your plan. Check your connection and try again."

const sameSeed = (
  a: { id: string; plannedSeconds: number }[],
  b: { id: string; plannedSeconds: number }[],
) =>
  a.length === b.length &&
  a.every((x, i) => x.id === b[i]?.id && x.plannedSeconds === b[i]?.plannedSeconds)

// Closes the finished or reset session's plan and opens a fresh one for the timer's new session.
// A failed DELETE keeps the old plan: a PUT after it would clear `planned` on the old links.
const closing = new WeakSet<TasksApi>()
async function closePlan(store: TasksApi, timer: TimerApi) {
  if (closing.has(store)) return
  closing.add(store)
  try {
    if (store.getState().mode === 'account') {
      try {
        const res = await api.user.plan.$delete()
        if (!res.ok) throw new Error('plan close failed')
      } catch {
        toast(CLOSE_FAILED, {
          action: { label: 'Try again', onClick: () => void closePlan(store, timer) },
        })
        return
      }
    }
    const { sessionId, sessions, workDuration, breakDuration } = timer.getState()
    const s = store.getState()
    if (s.mode === 'guest' && defaultStorage()) {
      // Phase 10 reads this history for the block record; a failed write must not stop the close
      try {
        const raw = readStored(GUEST_LINK_HISTORY_KEY, guestLinkHistorySchema)
        writeStored(GUEST_LINK_HISTORY_KEY, appendGuestLinkHistory(raw, s.links))
      } catch (error) {
        console.error('Could not save the task link history', error)
      }
    }
    s.markUnsaved()
    s.setLinks([])
    s.setPlan({
      sessionId,
      wentLive: false,
      blocks: seedFromSettings({
        sessions,
        workMinutes: minutes(workDuration),
        breakMinutes: minutes(breakDuration),
      }),
    })
    save(store)
  } finally {
    closing.delete(store)
  }
}

/**
 * Mount once (TasksCard): keeps the plan and the timer's block list in step. The plan seeds the
 * timer before the start and its ahead blocks while live; the plan goes live with the first block
 * and closes when the timer's session id changes (finish or reset).
 */
export function usePlanSync() {
  const store = useTasksStoreApi()
  const timer = useTimerStoreApi()
  const planLoad = useTasksStore(s => s.planLoad)

  useEffect(() => {
    if (store.getState().mode === 'account' && planLoad === 'error') return

    // The plan is the source for the timer's list; compare first so a timer update never loops.
    const seedTimer = () => {
      const plan = store.getState().plan
      const t = timer.getState()
      if (!plan || plan.sessionId !== t.sessionId) return
      const seed = toSeed(plan)
      const at = t.blocks.findIndex(b => b.id === t.currentBlockId)
      const live = isLive(t)
      const cut = live ? at + 1 : 0 // live: done and current blocks stay as they are
      if (sameSeed(t.blocks.slice(cut), seed.slice(cut))) return
      timer.getState().seedBlocks({ sessionId: plan.sessionId, blocks: seed })
    }

    let last = timer.getState()
    const onTimer = () => {
      const t = timer.getState()
      const prev = last
      last = t
      const s = store.getState()
      let plan = s.plan
      if (!plan) return

      if (t.sessionId !== prev.sessionId || plan.sessionId !== t.sessionId) {
        const action = reconcilePlan(plan, s.links, t)
        if (action === 'close') return void closePlan(store, timer)
        if (action === 'adopt') {
          plan = { ...plan, sessionId: t.sessionId }
          if (isLive(t)) {
            // started under new block ids (Session settings Start): follow them, keep assignments
            const next = followTimerBlocks(plan.blocks, s.links, t.blocks)
            plan = { ...plan, blocks: next.blocks }
            s.setLinks(next.links)
          }
          s.setPlan(plan)
          save(store)
        }
      }
      if (plan.sessionId !== t.sessionId) return

      // Session settings changed before the start: the plan follows them.
      const changed =
        t.sessions !== prev.sessions ||
        t.workDuration !== prev.workDuration ||
        t.breakDuration !== prev.breakDuration
      if (changed && !plan.wentLive && !isLive(t)) {
        const blocks = reseedFromSettings(plan.blocks, {
          sessions: t.sessions,
          workMinutes: minutes(t.workDuration),
          breakMinutes: minutes(t.breakDuration),
        })
        const kept = new Set(blocks.map(b => b.id))
        // dropped blocks release their tasks locally; the plan save clears them on the server
        s.setLinks(
          s.links.map(l => (l.planned && !kept.has(l.blockId) ? { ...l, planned: false } : l)),
        )
        plan = { ...plan, blocks }
        s.setPlan(plan)
        save(store)
      }

      if (!plan.wentLive && t.blocks.some(b => b.startedAt !== null)) {
        s.setPlan({ ...plan, wentLive: true })
        save(store)
      }

      if (t.currentBlockId !== prev.currentBlockId && t.sessionId === prev.sessionId) {
        const block = t.blocks.find(b => b.id === t.currentBlockId)
        if (block && t.status === 'running') {
          const focus = t.blocks.filter(b => b.kind === 'focus')
          s.announce(
            block.kind === 'break'
              ? 'Break started'
              : `Block ${focus.findIndex(b => b.id === block.id) + 1} of ${focus.length} started`,
          )
        }
      }
      if (
        t.status === 'running' &&
        (prev.status !== 'running' || t.currentBlockId !== prev.currentBlockId)
      ) {
        // a block run without any pick still records the default now task as worked on
        const fresh = store.getState()
        const now = deriveNow(fresh.links, fresh.tasks, t.currentBlockId)
        const linked = fresh.links.find(l => l.taskId === now && l.blockId === t.currentBlockId)
        if (now && !linked?.worked) void writeNow(store, timer, now, true)
      }
      seedTimer()
    }

    // mount: a stored plan from an earlier load is adopted or closed; then align the lists
    onTimer()
    const offTimer = timer.subscribe(onTimer)
    const offTasks = store.subscribe((state, prev) => {
      if (state.plan !== prev.plan) seedTimer()
    })
    return () => {
      offTimer()
      offTasks()
    }
  }, [store, timer, planLoad])
}

// Shared tick: every second while a block runs, every minute otherwise (and on tab focus).
function useTick(ms: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, ms)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [ms])
  return now
}

/** The one live description of the session (column, progress slot, now line). Null until a plan exists. */
export function useSessionView(): SessionView | null {
  const plan = useTasksStore(s => s.plan)
  const links = useTasksStore(s => s.links)
  const tasks = useTasksStore(s => s.tasks)
  const blocks = useTimerStore(s => s.blocks)
  const currentBlockId = useTimerStore(s => s.currentBlockId)
  const status = useTimerStore(s => s.status)
  const timeLeft = useTimerStore(s => s.timeLeft)
  const now = useTick(status === 'running' ? 1000 : 60_000)
  return useMemo(
    () =>
      plan
        ? buildSessionView({
            plan,
            storeBlocks: blocks,
            currentBlockId,
            paused: status === 'paused',
            timeLeft,
            links,
            tasks,
            now,
          })
        : null,
    [plan, blocks, currentBlockId, status, timeLeft, links, tasks, now],
  )
}

/** Id of the current block while it is a running or paused focus block of the open plan, else null. */
function liveFocusBlock(store: TasksApi, timer: TimerApi): string | null {
  const t = timer.getState()
  const s = store.getState()
  const current = t.blocks.find(b => b.id === t.currentBlockId)
  if (current?.kind !== 'focus' || (t.status !== 'running' && t.status !== 'paused')) return null
  if (!s.plan || s.plan.sessionId !== t.sessionId || !s.plan.blocks.some(b => b.id === current.id))
    return null
  return current.id
}

/**
 * Live completion rule: while a focus block runs or is paused, ticking any task writes a link on
 * the current block (the task moves into it). Planning, breaks and an ended session write none.
 */
export async function writeCompletion(
  store: TasksApi,
  timer: TimerApi,
  taskId: string,
  checked: boolean,
) {
  const s = store.getState()
  const blockId = liveFocusBlock(store, timer)
  if (!blockId) return
  const task = s.tasks.find(x => x.id === taskId)
  const previous = s.links.filter(l => l.taskId === taskId)
  const stamp = new Date().toISOString()
  const mark = (fn: (l: TaskLink) => TaskLink) => (links: TaskLink[]) =>
    links.map(l => (l.taskId === taskId && l.blockId === blockId ? fn(l) : l))
  s.setLinks(
    checked
      ? mark(l => ({
          ...l,
          worked: true,
          completed: true,
          workedAt: l.workedAt ?? stamp,
          completedAt: stamp,
        }))(planTask(s.links, taskId, blockId))
      : mark(l => ({ ...l, completed: false, completedAt: null }))(s.links),
  )
  if (s.mode === 'guest') return
  try {
    await writeLinks(store, [
      checked
        ? { blockId, taskId, completed: true, worked: true, planned: true }
        : { blockId, taskId, completed: false },
    ])
  } catch {
    const rest = store.getState().links.filter(l => l.taskId !== taskId)
    store.getState().setLinks([...rest, ...previous])
    failToast(task?.text ?? 'task')
  }
}

/**
 * Now pick: the task becomes the now task of the current focus block (planned and worked there).
 * `quiet` skips the announcement (the automatic default at block start).
 */
export async function writeNow(store: TasksApi, timer: TimerApi, taskId: string, quiet = false) {
  const s = store.getState()
  const blockId = liveFocusBlock(store, timer)
  const task = s.tasks.find(x => x.id === taskId)
  if (!blockId || !task) return
  const previous = s.links.filter(l => l.taskId === taskId)
  const stamp = new Date().toISOString()
  s.setLinks(
    planTask(s.links, taskId, blockId).map(l =>
      l.taskId === taskId && l.blockId === blockId ? { ...l, worked: true, workedAt: stamp } : l,
    ),
  )
  if (!quiet) s.announce(`Now working on ${task.text}`)
  if (s.mode === 'guest') return
  try {
    await writeLinks(store, [{ blockId, taskId, planned: true, worked: true }])
  } catch {
    const rest = store.getState().links.filter(l => l.taskId !== taskId)
    store.getState().setLinks([...rest, ...previous])
    failToast(task.text)
  }
}

export type NowOption = { task: Task; block: number | null }

/** The now task and the pick lists for the current block. `active` only for a running or paused focus block. */
export function useNow() {
  const view = useSessionView()
  const status = useTimerStore(s => s.status)
  const tasks = useTasksStore(s => s.tasks)
  const links = useTasksStore(s => s.links)
  const plan = useTasksStore(s => s.plan)
  return useMemo(() => {
    const current = view?.current
    const active =
      !!current &&
      current.kind === 'focus' &&
      (status === 'running' || status === 'paused') &&
      view.state === 'live'
    const none = {
      active: false,
      task: null as Task | null,
      blockTasks: [] as Task[],
      otherOpen: [] as NowOption[],
      doneCount: 0,
      plannedCount: 0,
    }
    if (!active || !current || !view || !plan) return none
    const byId = (id: string) => tasks.find(t => t.id === id)
    const ids = openInBlock(links, tasks, current.id)
    const focusIds = plan.blocks.filter(b => b.kind === 'focus').map(b => b.id)
    const inBlock = new Set(ids)
    const otherOpen = tasks
      .filter(t => !t.archived && !t.completed && !inBlock.has(t.id))
      .map(t => {
        const at = links.find(l => l.taskId === t.id && l.planned)?.blockId
        const i = at ? focusIds.indexOf(at) : -1
        return { task: t, block: i < 0 ? null : i + 1 }
      })
    const nowId = deriveNow(links, tasks, current.id)
    return {
      active,
      task: (nowId && byId(nowId)) || null,
      blockTasks: ids.flatMap(id => byId(id) ?? []),
      otherOpen,
      doneCount: view.summary.doneTasks,
      plannedCount: view.summary.plannedTasks,
    }
  }, [view, status, tasks, links, plan])
}
