'use client'

import { useEffect, useRef, useState } from 'react'
import { useSessionView } from '~/hooks/usePlan'
import { stripWidths } from '~/lib/plan/strip'
import { blockMinutes } from './ProgressSlot'
import styles from './progress.module.css'

/** 8px block row inside the 132px timer strip while the Tasks sheet is open on a started session. */
export default function MiniStrip() {
  const view = useSessionView()
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const live = view?.state === 'live'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const blocks = live && view ? view.blocks : []
  const { widths } = stripWidths(
    blocks.map(b => ({ kind: b.kind, minutes: blockMinutes(b) })),
    width,
    { gap: 2, minFocus: 4, minBreak: 2 },
  )
  return (
    <div ref={ref} aria-hidden className={styles.mini} hidden={!live}>
      {width > 0 &&
        blocks.map((b, i) => {
          const span = b.plannedSeconds + b.addedSeconds
          return (
            <div
              key={b.id}
              className={styles.block}
              data-kind={b.kind}
              data-state={b.state}
              style={{ width: widths[i] ?? 0 }}
            >
              {b.state === 'current' && (
                <div
                  className={styles.fill}
                  style={{
                    transform: `scaleX(${span > 0 ? Math.min(1, b.elapsedSeconds / span) : 0})`,
                  }}
                />
              )}
              {b.addedSeconds > 0 && (
                <div
                  className={styles.plus}
                  style={{ width: `${(b.addedSeconds / span) * 100}%` }}
                />
              )}
            </div>
          )
        })}
    </div>
  )
}
