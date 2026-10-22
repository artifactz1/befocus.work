'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useSessionView } from '~/hooks/usePlan'
import { SESSION_PROGRESS } from '~/lib/customize/catalog'
import { formatDuration, type LiveBlock, type SessionView } from '~/lib/plan/plan'
import { stripWidths } from '~/lib/plan/strip'
import { selectPaintedLook, useCustomizeStore } from '~/store/useCustomizeStore'
import { useDeckStore } from '~/store/useDeckStore'
import { useTasksStore } from '~/store/useToDoStore'
import SessionsUI from '../sessions/SessionsUI'
import styles from './progress.module.css'

type ViewId = (typeof SESSION_PROGRESS)[number]['id']

const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// minutes used for widths: planned + added, actual for done blocks
export function blockMinutes(b: LiveBlock) {
  const seconds =
    b.state === 'done' && b.actualSeconds > 0 ? b.actualSeconds : b.plannedSeconds + b.addedSeconds
  return seconds / 60
}

// 1-based focus number the session is at (a break counts as the focus block before it)
function focusPosition(view: SessionView) {
  const upTo = view.currentIndex < 0 ? 1 : view.currentIndex + 1
  return Math.max(1, view.blocks.slice(0, upTo).filter(b => b.kind === 'focus').length)
}

function labelOf(view: SessionView, kind: 'strip' | 'now') {
  const { summary, current } = view
  if (!current || view.state === 'planning') {
    if (kind === 'strip') {
      const tasks =
        summary.plannedTasks > 0 ? ` · ${plural(summary.plannedTasks, 'task')} planned` : ''
      return {
        count: plural(summary.focusCount, 'block'),
        text: `${formatDuration(summary.totalMinutes)}${tasks}`,
      }
    }
    const first = view.blocks[0]
    const n = first ? first.taskIds.length : 0
    return {
      count: `1 / ${summary.focusCount}`,
      text: `Block 1 · ${formatDuration(Math.round((first?.plannedSeconds ?? 0) / 60))}${n ? ` · ${plural(n, 'task')}` : ''}`,
    }
  }
  const count = `${focusPosition(view)} / ${summary.focusCount}`
  const span = current.plannedSeconds + current.addedSeconds
  const left = span - current.elapsedSeconds
  if (current.kind === 'break') return { count, text: `Break · ${clock(left)} left` }
  const added = Math.round(current.addedSeconds / 60)
  if (kind === 'strip') {
    const extra =
      summary.addedTotal > 0 ? ` · +${Math.round(summary.addedTotal / 60)} min added` : ''
    return {
      count,
      text: `Block ${current.focusNumber} · ${clock(current.elapsedSeconds)} in${extra}`,
    }
  }
  const n = current.taskIds.length
  return {
    count,
    text: `Block ${current.focusNumber} · ${clock(left)} left${added > 0 ? ` · +${added} min` : ''}${n ? ` · ${plural(n, 'task')}` : ''}`,
  }
}

function nameOf(view: SessionView) {
  const { current, summary } = view
  const total = plural(summary.focusCount, 'block')
  if (!current || view.state === 'planning')
    return `Session progress: ${total} planned. Change view`
  const left = clock(current.plannedSeconds + current.addedSeconds - current.elapsedSeconds)
  if (current.kind === 'break') {
    return `Session progress: break after Block ${focusPosition(view)}, ${left} left. Change view`
  }
  return `Session progress: Block ${current.focusNumber} of ${summary.focusCount}, ${left} left. Change view`
}

function Dots({ ids, width }: { ids: string[]; width: number | string }) {
  const tasks = useTasksStore(s => s.tasks)
  const done = useMemo(() => new Set(tasks.filter(t => t.completed).map(t => t.id)), [tasks])
  const shown = ids.slice(0, 8)
  return (
    <div className={styles.dots} style={{ width }}>
      {shown.map(id => (
        <i key={id} className={styles.dot} data-done={done.has(id) || undefined} />
      ))}
      {ids.length > 8 && <span className={styles.more}>+{ids.length - 8}</span>}
    </div>
  )
}

function useNames(ids: string[]) {
  const tasks = useTasksStore(s => s.tasks)
  return ids.flatMap(id => tasks.find(t => t.id === id)?.text ?? [])
}

function Cell({
  block,
  width,
  per,
  phone,
}: {
  block: LiveBlock
  width: number
  per: number
  phone?: boolean
}) {
  const names = useNames(block.taskIds)
  const span = block.plannedSeconds + block.addedSeconds
  const added = Math.round(block.addedSeconds / 60)
  const num = phone
    ? block.kind === 'focus' && width >= 16
      ? String(block.focusNumber)
      : null
    : block.kind === 'focus' && width >= 20
      ? `${block.focusNumber}${added > 0 ? ` · +${added}` : ''}`
      : null
  return (
    <div
      className={styles.col}
      style={{ width }}
      data-current={block.state === 'current' || undefined}
    >
      <div className={styles.block} data-kind={block.kind} data-state={block.state}>
        {block.state === 'current' && (
          <div
            className={styles.fill}
            style={{
              transform: `scaleX(${span > 0 ? Math.min(1, block.elapsedSeconds / span) : 0})`,
            }}
          />
        )}
        {block.addedSeconds > 0 && (
          <div className={styles.plus} style={{ width: (block.addedSeconds / 60) * per }} />
        )}
        {num && (
          <div className={styles.inner}>
            <span className={styles.num}>{num}</span>
            {!phone && width >= 96 && names[0] && <span>{names[0]}</span>}
            {!phone && width >= 96 && names[1] && <span className={styles.second}>{names[1]}</span>}
          </div>
        )}
      </div>
      {block.kind === 'focus' && <Dots ids={block.taskIds} width={width} />}
    </div>
  )
}

function StripView({ view, phone }: { view: SessionView; phone?: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const reduced = useReducedMotion()
  const label = labelOf(view, 'strip')

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { widths, per, overflow } = stripWidths(
    view.blocks.map(b => ({ kind: b.kind, minutes: blockMinutes(b) })),
    width,
    phone ? { gap: 2, minFocus: 16, minBreak: 4 } : { gap: 4, minFocus: 32, minBreak: 8 },
  )

  const currentId = view.current?.id
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll only when the current block changes
  useEffect(() => {
    if (!overflow) return
    rowRef.current?.querySelector('[data-current]')?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduced ? 'instant' : 'smooth',
    })
  }, [currentId, overflow])

  return (
    <div className={phone ? styles.viewPhone : styles.view}>
      {!phone && (
        <div className={styles.label}>
          <span className={styles.count}>{label.count}</span>
          <span>{label.text}</span>
        </div>
      )}
      <div ref={rowRef} className={`${styles.row} ${overflow ? styles.scroll : ''}`}>
        {width > 0 &&
          view.blocks.map((b, i) => (
            <Cell key={b.id} block={b} width={widths[i] ?? 0} per={per} phone={phone} />
          ))}
      </div>
    </div>
  )
}

function NowView({ view, phone }: { view: SessionView; phone?: boolean }) {
  const label = labelOf(view, 'now')
  const block = view.current ?? view.blocks[0]
  const names = useNames(block?.taskIds ?? [])
  if (!block) return null
  const span = block.plannedSeconds + block.addedSeconds
  const live = view.state === 'live'
  const tail = span > 0 ? block.addedSeconds / span : 0
  const phoneText = live
    ? `${block.kind === 'break' ? 'Break' : `Block ${block.focusNumber}`} · ${clock(span - block.elapsedSeconds)} left`
    : `Block ${block.focusNumber} · ${formatDuration(Math.round(span / 60))}`
  return (
    <div className={phone ? styles.viewNowPhone : styles.viewNow}>
      {!phone && (
        <div className={styles.label}>
          <span className={styles.count}>{label.count}</span>
          <span>{label.text}</span>
        </div>
      )}
      <div className={styles.block} data-kind={block.kind} data-state={live ? 'current' : 'ahead'}>
        {live && (
          <div
            className={styles.fill}
            style={{
              transform: `scaleX(${span > 0 ? Math.min(1, block.elapsedSeconds / span) : 0})`,
            }}
          />
        )}
        {tail > 0 && <div className={styles.plus} style={{ width: `${tail * 100}%` }} />}
        <div className={styles.inner}>
          <span className={styles.num}>
            {phone ? phoneText : block.kind === 'break' ? 'Break' : `Block ${block.focusNumber}`}
          </span>
          {!phone && block.kind === 'focus' && names.length > 0 && <span>{names.join(' · ')}</span>}
        </div>
      </div>
      {block.kind === 'focus' && <Dots ids={block.taskIds} width='100%' />}
    </div>
  )
}

function Preview({ id }: { id: ViewId }) {
  if (id === 'grid') {
    const row1 = ['done', 'done', 'now', '', '', '']
    const row2 = ['done', 'done', '', '', '', '']
    return (
      <span className={`${styles.preview} ${styles.previewGrid}`} aria-hidden>
        {[...row1, ...row2].map((s, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative cells
          <i key={i} data-s={s} />
        ))}
      </span>
    )
  }
  const bars =
    id === 'strip'
      ? [
          ['done', 12],
          ['done', 4],
          ['now', 12],
          ['', 4],
          ['', 12],
          ['', 12],
        ]
      : [
          ['now', 28],
          ['', 28],
        ]
  return (
    <span className={styles.preview} aria-hidden>
      {bars.map(([s, w], i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
        <i key={i} data-s={s} style={{ width: w as number }} />
      ))}
    </span>
  )
}

export default function ProgressSlot() {
  const choice = useCustomizeStore(s => selectPaintedLook(s).sessionProgress)
  const commitKey = useCustomizeStore(s => s.commitKey)
  const view = useSessionView()
  // Landscape phones (short and wide) take the phone views too, at the smaller sizes
  const phone = useMediaQuery('(max-width: 639.98px), (max-height: 500px)')
  const [open, setOpen] = useState(false)
  const slotRef = useRef<HTMLButtonElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const content =
    !view || choice === 'grid' ? (
      <SessionsUI
        sessions={view?.summary.focusCount}
        currentSession={view ? focusPosition(view) : undefined}
      />
    ) : choice === 'now' ? (
      <NowView view={view} phone={phone} />
    ) : (
      <StripView view={view} phone={phone} />
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={slotRef}
          type='button'
          data-sessions-ui
          data-progress-slot
          aria-haspopup='dialog'
          aria-label={view ? nameOf(view) : 'Session progress. Change view'}
          className={`${styles.root} bf-chrome-dim`}
        >
          <div aria-hidden>{content}</div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-session-switcher
        side='bottom'
        align='start'
        sideOffset={8}
        aria-label='Session progress'
        className={`${styles.switcher} motion-reduce:!animate-none`}
        onOpenAutoFocus={event => {
          event.preventDefault()
          selectedRef.current?.focus()
        }}
      >
        <h2 className={styles.sec}>Session progress</h2>
        {/* biome-ignore lint/a11y/useSemanticElements: the spec asks for role=group on the tile row */}
        <div role='group' aria-label='Session progress view' className={styles.tiles}>
          {SESSION_PROGRESS.map(option => (
            <button
              key={option.id}
              ref={option.id === choice ? selectedRef : undefined}
              type='button'
              className={styles.tile}
              aria-pressed={option.id === choice}
              onClick={() => {
                commitKey('sessionProgress', option.id)
                setOpen(false)
              }}
            >
              <Preview id={option.id} />
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.divider} />
        <button
          type='button'
          className={styles.cardRow}
          onClick={() => {
            setOpen(false)
            useDeckStore.getState().openDeck('tasks', 'plan', slotRef.current ?? undefined)
          }}
        >
          <span>Open session card</span>
          <small>
            Full names, totals
            <ChevronRight size={16} aria-hidden />
          </small>
        </button>
      </PopoverContent>
    </Popover>
  )
}
