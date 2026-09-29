'use client'

import { useEffect } from 'react'
import { useTimerStore } from '~/store/useTimerStore'

const IDLE_DELAY_MS = 2000
const REARM_DELAY_MS = 1800

export function useChromeIdle() {
  const { isRunning } = useTimerStore()

  useEffect(() => {
    const root = document.documentElement

    if (!isRunning) {
      root.removeAttribute('data-chrome-idle')
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const setIdle = () => {
      root.setAttribute('data-chrome-idle', '')
    }

    const wake = () => {
      if (root.hasAttribute('data-chrome-idle')) {
        root.removeAttribute('data-chrome-idle')
      }
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(setIdle, REARM_DELAY_MS)
    }

    timeoutId = setTimeout(setIdle, IDLE_DELAY_MS)

    window.addEventListener('pointermove', wake)
    window.addEventListener('pointerdown', wake)
    window.addEventListener('keydown', wake)
    window.addEventListener('wheel', wake, { passive: true })

    return () => {
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
      window.removeEventListener('wheel', wake)
      if (timeoutId) clearTimeout(timeoutId)
      root.removeAttribute('data-chrome-idle')
    }
  }, [isRunning])
}
