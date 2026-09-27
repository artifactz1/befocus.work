'use client'

import { Drawer, DrawerPortal } from '@repo/ui/drawer'
import { cn } from '@repo/ui/lib/utils'
import { type KeyboardEvent, useRef } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import CustomizePanelBody from './CustomizePanelBody'
import styles from './customize-panel.module.css'
import { useCustomizeActions } from './useCustomizeActions'

const TABBABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

export default function CustomizePanelMobile() {
  const panelOpen = useCustomizeStore(state => state.panelOpen)
  const { discard } = useCustomizeActions()
  const contentRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !contentRef.current) return

    const tabbable = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
    ).filter(el => el.offsetParent !== null)
    if (tabbable.length === 0) return

    const first = tabbable[0]
    const last = tabbable[tabbable.length - 1]
    const active = document.activeElement

    if (event.shiftKey) {
      if (active === first || active?.id === 'customize-heading') {
        event.preventDefault()
        last?.focus()
      }
    } else if (active === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <Drawer
      open={panelOpen}
      modal={false}
      shouldScaleBackground={false}
      handleOnly
      onOpenChange={next => {
        if (!next) discard()
      }}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          ref={contentRef}
          className={cn(styles.panel, styles.sheet)}
          aria-labelledby='customize-heading'
          aria-describedby={undefined}
          data-customize-panel
          onCloseAutoFocus={e => e.preventDefault()}
          onKeyDown={onKeyDown}
        >
          {/* ponytail: Radix Dialog warns in dev when it can't find its own Title, even
              though aria-labelledby already points at the visible "Customize" heading.
              This satisfies that check without adding a second announced name. */}
          <DrawerPrimitive.Title asChild>
            <span aria-hidden className='sr-only' />
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Handle preventCycle aria-hidden className={styles.grab} />
          <CustomizePanelBody />
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
