'use client'

import type { PlanBlock } from '@repo/types/plan'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { addFocusBlock, nudgeBlock, removeBlock, seedFromSettings } from '~/lib/plan/plan'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'
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
      const plan = store.getState().plan
      if (!plan) return
      const { blocks, removedIndex } = removeBlock(plan.blocks, id)
      if (removedIndex < 0) return
      const number = plan.blocks.slice(0, removedIndex + 1).filter(b => b.kind === 'focus').length
      edit(blocks)
      toast(`Block ${number} removed`, {
        duration: 5000,
        action: { label: 'Undo', onClick: () => edit(plan.blocks) },
      })
    },
    nudge: (id: string, delta: number) => {
      const plan = store.getState().plan
      if (plan) edit(nudgeBlock(plan.blocks, id, delta))
    },
    /** Resolves once the server holds the current local plan; rejects when the PUT fails. */
    ensurePlanSaved: (): Promise<void> => {
      const { mode, savedRevision, planRevision } = store.getState()
      if (mode === 'guest') return Promise.resolve()
      const pending = saverOf(store).timer !== null
      if (pending || savedRevision < planRevision) return enqueue(store)
      return Promise.resolve()
    },
    /** The next ensurePlanSaved PUTs again (09-06 retries once on 404 "No open plan"). */
    markPlanUnsaved: () => store.getState().markUnsaved(),
  }
}
