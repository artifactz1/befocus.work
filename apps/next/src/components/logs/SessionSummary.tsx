'use client'

import { LOG_LIMITS } from '@repo/types/logs'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { SummaryHandlers } from '~/hooks/useSummary'
import { makeFormat, type Summary } from '~/lib/logs/summary'
import { BlockRows } from './BlockRows'
import { DoneList } from './DoneList'
import styles from './summary.module.css'

function StatChips({ summary }: { summary: Summary }) {
  const fmt = useMemo(() => makeFormat(), [])
  const { stats } = summary
  return (
    <div className={styles.chips}>
      <span className={styles.chip}>
        <b>
          {stats.blocksDone} / {stats.blocksTotal}
        </b>{' '}
        blocks
      </span>
      {stats.skipped > 0 && (
        <span className={`${styles.chip} ${styles.deskOnly}`}>
          <b>{stats.skipped}</b> skipped
        </span>
      )}
      {stats.addedSeconds > 0 && (
        <span className={styles.chip}>
          <b className={styles.overtime}>{fmt.added(stats.addedSeconds)}</b>
          <span className={styles.deskOnly}> added</span>
        </span>
      )}
      {stats.tasksTotal > 0 && (
        <span className={styles.chip}>
          <b>
            {stats.tasksDone} / {stats.tasksTotal}
          </b>{' '}
          tasks
        </span>
      )}
      {stats.breaksCut > 0 && (
        <span className={`${styles.chip} ${styles.deskOnly}`}>
          <b>
            {stats.breaksCut === 1 ? '1 break cut short' : `${stats.breaksCut} breaks cut short`}
          </b>
        </span>
      )}
    </div>
  )
}

function NextTime({ summary, handlers }: { summary: Summary; handlers: SummaryHandlers }) {
  const id = useId()
  const area = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(summary.nextTime)
  const saved = useRef(summary.nextTime)

  // Follow outside changes (a failed save rolls back) unless the user is typing.
  useEffect(() => {
    saved.current = summary.nextTime
    if (document.activeElement !== area.current) setValue(summary.nextTime)
  }, [summary.nextTime])

  // biome-ignore lint/correctness/useExhaustiveDependencies: value is the re-measure trigger
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 100)}px`
  }, [value])

  return (
    <section className={styles.next}>
      <h2 id={id} className={styles.sec}>
        Next time
      </h2>
      <textarea
        ref={area}
        className={styles.nextArea}
        aria-labelledby={id}
        rows={1}
        placeholder='One thing to try next session'
        maxLength={LOG_LIMITS.nextTime}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => {
          if (value === saved.current) return
          saved.current = value
          handlers.setNextTime(value)
        }}
      />
    </section>
  )
}

/**
 * The summary view of one session. Presentational: the stage and /log supply the summary, the
 * handlers and the action rows. Layout switches with CSS media queries, so SSR and client agree.
 */
export function SessionSummary({
  summary,
  live,
  handlers,
  actions,
  phoneActions,
  tail,
  autoOpenLast,
  onOpenTasks,
}: {
  summary: Summary
  live: boolean
  handlers: SummaryHandlers
  /** Desktop actions row, pinned to the bottom of the left column. */
  actions?: ReactNode
  /** Phone and tablet pinned action bar. */
  phoneActions?: ReactNode
  /** End of the phone scroll column (the full-width ghost "Open log"). */
  tail?: ReactNode
  autoOpenLast?: boolean
  onOpenTasks?: () => void
}) {
  const fmt = useMemo(() => makeFormat(), [])
  const headId = useId()
  const head = useRef<HTMLHeadingElement>(null)
  const range = fmt.range(summary.start, summary.end)

  // The stage hands focus to the headline when the summary appears.
  useEffect(() => {
    if (live) head.current?.focus({ preventScroll: true })
  }, [live])

  return (
    <section className={styles.root} data-session-summary aria-labelledby={headId}>
      <div className={styles.scroll}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>
            {live ? 'Session done · ' : ''}
            {fmt.day(summary.start, Date.now())}
            <span className={styles.deskOnly}> · {range}</span>
          </p>
          <h1 id={headId} ref={head} tabIndex={-1} className={styles.headline}>
            {fmt.compact(summary.focusSeconds)}
            <span className={`${styles.deskOnly} ${styles.muted}`}> focused</span>
          </h1>
          <p className={styles.phoneLine}>focused · {range}</p>
          <StatChips summary={summary} />
          <div className={styles.listWrap}>
            <DoneList summary={summary} live={live} handlers={handlers} onOpenTasks={onOpenTasks} />
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        <div className={styles.right}>
          <section>
            <h2 className={styles.sec}>Blocks and logs</h2>
            <BlockRows summary={summary} handlers={handlers} autoOpenLast={autoOpenLast} />
          </section>
          <NextTime summary={summary} handlers={handlers} />
          {tail && <div className={styles.tail}>{tail}</div>}
        </div>
      </div>
      {phoneActions && <div className={styles.phoneBar}>{phoneActions}</div>}
    </section>
  )
}
