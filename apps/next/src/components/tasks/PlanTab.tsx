'use client'

import { PLAN_LIMITS } from '@repo/types/plan'
import { cn } from '@repo/ui/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePlanActions } from '~/hooks/usePlan'
import { api } from '~/lib/api.client'
import {
  deriveBlockTimes,
  formatClock,
  formatDuration,
  formatRange,
  planSummary,
} from '~/lib/plan/plan'
import { useTasksStore, useTasksStoreApi } from '~/store/useToDoStore'
import records from '../records/records.module.css'
import { Skeleton } from './ListTab'
import styles from './tasks.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const PX_PER_MINUTE = 2.4

// Re-derives on a 60s interval and whenever the tab becomes visible; never stored.
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 60_000)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return now
}

function PlanLoadError() {
  const store = useTasksStoreApi()
  const [busy, setBusy] = useState(false)
  if (busy) return <Skeleton rows={3} height={60} gap={16} />
  return (
    <div className={styles.loadError} role='alert'>
      <span>Couldn't load your plan.</span>
      <button
        type='button'
        className={styles.retry}
        onClick={async () => {
          setBusy(true)
          try {
            const res = await api.user.plan.$get()
            if (!res.ok) return
            const data = await res.json()
            store.getState().hydratePlan(
              data.plan
                ? {
                    sessionId: data.plan.sessionId,
                    blocks: data.plan.blocks,
                    wentLive: data.plan.wentLive,
                  }
                : null,
              data.links.map(l => ({ ...l, taskId: String(l.taskId) })),
            )
          } catch {
            // stays on the error row
          } finally {
            setBusy(false)
          }
        }}
      >
        Try again
      </button>
    </div>
  )
}

export default function PlanTab() {
  const plan = useTasksStore(s => s.plan)
  const planLoad = useTasksStore(s => s.planLoad)
  const { addFocus, removeFocus, nudge } = usePlanActions()
  const reduced = useReducedMotion()
  const now = useNow()
  const [pickedId, setPickedId] = useState<string | null>(null)

  const blocks = plan?.blocks
  const times = useMemo(
    () =>
      blocks
        ? deriveBlockTimes(
            blocks.map(b => ({
              id: b.id,
              kind: b.kind,
              plannedSeconds: b.minutes * 60,
              addedSeconds: 0,
              startedAt: null,
              endedAt: null,
              leftSeconds: null,
            })),
            now,
            now,
          )
        : [],
    [blocks, now],
  )

  if (planLoad === 'error') return <PlanLoadError />
  if (!plan || !blocks) return <Skeleton rows={3} height={60} gap={16} />

  const focus = blocks.filter(b => b.kind === 'focus')
  // the picked block may have been removed; fall back to Block 1
  const selected = focus.find(b => b.id === pickedId) ?? focus[0]
  const end = times[times.length - 1]?.end ?? now
  const atLimit = focus.length >= PLAN_LIMITS.maxFocus
  let focusNumber = 0

  return (
    <div className={styles.plan}>
      <div className={records.sec}>
        <span>{planSummary(blocks)}</span>
        <em>Ends {formatClock(end)}</em>
      </div>
      <fieldset className={styles.column}>
        <legend className='sr-only'>Blocks</legend>
        {blocks.map((block, i) => {
          const t = times[i]
          if (!t) return null
          const height = block.minutes * PX_PER_MINUTE
          if (block.kind === 'break') {
            return (
              <div
                key={block.id}
                className={styles.breakCell}
                style={{ height: Math.max(16, height) }}
              >
                <span className={styles.gutter} aria-hidden='true' />
                <span className={styles.breakRow}>Break · {formatDuration(block.minutes)}</span>
              </div>
            )
          }
          focusNumber += 1
          const name = `Block ${focusNumber}`
          const isSelected = block.id === selected?.id
          const nameText = `${name}, ${formatClock(t.start)} to ${formatClock(t.end)}, ${block.minutes} minutes, no tasks`
          return (
            <div key={block.id} className={styles.focusCell}>
              <span className={styles.gutter} aria-hidden='true'>
                {formatClock(t.start)}
              </span>
              <div
                className={styles.focus}
                data-selected={isSelected || undefined}
                style={{ minHeight: Math.max(44, height) }}
              >
                <label className={styles.focusLabel}>
                  <input
                    type='radio'
                    name='plan-block'
                    className={styles.radio}
                    checked={isSelected}
                    onChange={() => setPickedId(block.id)}
                  />
                  <span className={styles.focusHead}>
                    <span className={styles.focusTitle} aria-hidden='true'>
                      {name}
                    </span>
                    <span className={styles.meta} aria-hidden='true'>
                      {formatRange(t.start, t.end)}
                    </span>
                  </span>
                  <span className='sr-only'>{nameText}</span>
                  <span className={styles.noTasks} aria-hidden='true'>
                    No tasks
                  </span>
                </label>
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      className={styles.assign}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
                    >
                      <div className={styles.assignInner}>
                        <div className={styles.length}>
                          <span>Length</span>
                          <button
                            type='button'
                            className={styles.nudge}
                            aria-label={`Shorten ${name}`}
                            disabled={block.minutes <= PLAN_LIMITS.minMinutes}
                            onClick={() => nudge(block.id, -PLAN_LIMITS.step)}
                          >
                            <Minus aria-hidden='true' />
                          </button>
                          <output className={styles.value} aria-live='polite'>
                            {block.minutes} min
                          </output>
                          <button
                            type='button'
                            className={styles.nudge}
                            aria-label={`Lengthen ${name}`}
                            disabled={block.minutes >= PLAN_LIMITS.maxMinutes}
                            onClick={() => nudge(block.id, PLAN_LIMITS.step)}
                          >
                            <Plus aria-hidden='true' />
                          </button>
                        </div>
                        <div className={styles.assignFoot}>
                          <button
                            type='button'
                            className={styles.remove}
                            disabled={focus.length <= 1}
                            onClick={() => removeFocus(block.id)}
                          >
                            Remove block
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
        <div className={styles.focusCell}>
          <span className={styles.gutter} aria-hidden='true'>
            {formatClock(end)}
          </span>
        </div>
      </fieldset>
      <button
        type='button'
        className={cn(styles.add, styles.addBlock)}
        disabled={atLimit}
        aria-describedby={atLimit ? 'plan-limit' : undefined}
        onClick={addFocus}
      >
        <Plus aria-hidden='true' />
        Add focus block
      </button>
      {atLimit && (
        <p id='plan-limit' className={styles.note}>
          16 blocks is the limit for one session.
        </p>
      )}
      <p className={styles.note}>Changes here apply to this session only.</p>
    </div>
  )
}
