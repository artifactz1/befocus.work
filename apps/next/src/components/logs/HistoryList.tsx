'use client'

import { useEffect, useRef, useState } from 'react'
import type { DayGroup, SessionDigest } from '~/lib/logs/history'
import { makeFormat } from '~/lib/logs/summary'
import { stripWidths } from '~/lib/plan/strip'
import styles from './log.module.css'

function cellState(c: SessionDigest['cells'][number]) {
  if (c.outcome === 'finished') return 'done'
  if (c.outcome === 'skipped') return 'skipped'
  return 'idle'
}

/** 12px mini strip, widths proportional to block seconds (same helper as the progress strip). */
function HistoryStrip({ cells }: { cells: SessionDigest['cells'] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const { widths } = stripWidths(
    cells.map(c => ({ kind: c.kind, minutes: c.seconds / 60 })),
    width,
    { gap: 2, minFocus: 4, minBreak: 2 },
  )
  return (
    <div ref={ref} aria-hidden className={styles.strip}>
      {width > 0 &&
        cells.map((c, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional and static
            key={i}
            className={styles.cell}
            data-kind={c.kind}
            data-state={cellState(c)}
            style={{ width: widths[i] ?? 0 }}
          />
        ))}
    </div>
  )
}

export function HistoryList({
  groups,
  selectedId,
  onSelect,
  hasOlder,
  onOlder,
}: {
  groups: DayGroup[]
  selectedId: string | null
  onSelect: (sessionId: string) => void
  hasOlder: boolean
  onOlder: () => void
}) {
  const fmt = makeFormat()
  return (
    <div>
      {groups.map(g => (
        <section key={g.label} className={styles.group}>
          <h2 className={styles.day}>{g.label}</h2>
          <ul className={styles.rows}>
            {g.sessions.map(d => (
              <li key={d.sessionId}>
                <button
                  type='button'
                  className={styles.row}
                  data-session-row={d.sessionId}
                  aria-current={d.sessionId === selectedId ? 'true' : undefined}
                  onClick={() => onSelect(d.sessionId)}
                >
                  <span className={styles.rowTitle}>
                    {d.status === 'finished' ? 'Ended ' : 'Stopped '}
                    {d.endClock}
                  </span>
                  <span className={styles.rowMeta}>
                    {fmt.compact(d.focusSeconds)}
                    {d.tasksTotal > 0 && ` · ${d.tasksDone} / ${d.tasksTotal} tasks`}
                  </span>
                  <HistoryStrip cells={d.cells} />
                  {d.firstLog && <span className={styles.rowLog}>{d.firstLog}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {hasOlder && (
        <button type='button' className={styles.older} onClick={onOlder}>
          Show older
        </button>
      )}
    </div>
  )
}
