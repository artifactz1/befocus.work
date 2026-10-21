'use client'

import { type KeyboardEvent, type RefObject, useCallback, useEffect, useRef } from 'react'
import { z } from 'zod'
import { readStored, writeStored } from '~/lib/storage/browser-storage'
import { useTimerStore } from '~/store/useTimerStore'
import styles from './adjust-tray.module.css'

const AMOUNTS = [1, 5, 10] as const
const HINT_KEY = 'befocus.adjustHintSeen'
const HINT_EVENT = 'befocus:adjust-hint-seen'

export function readAdjustHintSeen(): boolean {
  return readStored(HINT_KEY, z.boolean()) ?? false
}

export function markAdjustHintSeen() {
  writeStored(HINT_KEY, true)
  window.dispatchEvent(new Event(HINT_EVENT))
}

type Props = {
  id: string
  sign: 1 | -1
  open: boolean
  activeMinutes: number | null
  openedBy: 'pointer' | 'keyboard'
  onApply: (minutes: number) => void
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
}

export default function AdjustTray({
  id,
  sign,
  open,
  activeMinutes,
  openedBy,
  onApply,
  onClose,
  triggerRef,
}: Props) {
  const timeLeft = useTimerStore(s => s.timeLeft)
  const menuRef = useRef<HTMLDivElement>(null)
  const focusInside = useRef(false)
  const cells = useCallback(
    () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []),
    [],
  )
  const dimmed = (m: number) => sign === -1 && m * 60 >= timeLeft

  // Keyboard open: focus the first enabled cell.
  useEffect(() => {
    if (open && openedBy === 'keyboard') {
      cells()
        .find(c => c.getAttribute('aria-disabled') !== 'true')
        ?.focus()
    }
  }, [open, openedBy, cells])

  // Closed while focus was inside (including removal by a status change): hand focus back.
  useEffect(() => {
    if (open) return
    if (
      focusInside.current &&
      (!document.activeElement || document.activeElement === document.body)
    )
      triggerRef.current?.focus()
    focusInside.current = false
  }, [open, triggerRef])

  // Listeners exist only while open (T-08-17).
  useEffect(() => {
    if (!open) return
    const keydown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (menuRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
      onClose()
    }
    const pointerdown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      onClose()
    }
    window.addEventListener('keydown', keydown)
    document.addEventListener('pointerdown', pointerdown)
    return () => {
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('pointerdown', pointerdown)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  const apply = (m: number) => {
    if (dimmed(m)) return
    onApply(m)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = cells()
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const step = e.key === 'ArrowRight' ? 1 : -1
      list[(i + step + list.length) % list.length]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const m = AMOUNTS[i]
      if (m) apply(m)
    } else if (e.key === 'Tab') {
      // No preventDefault: Tab then moves on from the trigger.
      triggerRef.current?.focus()
      onClose()
    }
  }

  const mark = sign === 1 ? '+' : '−'
  return (
    <div
      ref={menuRef}
      id={id}
      role='menu'
      aria-label={sign === 1 ? 'Add time' : 'Remove time'}
      className={`${styles.tray} ${sign === 1 ? styles.right : styles.left}`}
      onKeyDown={onKeyDown}
      onFocus={() => {
        focusInside.current = true
      }}
      onBlur={e => {
        if (e.relatedTarget && !menuRef.current?.contains(e.relatedTarget as Node))
          focusInside.current = false
      }}
    >
      {AMOUNTS.map(m => (
        <button
          key={m}
          type='button'
          role='menuitem'
          data-minutes={m}
          tabIndex={-1}
          aria-label={`${sign === 1 ? 'Add' : 'Remove'} ${m} ${m === 1 ? 'minute' : 'minutes'}`}
          aria-disabled={dimmed(m) || undefined}
          className={`${styles.cell} ${activeMinutes === m ? styles.active : ''}`}
          onClick={() => apply(m)}
        >
          {mark}
          {m}
        </button>
      ))}
    </div>
  )
}
