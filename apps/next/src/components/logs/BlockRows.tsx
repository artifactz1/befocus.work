'use client'

import type { FocusRating } from '@repo/types/logs'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { SummaryHandlers } from '~/hooks/useSummary'
import { makeFormat, type Summary, type SummaryBlock } from '~/lib/logs/summary'
import { LogForm, type LogFormValues } from './LogForm'
import styles from './summary.module.css'

const RATING: Record<FocusRating, string> = { scattered: 'Scattered', okay: 'Okay', deep: 'Deep' }
const EASE = [0.2, 0.7, 0.2, 1] as const
const minutes = (seconds: number) => Math.round(seconds / 60)

function breakText(b: SummaryBlock): string {
  if (b.cut === 'skipped') return 'Break · skipped'
  if (b.cut === 'short')
    return `Break · ${minutes(b.actualSeconds)} of ${minutes(b.plannedSeconds)} min · cut short`
  return `Break · ${minutes(b.plannedSeconds)} min`
}

export function BlockRows({
  summary,
  handlers,
  autoOpenLast,
}: {
  summary: Summary
  handlers: SummaryHandlers
  autoOpenLast?: boolean
}) {
  const fmt = useMemo(() => makeFormat(), [])
  const reduced = useReducedMotion()
  const uid = useId()
  const lastFocus = [...summary.blocks].reverse().find(b => b.kind === 'focus')
  const [openId, setOpenId] = useState<string | null>(autoOpenLast ? (lastFocus?.id ?? null) : null)
  const editButtons = useRef(new Map<string, HTMLButtonElement>())
  const refocus = useRef<string | null>(null)

  // After a form closes the Edit button comes back; focus it.
  useEffect(() => {
    if (openId !== null || refocus.current === null) return
    editButtons.current.get(refocus.current)?.focus()
    refocus.current = null
  }, [openId])

  const close = (id: string) => {
    refocus.current = id
    setOpenId(null)
  }

  const save = (block: SummaryBlock, values: LogFormValues) => {
    close(block.id)
    void handlers.saveLog(block, values)
  }

  return (
    <ol className={styles.blocks}>
      {summary.blocks.map(b => {
        if (b.kind === 'break')
          return (
            <li key={b.id} className={styles.breakLine} data-cut={b.cut === 'short' || undefined}>
              {breakText(b)}
            </li>
          )

        const open = openId === b.id
        const titleId = `${uid}-${b.id}`
        const names = b.tasks.map(t => t.text).join(' · ')
        const text = b.log?.text.trim() ?? ''
        const rating = b.log?.rating ?? null
        return (
          <li key={b.id} className={styles.block} data-open={open || undefined}>
            <span className={styles.range}>{fmt.range(b.start, b.end)}</span>
            <div className={styles.blockHead}>
              <span id={titleId} className={styles.blockTitle}>
                {`${b.focusNumber} · ${names || 'Focus'}`}
              </span>
              {b.addedSeconds > 0 && (
                <span className={styles.rowChip} data-overtime>
                  {fmt.added(b.addedSeconds)}
                </span>
              )}
              {b.outcome === 'skipped' && (
                <span className={styles.rowChip} data-muted>
                  skipped
                </span>
              )}
              {rating && <span className={styles.rowChip}>{RATING[rating]}</span>}
              {!open && (
                <button
                  type='button'
                  ref={el => {
                    if (el) editButtons.current.set(b.id, el)
                    else editButtons.current.delete(b.id)
                  }}
                  className={styles.edit}
                  aria-label={`Edit log for block ${b.focusNumber}`}
                  onClick={() => setOpenId(b.id)}
                >
                  <Pencil aria-hidden='true' />
                </button>
              )}
            </div>
            <div className={styles.blockBody}>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    key='form'
                    className={styles.formWrap}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
                  >
                    <LogForm
                      mode='edit'
                      titleId={titleId}
                      blockNumber={b.focusNumber ?? 0}
                      tasks={b.tasks}
                      targets={[]}
                      initial={{ text: b.log?.text ?? '', rating }}
                      onSubmit={values => save(b, values)}
                      onCancel={() => close(b.id)}
                    />
                  </motion.div>
                ) : text ? (
                  <button
                    key='text'
                    type='button'
                    className={styles.logText}
                    onClick={() => setOpenId(b.id)}
                  >
                    {text}
                  </button>
                ) : (
                  <button
                    key='add'
                    type='button'
                    className={styles.addLog}
                    onClick={() => setOpenId(b.id)}
                  >
                    + Add a log
                  </button>
                )}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
