'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Check, ChevronDown } from 'lucide-react'
import { type RefObject, useRef, useState } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { type NowOption, useNow, usePlanActions, useSessionView } from '~/hooks/usePlan'
import { useTaskActions } from '~/hooks/useTasks'
import { selectPaintedLook, useCustomizeStore } from '~/store/useCustomizeStore'
import { useDeckStore } from '~/store/useDeckStore'
import { useTimerStore } from '~/store/useTimerStore'
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

/** Phone Grid view: "B3/6 Draft Q3 body" pill that opens the Tasks sheet on the Plan tab. */
function GridPill() {
  const now = useNow()
  const view = useSessionView()
  const status = useTimerStore(s => s.status)
  const current = view?.current
  if (!view || !current || view.state !== 'live' || (status !== 'running' && status !== 'paused'))
    return null
  const isBreak = current.kind === 'break'
  if (!isBreak && now.blockTasks.length + now.otherOpen.length === 0) return null
  const position = Math.max(
    1,
    view.blocks.slice(0, view.currentIndex + 1).filter(b => b.kind === 'focus').length,
  )
  const tag = `B${position}/${view.summary.focusCount}`
  const name = isBreak ? 'Break' : now.task ? now.task.text : 'Pick a task'
  const label = isBreak
    ? `Break after Block ${position} of ${view.summary.focusCount}. Open plan`
    : `Block ${position} of ${view.summary.focusCount}, ${name}. Open plan`
  return (
    <button
      type='button'
      aria-label={label}
      data-grid-pill=''
      className={`${styles.pill} bf-chrome-dim`}
      style={{ '--idle-opacity': 0.55 } as React.CSSProperties}
      onClick={() => useDeckStore.getState().openDeck('tasks', 'plan')}
    >
      {isBreak ? (
        <span className={styles.pillTag} aria-hidden='true'>
          Break · {tag}
        </span>
      ) : (
        <>
          <span className={styles.pillTag} aria-hidden='true'>
            {tag}
          </span>
          <span className={styles.nowName} data-empty={!now.task || undefined} aria-hidden='true'>
            {name}
          </span>
          <ChevronDown size={14} aria-hidden='true' />
        </>
      )}
    </button>
  )
}

export default function NowLine() {
  const phone = useMediaQuery('(max-width: 639.98px)')
  const grid = useCustomizeStore(s => selectPaintedLook(s).sessionProgress) === 'grid'
  return phone && grid ? <GridPill /> : <NowPicker phone={phone} />
}

function NowPicker({ phone }: { phone: boolean }) {
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
        // ponytail: phone never flips above (it would cover the digits); height is capped instead
        avoidCollisions={!phone}
        collisionPadding={16}
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
