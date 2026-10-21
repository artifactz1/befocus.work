'use client'

import { Drawer, DrawerPortal } from '@repo/ui/drawer'
import { cn } from '@repo/ui/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useDeckCard, useDeckRootAttrs } from '~/store/useDeckStore'
import { useSoundsStore } from '~/store/useSoundsStore'
import RecordRoomBody from './RecordRoomBody'
import styles from './records.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const TABBABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

export default function RecordRoom() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { open: isOpen, setOpen } = useDeckCard({
    card: 'records',
    headingId: 'records-heading',
    triggerSelector: '[data-records-trigger]',
    rerunFocusOn: isDesktop,
  })
  const reducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  useDeckRootAttrs()

  // opening the room clears the held footer chip
  useEffect(() => {
    if (isOpen) useSoundsStore.getState().setChipHeld(false)
  }, [isOpen])

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
        {isOpen && (
          <motion.section
            className={cn(styles.surface, styles.room)}
            role='dialog'
            aria-modal='false'
            aria-labelledby='records-heading'
            data-record-room
            data-deck-card
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
      open={isOpen}
      modal={false}
      shouldScaleBackground={false}
      handleOnly
      onOpenChange={setOpen}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          ref={contentRef}
          className={cn(styles.surface, styles.sheet)}
          aria-labelledby='records-heading'
          aria-describedby={undefined}
          data-record-room
          data-deck-card
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
