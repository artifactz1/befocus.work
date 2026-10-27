'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@repo/ui/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLogActions } from '~/hooks/useLogs'
import { usePlanActions } from '~/hooks/usePlan'
import { useTaskActions } from '~/hooks/useTasks'
import { breakPromptFor } from '~/lib/logs/break-prompt'
import { makeFormat } from '~/lib/logs/summary'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { useTimerStore, useTimerStoreApi } from '~/store/useTimerStore'
import { useTasksStore, useTasksStoreApi } from '~/store/useToDoStore'
import card from '../settings/session-card.module.css'
import { LogForm, type LogFormTarget, type LogFormTask, type LogFormValues } from './LogForm'
import styles from './logs.module.css'

type Snapshot = {
  breakId: string
  focusId: string
  sessionId: string
  number: number
  tasks: LogFormTask[]
  targets: LogFormTarget[]
  sub: string
}

const pad = (n: number) => String(n).padStart(2, '0')

function Countdown({ breakId }: { breakId: string }) {
  const left = useTimerStore(s => (s.currentBlockId === breakId ? s.timeLeft : 0))
  if (left <= 0) return <span className={styles.count}>Break over</span>
  return (
    <span className={styles.count} aria-hidden='true'>
      <span className={styles.long}>Break </span>
      {pad(Math.floor(left / 60))}:{pad(left % 60)} left
    </span>
  )
}

export function BreakLogModal() {
  const timer = useTimerStoreApi()
  const tasksStore = useTasksStoreApi()
  const mode = useTasksStore(s => s.mode)
  const ask = useCustomizeStore(s => s.active.askAtBreak)
  const { saveLog, saveTicks } = useLogActions(mode, tasksStore)
  const { assignTask } = usePlanActions()
  const { setLater } = useTaskActions()
  const titleId = useId()
  const prompted = useRef(new Set<string>())
  const askRef = useRef(ask)
  askRef.current = ask
  const [snap, setSnap] = useState<Snapshot | null>(null)

  useEffect(
    () =>
      timer.subscribe((next, prev) => {
        const hit = breakPromptFor(prev, next, prompted.current, askRef.current)
        if (!hit) return
        prompted.current.add(hit.breakId)
        const focus = next.blocks.find(b => b.id === hit.focusId)
        if (!focus) return
        const focusBlocks = next.blocks.filter(b => b.kind === 'focus')
        const number = focusBlocks.findIndex(b => b.id === hit.focusId) + 1
        const { links, tasks } = tasksStore.getState()
        const rows: LogFormTask[] = []
        for (const l of links) {
          if (l.blockId !== hit.focusId || !(l.planned || l.worked)) continue
          const task = tasks.find(t => t.id === l.taskId)
          if (task) rows.push({ taskId: task.id, text: task.text, completed: l.completed })
        }
        const start = focus.startedAt ?? focus.firstStartedAt
        const parts = [
          ...rows.slice(0, 3).map(r => r.text),
          ...(rows.length > 3 ? [`+${rows.length - 3} more`] : []),
          ...(start !== null && focus.endedAt !== null
            ? [makeFormat().range(start, focus.endedAt)]
            : []),
          ...(focus.outcome === 'skipped' ? ['skipped'] : []),
        ]
        setSnap({
          breakId: hit.breakId,
          focusId: hit.focusId,
          sessionId: focus.sessionId,
          number,
          tasks: rows,
          targets: focusBlocks
            .map((b, i) => ({ b, n: i + 1 }))
            .filter(({ b }) => b.startedAt === null && b.firstStartedAt === null)
            .slice(0, 3)
            .map(({ b, n }) => ({ blockId: b.id, label: `Block ${n}` })),
          sub: parts.join(' · '),
        })
      }),
    [timer, tasksStore],
  )

  const close = () => setSnap(null)

  const save = (values: LogFormValues) => {
    if (!snap) return
    const s = snap
    close()
    const text = values.text.trim()
    if (text || values.rating !== null) {
      void saveLog(
        { blockId: s.focusId, sessionId: s.sessionId, text, rating: values.rating },
        s.number,
      )
    }
    const changed = s.tasks
      .filter(t => values.ticks[t.taskId] !== t.completed)
      .map(t => ({
        blockId: s.focusId,
        taskId: t.taskId,
        completed: values.ticks[t.taskId] === true,
      }))
    void saveTicks(changed)
    for (const t of s.tasks) {
      if (values.ticks[t.taskId]) continue
      const target = values.carry[t.taskId]
      if (!target) continue
      if (target === 'later') {
        void setLater(t.taskId, true)
        continue
      }
      const current = tasksStore.getState().links.find(l => l.taskId === t.taskId && l.planned)
      if (current?.blockId !== target) void assignTask(t.taskId, target)
    }
  }

  return (
    <DialogPrimitive.Root open={snap !== null} onOpenChange={o => !o && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={card.scrim} />
        {snap && (
          <DialogPrimitive.Content
            className={cn(card.confirm, styles.modal)}
            data-break-log
            aria-labelledby={titleId}
            onOpenAutoFocus={e => e.preventDefault()}
            onPointerDownOutside={e => e.preventDefault()}
            onInteractOutside={e => e.preventDefault()}
          >
            <div className={card.head}>
              <div className={card.headText}>
                <DialogPrimitive.Title id={titleId} className={card.title}>
                  {`What got done in block ${snap.number}?`}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className={card.sub}>
                  {snap.sub}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close className={card.x} aria-label='Skip log'>
                <X size={16} aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <LogForm
              mode='modal'
              titleId={titleId}
              blockNumber={snap.number}
              tasks={snap.tasks}
              targets={snap.targets}
              initial={{ text: '', rating: null }}
              onSubmit={save}
              onCancel={close}
              foot={<Countdown breakId={snap.breakId} />}
            />
          </DialogPrimitive.Content>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
