'use client'

import { Minus, Plus } from 'lucide-react'
import {
  type KeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import {
  LIMITS,
  type LimitKind,
  limitText,
  rangeText,
  stepValue,
  unitText,
  valueText,
} from '~/lib/session/session'
import s from './session-card.module.css'

const HOLD_DELAY_MS = 400
const HOLD_REPEAT_MS = 120

type Props = {
  kind: LimitKind
  label: string
  value: number
  onChange: (next: number) => void
  spinRef?: Ref<HTMLSpanElement>
}

export default function Stepper({ kind, label, value, onChange, spinRef }: Props) {
  const nameId = useId()
  const hintId = useId()
  const { min, max } = LIMITS[kind]
  const [bump, setBump] = useState(false)
  const [held, setHeld] = useState<1 | -1 | null>(null)

  // Latest value/handler for the hold timers, which outlive a render.
  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Direction of the last change, for the number roll.
  const prevRef = useRef(value)
  const rollRef = useRef<'up' | 'down' | undefined>(undefined)
  if (value !== prevRef.current) {
    rollRef.current = value > prevRef.current ? 'up' : 'down'
    prevRef.current = value
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const apply = useCallback((next: number) => {
    if (next === valueRef.current) return false
    valueRef.current = next
    onChangeRef.current(next)
    return true
  }, [])

  const stop = useCallback(() => {
    clearTimeout(timeoutRef.current)
    clearInterval(intervalRef.current)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    setHeld(null)
  }, [])

  useEffect(() => stop, [stop])

  const startHold = (dir: 1 | -1) => {
    stop()
    if (!apply(stepValue(valueRef.current, kind, dir))) return
    setHeld(dir)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (!apply(stepValue(valueRef.current, kind, dir))) stop()
      }, HOLD_REPEAT_MS)
    }, HOLD_DELAY_MS)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    const cur = valueRef.current
    let next: number
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = stepValue(cur, kind, 1)
        break
      case 'ArrowDown':
      case 'ArrowLeft':
        next = stepValue(cur, kind, -1)
        break
      case 'PageUp':
        next = stepValue(cur, kind, 1, 3)
        break
      case 'PageDown':
        next = stepValue(cur, kind, -1, 3)
        break
      case 'Home':
        next = min
        break
      case 'End':
        next = max
        break
      default:
        return
    }
    e.preventDefault()
    if (!apply(next)) setBump(true)
  }

  const btnProps = (dir: 1 | -1) => ({
    type: 'button' as const,
    tabIndex: -1,
    className: s.btn,
    'data-held': held === dir ? '' : undefined,
    onPointerDown: (e: React.PointerEvent) => {
      // Keep focus on the spinbutton so a button turning disabled never drops it.
      e.preventDefault()
      startHold(dir)
    },
    onPointerLeave: stop,
    // Pointer presses are handled on pointerdown; detail 0 is keyboard/AT activation.
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) apply(stepValue(valueRef.current, kind, dir))
    },
  })

  const limit = limitText(kind, value)
  const lower = label.toLowerCase()

  return (
    <div
      className={s.stepper}
      data-at-limit={limit ? '' : undefined}
      data-bump={bump ? '' : undefined}
    >
      <div className={s.stepHead}>
        <span id={nameId} className={s.name}>
          {label}
        </span>
        <span id={hintId} className={s.range}>
          {limit ?? rangeText(kind)}
        </span>
      </div>
      <div className={s.pill}>
        <button {...btnProps(-1)} aria-label={`Decrease ${lower}`} disabled={value <= min}>
          <Minus size={14} strokeWidth={2} aria-hidden />
        </button>
        <span
          ref={spinRef}
          className={s.value}
          role='spinbutton'
          tabIndex={0}
          aria-labelledby={nameId}
          aria-describedby={hintId}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={valueText(kind, value)}
          onKeyDown={onKeyDown}
          onAnimationEnd={() => setBump(false)}
        >
          <span className={s.read}>
            <span key={value} className={s.num} data-dir={rollRef.current}>
              {value}
            </span>
            <span className={s.unit}>{unitText(kind, value)}</span>
          </span>
        </span>
        <button {...btnProps(1)} aria-label={`Increase ${lower}`} disabled={value >= max}>
          <Plus size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}
