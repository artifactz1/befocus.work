'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import CustomizePanelDesktop from './CustomizePanelDesktop'
import CustomizePanelMobile from './CustomizePanelMobile'
import { useCustomizeActions } from './useCustomizeActions'

export default function CustomizePanel() {
  const panelOpen = useCustomizeStore(state => state.panelOpen)
  const { discard } = useCustomizeActions()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun on isDesktop so focus moves to the heading when the shell swaps
  useEffect(() => {
    if (!panelOpen) return

    const frame = requestAnimationFrame(() => {
      document.getElementById('customize-heading')?.focus()
    })

    return () => cancelAnimationFrame(frame)
  }, [panelOpen, isDesktop])

  // Return focus only on an open -> closed transition, never on mount.
  const wasOpen = useRef(panelOpen)
  useEffect(() => {
    const closed = wasOpen.current && !panelOpen
    wasOpen.current = panelOpen
    if (!closed) return

    const trigger = document.querySelectorAll<HTMLElement>('[data-customize-trigger]')
    for (const el of trigger) {
      if (el.offsetParent !== null) {
        el.focus()
        break
      }
    }
  }, [panelOpen])

  useEffect(() => {
    if (!panelOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        discard()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [panelOpen, discard])

  useEffect(() => {
    if (panelOpen && prevPathname.current !== pathname) {
      discard()
    }
    prevPathname.current = pathname
  }, [pathname, panelOpen, discard])

  return isDesktop ? <CustomizePanelDesktop /> : <CustomizePanelMobile />
}
