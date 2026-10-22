'use client'

import type { BlockRecord } from '@repo/types/blocks'
import type { CarriedTask, TaskFate } from '@repo/types/logs'
import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'framer-motion'
import { History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useHistory, useLogActions } from '~/hooks/useLogs'
import { usePlanActions } from '~/hooks/usePlan'
import { useSummaryModel } from '~/hooks/useSummary'
import { useTaskActions } from '~/hooks/useTasks'
import { type FateOp, fateOps, toHistoryLinks } from '~/lib/logs/summary'
import { useDeckStore } from '~/store/useDeckStore'
import { useTimerStore } from '~/store/useTimerStore'
import { useTasksStore, useTasksStoreApi } from '~/store/useToDoStore'
import { useCustomizeActions } from '../customize/useCustomizeActions'
import card from '../settings/session-card.module.css'
import Timer from '../timer/Timer'
import { ExportMenu } from './ExportMenu'
import { SessionSummary } from './SessionSummary'

const ACCENT_FALLBACK = '#f5f5f4'

function burst() {
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--user-accent').trim() ||
    ACCENT_FALLBACK
  const base = {
    particleCount: 60,
    spread: 55,
    startVelocity: 45,
    ticks: 120,
    colors: [accent, '#a8a29e', '#78716c'],
    disableForReducedMotion: true,
  }
  void confetti({ ...base, angle: 60, origin: { x: 0, y: 1 } })
  void confetti({ ...base, angle: 120, origin: { x: 1, y: 1 } })
}

function LiveSummary({
  sessionId: endedId,
  records,
  celebrate,
}: {
  sessionId: string
  records: BlockRecord[]
  celebrate: boolean
}) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const sessionId = useTimerStore(s => s.sessionId)
  const resetAll = useTimerStore(s => s.resetAll)
  const store = useTasksStoreApi()
  const mode = useTasksStore(s => s.mode)
  const tasks = useTasksStore(s => s.tasks)
  const plan = useTasksStore(s => s.plan)
  const endedLinks = useTasksStore(s => s.endedLinks)
  const setEndedLinks = useTasksStore(s => s.setEndedLinks)
  const { setLater, archive, restore } = useTaskActions()
  const { assignTask } = usePlanActions()
  const { saveNote } = useLogActions(mode, store)
  const { history } = useHistory(mode, store)
  const { close: closeCustomize } = useCustomizeActions()

  // Until the new plan arrives, the store's links are the closing session's plan: fates then
  // patch the task only and never write links.
  const planReady = plan?.sessionId === sessionId

  const { summary, handlers } = useSummaryModel({
    mode,
    store,
    input: {
      sessionId: endedId,
      records,
      links: toHistoryLinks(endedLinks ?? [], tasks),
      logs: history.logs.filter(l => l.sessionId === endedId),
      note: history.notes.find(n => n.sessionId === endedId) ?? null,
      tasks,
      live: true,
    },
  })

  // Next session waits for the new plan; the set holds the task ids still to plan.
  const pendingPlan = useRef(new Set<string>())
  const fates = useRef<Record<string, TaskFate>>({})
  const planned = useRef({ planReady, firstFocus: plan?.blocks.find(b => b.kind === 'focus')?.id })
  planned.current = { planReady, firstFocus: plan?.blocks.find(b => b.kind === 'focus')?.id }

  const flush = () => {
    const { planReady: ready, firstFocus } = planned.current
    if (!ready || !firstFocus) return
    for (const taskId of pendingPlan.current) void assignTask(taskId, firstFocus)
    pendingPlan.current.clear()
  }

  const apply = (op: FateOp, taskId: string) => {
    switch (op) {
      case 'set-later':
        void setLater(taskId, true, { keepLinks: !planReady })
        break
      case 'clear-later':
        void setLater(taskId, false)
        break
      case 'archive':
        void archive(taskId, { keepLinks: !planReady })
        break
      case 'restore':
        void restore(taskId)
        break
      case 'unplan':
        pendingPlan.current.delete(taskId)
        if (planReady) void assignTask(taskId, null)
        break
      case 'plan-next':
        pendingPlan.current.add(taskId)
        flush()
        break
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: flush reads refs; runs when the plan lands
  useEffect(flush, [planReady, plan])

  const carriedOf = (): CarriedTask[] =>
    summary.notDone.map(n => ({
      taskId: n.taskId,
      text: n.text,
      fate: fates.current[n.taskId] ?? n.fate,
    }))

  const setFate = (taskId: string, to: TaskFate) => {
    const from = fates.current[taskId] ?? null
    if (from === to) return
    fates.current = { ...fates.current, [taskId]: to }
    for (const op of fateOps(from, to)) apply(op, taskId)
    handlers.setCarried(carriedOf())
  }

  // Once per summary: the default fates are applied and the note is saved at once, independent of
  // the plan. setCarried writes the note through saveNote(), and the note row is what marks the
  // session finished, so a reload or a failed plan close cannot leave it reading Stopped.
  const started = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per mounted summary
  useEffect(() => {
    if (started.current) return
    started.current = true
    const carried = carriedOf()
    fates.current = Object.fromEntries(carried.map(c => [c.taskId, c.fate]))
    for (const c of carried) for (const op of fateOps(null, c.fate)) apply(op, c.taskId)
    handlers.setCarried(carried)
    if (celebrate) burst()
  }, [])

  const busy = useRef(false)
  const leave = async (after?: () => void) => {
    if (busy.current) return
    busy.current = true
    for (const taskId of pendingPlan.current) {
      const text = tasks.find(t => t.id === taskId)?.text ?? 'a task'
      toast.error(`Couldn't plan ${text} into the next session. Plan it from Tasks.`)
    }
    pendingPlan.current.clear()
    // A failed save already toasted (10-06); the session still closes.
    await saveNote(handlers.note())
    resetAll()
    setEndedLinks(null)
    after?.()
  }

  const openTasks = () => {
    if (useDeckStore.getState().deck === 'tasks') return
    closeCustomize()
    useDeckStore.getState().toggleDeck('tasks')
  }

  const openLog = () => void leave(() => router.push('/log'))
  const sized = { height: 40, fontSize: 15 }
  const openLogLabel = (
    <>
      <History aria-hidden='true' size={16} />
      Open log
    </>
  )

  return (
    <motion.div
      className='relative z-0 min-h-0 w-full flex-1'
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <SessionSummary
        summary={summary}
        live
        handlers={{ ...handlers, setFate }}
        autoOpenLast
        onOpenTasks={openTasks}
        actions={
          <>
            <ExportMenu summary={summary} side='top' />
            <button type='button' className={card.ghost} style={sized} onClick={openLog}>
              {openLogLabel}
            </button>
            <span style={{ flex: 1 }} />
            <button
              type='button'
              className={card.primary}
              style={sized}
              onClick={() => void leave()}
            >
              Start new session
            </button>
          </>
        }
        phoneActions={
          <>
            <ExportMenu summary={summary} side='top' className='w-full' />
            <button type='button' className={card.primary} onClick={() => void leave()}>
              New session
            </button>
          </>
        }
        tail={
          <button type='button' className={card.ghost} onClick={openLog}>
            {openLogLabel}
          </button>
        }
      />
    </motion.div>
  )
}

/** The timer, or the live summary of the session that just ended in the same place. */
export function Stage() {
  const completed = useTimerStore(s => s.completed)
  const finished = useTimerStore(s => s.finished)
  const showing = completed && finished !== null
  // A summary already showing at mount is a revisit, not an entry: no confetti.
  const atMount = useRef(showing)
  useEffect(() => {
    if (!showing) atMount.current = false
  }, [showing])

  if (!completed || !finished) return <Timer />
  return (
    <LiveSummary
      key={finished.sessionId}
      sessionId={finished.sessionId}
      records={finished.records}
      celebrate={!atMount.current}
    />
  )
}
