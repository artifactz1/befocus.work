import { type PointerEvent, useCallback, useEffect, useRef, useState } from 'react'

const HOLD_MS = 400

type Options = {
  /** Quick tap: apply 1 minute. */
  onTap: () => void
  /** 400 ms elapsed with the pointer still on the button: open the tray. Nothing is applied. */
  onHoldOpen: () => void
  /** Released over an enabled tray cell after the tray opened. */
  onRelease: (minutes: number) => void
}

type Cell = { minutes: number; enabled: boolean } | null

function cellAt(x: number, y: number): Cell {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[role='menuitem']")
  if (!el) return null
  return {
    minutes: Number(el.dataset.minutes),
    enabled: el.getAttribute('aria-disabled') !== 'true',
  }
}

/** Tap vs 400 ms hold on a trigger button, with slide-to-cell once the tray is open (08-UI-SPEC Gesture). */
export function useHoldPress({ onTap, onHoldOpen, onRelease }: Options) {
  const [held, setHeld] = useState(false)
  const [activeMinutes, setActiveMinutes] = useState<number | null>(null)
  const phase = useRef<'idle' | 'down' | 'open'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Set when a pointer gesture already acted, so the click that follows does not apply twice.
  const suppressClick = useRef(false)
  const cb = useRef({ onTap, onHoldOpen, onRelease })
  cb.current = { onTap, onHoldOpen, onRelease }

  const reset = useCallback(() => {
    clearTimeout(timer.current)
    phase.current = 'idle'
    setHeld(false)
    setActiveMinutes(null)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    suppressClick.current = false
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // No active pointer to capture (synthetic events); the coordinate checks still work.
    }
    phase.current = 'down'
    setHeld(true)
    timer.current = setTimeout(() => {
      phase.current = 'open'
      cb.current.onHoldOpen()
    }, HOLD_MS)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (phase.current === 'down') {
      // Capture keeps events on the trigger, so leaving it is detected by coordinates.
      const r = e.currentTarget.getBoundingClientRect()
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!inside) {
        reset()
        suppressClick.current = true
      }
    } else if (phase.current === 'open') {
      const cell = cellAt(e.clientX, e.clientY)
      setActiveMinutes(cell?.enabled ? cell.minutes : null)
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const was = phase.current
    if (was === 'idle') return
    suppressClick.current = true
    const cell = was === 'open' ? cellAt(e.clientX, e.clientY) : null
    reset()
    if (was === 'down') cb.current.onTap()
    else if (cell?.enabled) cb.current.onRelease(cell.minutes)
    // Open and released off a cell or on a dimmed one: the tray stays open for a tap.
  }

  const onPointerCancel = () => {
    if (phase.current === 'idle') return
    suppressClick.current = true
    reset()
  }

  /** Wrap the trigger's click: pointer gestures are handled above, keyboard clicks apply 1 minute. */
  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    cb.current.onTap()
  }

  return {
    held,
    activeMinutes,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick },
  }
}
