'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Check } from 'lucide-react'
import { type RefObject, useRef, useState } from 'react'
import { type NowOption, useNow, usePlanActions } from '~/hooks/usePlan'
import { useTaskActions } from '~/hooks/useTasks'
import styles from './tasks.module.css'

/** True while the now line replaces the key hints under the digits. */
export function useNowLineShown() {
  const now = useNow()
  return now.active && now.blockTasks.length + now.otherOpen.length > 0
}

function PickRow({
  option,
  current,
  onPick,
  rowRef,
}: {
  option: NowOption
  current: boolean
  onPick: (id: string) => void
  rowRef?: RefObject<HTMLButtonElement>
}) {
  return (
    <button
      ref={rowRef}
      type='button'
      className={styles.pickRow}
      aria-pressed={current}
      onClick={() => onPick(option.task.id)}
    >
      <span className={styles.pickDot} data-current={current || undefined} aria-hidden='true' />
      <span className={styles.pickText}>{option.task.text}</span>
      {option.block !== null && (
        <span className={styles.chip}>
          <span aria-hidden='true'>B{option.block}</span>
          <span className='sr-only'>Planned in Block {option.block}</span>
        </span>
      )}
    </button>
  )
}

export default function NowLine() {
  const now = useNow()
  const { setNow } = usePlanActions()
  const { markDone } = useTaskActions()
  const [open, setOpen] = useState(false)
  const currentRef = useRef<HTMLButtonElement>(null)

  if (!now.active || now.blockTasks.length + now.otherOpen.length === 0) return null
  const { task } = now
  const count = now.plannedCount > 0 ? `${now.doneCount}/${now.plannedCount} done` : null
  const label = `Now: ${task ? task.text : 'no task picked'}${
    now.plannedCount > 0 ? `, ${now.doneCount} of ${now.plannedCount} tasks done` : ''
  }. Change task`
  const pick = (id: string) => {
    void setNow(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-haspopup='dialog'
          aria-label={label}
          className={`${styles.nowLine} bf-chrome-dim`}
          style={{ '--idle-opacity': 0.55 } as React.CSSProperties}
        >
          <span className={styles.nowTag} aria-hidden='true'>
            NOW
          </span>
          <span className={styles.nowName} data-empty={!task || undefined} aria-hidden='true'>
            {task ? task.text : 'Pick a task'}
          </span>
          {count && (
            <span className={styles.nowCount} aria-hidden='true'>
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-now-pick
        side='bottom'
        align='center'
        sideOffset={12}
        aria-label='Working on'
        className={`${styles.nowPick} motion-reduce:animate-none`}
        onOpenAutoFocus={event => {
          event.preventDefault()
          currentRef.current?.focus()
        }}
      >
        <h2 className={styles.pickSec}>Working on</h2>
        {task && (
          <>
            <button
              type='button'
              className={styles.pickRow}
              aria-label={`Mark ${task.text} done`}
              onClick={() => void markDone(task.id)}
            >
              <Check size={16} aria-hidden='true' />
              <span className={styles.pickText}>Mark done</span>
            </button>
            <hr className={styles.pickRule} />
          </>
        )}
        {now.blockTasks.length > 0 && (
          <>
            <h3 className={styles.pickSec}>This block</h3>
            {now.blockTasks.map(t => (
              <PickRow
                key={t.id}
                option={{ task: t, block: null }}
                current={t.id === task?.id}
                onPick={pick}
                rowRef={t.id === task?.id ? currentRef : undefined}
              />
            ))}
          </>
        )}
        {now.otherOpen.length > 0 && (
          <>
            <h3 className={styles.pickSec}>Other open tasks</h3>
            {now.otherOpen.map(o => (
              <PickRow key={o.task.id} option={o} current={false} onPick={pick} />
            ))}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
