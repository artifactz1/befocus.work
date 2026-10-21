'use client'

import type { PlanBlock } from '@repo/types/plan'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { addFocusBlock, nudgeBlock, planTask, removeBlock, seedFromSettings } from '~/lib/plan/plan'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'
import { failToast, whenTaskSaved } from '~/lib/tasks/task-writes'
import {
  GUEST_PLAN_KEY,
  guestPlanSchema,
  parseGuestPlan,
  toGuestPlan,
} from '~/lib/tasks/tasks-storage'
import { useTimerStoreApi } from '~/store/useTimerStore'
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

type LinkWrite = { blockId: string; taskId: string; planned: boolean }

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
        return { blockId: w.blockId, taskId: Number(taskId), planned: w.planned }
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

  const edit = (blocks: PlanBlock[]) => {
    const { plan, setPlan } = store.getState()
    if (!plan) return
    setPlan({ ...plan, blocks })
    saveSoon(store)
  }

  return {
    addFocus: () => {
      const plan = store.getState().plan
      if (!plan) return
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
    nudge: (id: string, delta: number) => {
      const plan = store.getState().plan
      if (plan) edit(nudgeBlock(plan.blocks, id, delta))
    },
    /** Resolves once the server holds the current local plan; rejects when the PUT fails. */
    ensurePlanSaved: () => ensureSaved(store),
    /** The next ensurePlanSaved PUTs again (09-06 retries once on 404 "No open plan"). */
    markPlanUnsaved: () => store.getState().markUnsaved(),
  }
}
