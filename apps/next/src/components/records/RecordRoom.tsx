'use client'

import { Drawer, DrawerPortal } from '@repo/ui/drawer'
import { cn } from '@repo/ui/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useSoundsStore } from '~/store/useSoundsStore'
import panel from '../customize/customize-panel.module.css'
import RecordRoomBody from './RecordRoomBody'
import styles from './records.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const TABBABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

export default function RecordRoom() {
  const roomOpen = useSoundsStore(state => state.roomOpen)
  const setRoomOpen = useSoundsStore(state => state.setRoomOpen)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun on isDesktop so focus moves to the heading when the shell swaps
  useEffect(() => {
    if (!roomOpen) return
    const frame = requestAnimationFrame(() => document.getElementById('records-heading')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [roomOpen, isDesktop])

  // Return focus only on an open -> closed transition, never on mount.
  const wasOpen = useRef(roomOpen)
  useEffect(() => {
    const closed = wasOpen.current && !roomOpen
    wasOpen.current = roomOpen
    if (!closed) return
    for (const el of document.querySelectorAll<HTMLElement>('[data-records-trigger]')) {
      if (el.offsetParent !== null) {
        el.focus()
        break
      }
    }
  }, [roomOpen])

  useEffect(() => {
    if (!roomOpen) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // Radix dialogs and menus handle their own Escape.
      if (
        document.querySelector(
          '[role="dialog"]:not([data-record-room]), [role="alertdialog"], [role="menu"]',
        )
      )
        return
      setRoomOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [roomOpen, setRoomOpen])

  useEffect(() => {
    if (roomOpen && prevPathname.current !== pathname) setRoomOpen(false)
    prevPathname.current = pathname
  }, [pathname, roomOpen, setRoomOpen])

  useEffect(() => {
    if (!roomOpen) return
    const root = document.documentElement
    root.dataset.room = 'open'
    return () => {
      delete root.dataset.room
    }
  }, [roomOpen])

  const onSheetKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !contentRef.current) return
    const tabbable = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
    ).filter(el => el.offsetParent !== null)
    const first = tabbable[0]
    const last = tabbable[tabbable.length - 1]
    if (!first || !last) return
    const active = document.activeElement

    if (event.shiftKey) {
      if (active === first || active?.id === 'records-heading') {
        event.preventDefault()
        last.focus()
      }
    } else if (active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (isDesktop) {
    return (
      <AnimatePresence>
        {roomOpen && (
          <motion.section
            className={cn(panel.panel, styles.room)}
            role='dialog'
            aria-modal='false'
            aria-labelledby='records-heading'
            data-record-room
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
          >
            <RecordRoomBody />
          </motion.section>
        )}
      </AnimatePresence>
    )
  }

  return (
    <Drawer
      open={roomOpen}
      modal={false}
      shouldScaleBackground={false}
      handleOnly
      onOpenChange={setRoomOpen}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          ref={contentRef}
          className={cn(panel.panel, styles.sheet)}
          aria-labelledby='records-heading'
          aria-describedby={undefined}
          data-record-room
          onCloseAutoFocus={e => e.preventDefault()}
          onKeyDown={onSheetKeyDown}
        >
          <DrawerPrimitive.Title asChild>
            <span aria-hidden className='sr-only' />
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Handle preventCycle aria-hidden className={styles.grab} />
          <RecordRoomBody />
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
