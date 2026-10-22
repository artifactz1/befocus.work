'use client'

import { cn } from '@repo/ui/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import type { HistorySession } from '~/lib/logs/history'
import {
  calendar,
  improveState,
  type Observation,
  observations,
  type PlanRow,
  planVsActual,
} from '~/lib/logs/insights'
import { makeFormat } from '~/lib/logs/summary'
import { readStored, writeStored } from '~/lib/storage/browser-storage'
import styles from './improve.module.css'
import { Seg } from './Seg'

const VIEW_KEY = 'befocus:improve-view'
const viewSchema = z.enum(['insights', 'charts', 'both'])
type View = z.infer<typeof viewSchema>

const OPTIONS = [
  { value: 'insights', label: 'Insights' },
  { value: 'charts', label: 'Charts' },
  { value: 'both', label: 'Both' },
]
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function ObservationList({ items }: { items: Observation[] }) {
  if (items.length === 0)
    return <p className={styles.nothing}>Nothing stands out in the last 14 days.</p>
  return (
    <ul className={styles.obsList}>
      {items.map(o => (
        <li key={o.id} className={styles.obs}>
          <span className={styles.dot} aria-hidden />
          <p className={styles.obsText}>{o.text}</p>
          <div className={styles.evidence} data-rule={o.id} role='img' aria-label={o.label}>
            {o.bars.map((b, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional and static
                key={i}
                className={cn(styles.ebar, styles[b.status])}
                style={{ height: `${Math.round(b.value * 100)}%` }}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}

function PlanRows({ rows, scale }: { rows: PlanRow[]; scale: number }) {
  const pct = (m: number) => `${scale > 0 ? (m / scale) * 100 : 0}%`
  return (
    <ul className={styles.rows}>
      {rows.map(r => (
        <li key={r.label} className={styles.prow}>
          <span aria-hidden className={styles.pday}>
            {r.day}
          </span>
          <span aria-hidden className={styles.track}>
            <span className={styles.planned} style={{ width: pct(r.plannedMinutes) }} />
            <span className={styles.focused} style={{ width: pct(r.focusedMinutes) }}>
              {r.addedMinutes > 0 && r.focusedMinutes > 0 && (
                <span
                  className={styles.added}
                  style={{ width: `${Math.min(100, (r.addedMinutes / r.focusedMinutes) * 100)}%` }}
                />
              )}
            </span>
          </span>
          <span aria-hidden className={styles.pval}>
            {r.focusedMinutes}m
          </span>
          <span className='sr-only'>
            {`${r.label}: planned ${r.plannedMinutes} minutes, focused ${r.focusedMinutes} minutes, ${r.addedMinutes} added`}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Calendar({ sessions, now }: { sessions: HistorySession[]; now: number }) {
  const cells = calendar(sessions, now)
  const fmt = makeFormat()
  const weeks = Array.from({ length: 5 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  return (
    <table className={styles.calendar}>
      <caption className='sr-only'>Focus time, last 5 weeks</caption>
      <thead aria-hidden>
        <tr>
          {WEEKDAYS.map((d, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed weekday order
            <th key={i}>{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map(week => (
          <tr key={week[0]?.date}>
            {week.map(c => {
              const [y = 0, m = 1, d = 1] = c.date.split('-').map(Number)
              const day = fmt.day(new Date(y, m - 1, d).getTime(), now)
              return (
                <td
                  key={c.date}
                  className={cn(styles.cell, styles[`l${c.level}`], c.today && styles.today)}
                  style={c.future ? { visibility: 'hidden' } : undefined}
                >
                  <span className='sr-only'>
                    {c.minutes > 0
                      ? `${day}, ${fmt.compact(c.minutes * 60)} focused`
                      : `${day}, no focus`}
                  </span>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ImprovePanel({ sessions, now }: { sessions: HistorySession[]; now: number }) {
  const [view, setView] = useState<View>('insights')
  // Read after mount so the server render and first client render both show Insights.
  useEffect(() => {
    const stored = readStored(VIEW_KEY, viewSchema)
    if (stored) setView(stored)
  }, [])

  const { finished, ready } = useMemo(() => improveState(sessions, now), [sessions, now])
  const fmt = useMemo(() => makeFormat(), [])
  const obs = useMemo(() => observations(sessions, now, fmt), [sessions, now, fmt])
  const plan = useMemo(
    () => planVsActual(sessions, now, fmt, view === 'both' ? 4 : 6),
    [sessions, now, fmt, view],
  )

  const onView = (value: string | null) => {
    const next = viewSchema.safeParse(value)
    if (!next.success) return
    setView(next.data)
    writeStored(VIEW_KEY, next.data)
  }

  return (
    <section className={styles.panel} aria-labelledby='improve-title'>
      <div className={styles.head}>
        <h2 id='improve-title' className={styles.sec}>
          What to improve <em>last 14 days</em>
        </h2>
        {ready && (
          <Seg size='xs' legend='Improve view' options={OPTIONS} value={view} onChange={onView} />
        )}
      </div>
      <div className={styles.body} key={ready ? view : 'empty'}>
        {!ready ? (
          <>
            <p className={styles.emptyText}>Finish 3 sessions to see what to improve.</p>
            <p className={styles.progress}>
              {finished} of 3 so far
              <span className={styles.dots} aria-hidden>
                {[0, 1, 2].map(i => (
                  <span key={i} className={cn(styles.pdot, i < finished && styles.pdotOn)} />
                ))}
              </span>
            </p>
          </>
        ) : (
          <>
            {view !== 'charts' && (
              <ObservationList items={view === 'both' ? obs.slice(0, 2) : obs} />
            )}
            {view !== 'insights' && (
              <div className={view === 'both' ? styles.gap : undefined}>
                <p className={styles.caption}>
                  Planned (outline) vs focused (fill), added time hatched
                </p>
                <PlanRows rows={plan.rows} scale={plan.scale} />
                {view === 'charts' && (
                  <>
                    <h3 className={cn(styles.sec, styles.weeks)}>5 weeks</h3>
                    <Calendar sessions={sessions} now={now} />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
