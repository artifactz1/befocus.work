'use client'

import { FOCUS_RATINGS, type FocusRating, LOG_LIMITS } from '@repo/types/logs'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import card from '../settings/session-card.module.css'
import tasksStyles from '../tasks/tasks.module.css'
import styles from './logs.module.css'
import { Seg } from './Seg'

export type LogFormValues = {
  text: string
  rating: FocusRating | null
  ticks: Record<string, boolean>
  /** Per task: the target block id, or 'later'. Read only for unticked tasks. */
  carry: Record<string, string>
}

export type LogFormTask = { taskId: string; text: string; completed: boolean }
export type LogFormTarget = { blockId: string; label: string }

const RATINGS: { value: FocusRating; label: string }[] = FOCUS_RATINGS.map(value => ({
  value,
  label: { scattered: 'Scattered', okay: 'Okay', deep: 'Deep' }[value],
}))

const LATER = 'later'

export function LogForm({
  mode,
  titleId,
  blockNumber,
  tasks,
  targets,
  initial,
  onSubmit,
  onCancel,
  foot,
}: {
  mode: 'modal' | 'edit'
  titleId: string
  blockNumber: number
  tasks: LogFormTask[]
  targets: LogFormTarget[]
  initial: { text: string; rating: FocusRating | null }
  onSubmit: (values: LogFormValues) => void
  onCancel: () => void
  foot?: ReactNode
}) {
  const modal = mode === 'modal'
  const reduced = useReducedMotion()
  const uid = useId()
  const area = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(initial.text)
  const [rating, setRating] = useState<FocusRating | null>(initial.rating)
  const [ticks, setTicks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map(t => [t.taskId, t.completed])),
  )
  const fallback = targets[0]?.blockId ?? LATER
  const [carry, setCarry] = useState<Record<string, string>>(() =>
    Object.fromEntries(tasks.map(t => [t.taskId, fallback])),
  )
  const carryOptions = [
    ...targets.map(t => ({ value: t.blockId, label: t.label })),
    { value: LATER, label: 'Later' },
  ]

  useEffect(() => {
    if (modal) area.current?.focus()
  }, [modal])

  // biome-ignore lint/correctness/useExhaustiveDependencies: text is the re-measure trigger
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 84), 160)}px`
  }, [text])

  const submit = () => onSubmit({ text, rating, ticks, carry })

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape' && !modal) {
      event.stopPropagation()
      onCancel()
    }
  }

  const body = (
    // biome-ignore lint/a11y/noStaticElementInteractions: delegates Cmd/Ctrl+Enter from the inner controls
    <div className={cn(styles.body, modal && styles.modalBody)} onKeyDown={onKeyDown}>
      <textarea
        ref={area}
        className={styles.area}
        aria-labelledby={titleId}
        placeholder='A line or two is enough'
        maxLength={LOG_LIMITS.text}
        value={text}
        onChange={e => setText(e.target.value)}
      />

      {tasks.length > 0 && (
        <section>
          <h3 className={styles.sec}>Tasks in this block</h3>
          <ul className={styles.tasks}>
            {tasks.map(task => {
              const ticked = ticks[task.taskId] === true
              const id = `${uid}-${task.taskId}`
              return (
                <li key={task.taskId}>
                  <div className={styles.taskRow}>
                    <Checkbox
                      id={id}
                      className={tasksStyles.box}
                      checked={ticked}
                      onCheckedChange={checked =>
                        setTicks(prev => ({ ...prev, [task.taskId]: checked === true }))
                      }
                    >
                      <Check aria-hidden='true' />
                    </Checkbox>
                    <label htmlFor={id} className={styles.taskText}>
                      {task.text}
                    </label>
                    {!ticked && <span className={styles.notDone}>not done</span>}
                  </div>
                  <AnimatePresence initial={false}>
                    {modal && !ticked && (
                      <motion.div
                        key='carry'
                        className={styles.carryWrap}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduced ? 0 : 0.18 }}
                      >
                        <div className={styles.carry}>
                          <span className={styles.carryLabel}>Move to</span>
                          <Seg
                            size='xs'
                            legend={`Move ${task.text} to`}
                            options={carryOptions}
                            value={carry[task.taskId] ?? fallback}
                            onChange={v => v && setCarry(prev => ({ ...prev, [task.taskId]: v }))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className={styles.sec}>How was the focus?</h3>
        <Seg
          size='md'
          legend='How was the focus?'
          options={RATINGS}
          value={rating}
          onChange={v => setRating(v as FocusRating | null)}
          allowClear
        />
      </section>
    </div>
  )

  const actions = (
    <div className={card.actions}>
      <button type='button' className={card.ghost} onClick={onCancel}>
        {modal ? 'Skip' : 'Cancel'}
      </button>
      <button type='button' className={card.primary} onClick={submit}>
        Save
      </button>
    </div>
  )

  const footer = (
    // biome-ignore lint/a11y/noStaticElementInteractions: delegates Cmd/Ctrl+Enter from the buttons
    <div className={modal ? card.foot : styles.editFoot} onKeyDown={onKeyDown}>
      {foot}
      {actions}
    </div>
  )

  // Modal: head, body and foot are direct grid rows of the card. Edit: a plain block.
  if (modal)
    return (
      <>
        {body}
        {footer}
      </>
    )
  return (
    <div className={styles.edit} data-block-number={blockNumber}>
      {body}
      {footer}
    </div>
  )
}
