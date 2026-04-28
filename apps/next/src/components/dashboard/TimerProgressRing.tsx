'use client'

import { useTimerStore } from '~/store/useTimerStore'

const VIEWBOX = 800
const CENTER = VIEWBOX / 2
const RADIUS = 380
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function TimerProgressRing() {
  const timeLeft = useTimerStore(s => s.timeLeft)
  const workDuration = useTimerStore(s => s.workDuration)
  const breakDuration = useTimerStore(s => s.breakDuration)
  const isWorking = useTimerStore(s => s.isWorking)

  const total = isWorking ? workDuration : breakDuration
  const elapsed = total > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / total)) : 0
  const offset = CIRCUMFERENCE * elapsed

  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-0 flex items-center justify-center'
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className='-rotate-90 h-[min(72vh,92vw)] w-[min(72vh,92vw)]'
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill='none'
          stroke='hsl(var(--foreground) / 0.05)'
          strokeWidth='1'
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill='none'
          stroke='hsl(var(--foreground) / 0.15)'
          strokeWidth='1'
          strokeDasharray='1.5 14'
          strokeLinecap='round'
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill='none'
          stroke='hsl(var(--foreground) / 0.5)'
          strokeWidth='1.5'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE - offset}
          strokeLinecap='round'
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const major = i % 3 === 0
          const inner = RADIUS - (major ? 26 : 14)
          const x1 = CENTER + Math.cos(angle) * RADIUS
          const y1 = CENTER + Math.sin(angle) * RADIUS
          const x2 = CENTER + Math.cos(angle) * inner
          const y2 = CENTER + Math.sin(angle) * inner
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`hsl(var(--foreground) / ${major ? 0.3 : 0.15})`}
              strokeWidth={major ? 1.2 : 0.7}
              strokeLinecap='round'
            />
          )
        })}
      </svg>
    </div>
  )
}
