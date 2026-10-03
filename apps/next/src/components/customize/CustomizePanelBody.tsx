'use client'

import { Button } from '@repo/ui/button'
import { Undo2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { selectIsDirty, useCustomizeStore } from '~/store/useCustomizeStore'
import styles from './customize-panel.module.css'
import { CUSTOMIZE_SECTIONS } from './sections'
import { useCustomizeActions } from './useCustomizeActions'

const CHIPS = CUSTOMIZE_SECTIONS.filter(section => section.chip)

export default function CustomizePanelBody({ variant }: { variant: 'desktop' | 'phone' }) {
  const isDirty = useCustomizeStore(selectIsDirty)
  const { close, revert } = useCustomizeActions()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [activeChip, setActiveChip] = useState(CHIPS[0]?.id)

  const revertButton = (
    <Button
      type='button'
      variant='ghost'
      className={styles.revert}
      onClick={revert}
      disabled={!isDirty}
    >
      <Undo2 aria-hidden />
      Revert
    </Button>
  )

  const doneButton = (
    <Button type='button' className={styles.done} onClick={close}>
      Done
    </Button>
  )

  // The chip for the last group whose top has scrolled to the top of the list. `.body` is
  // position: relative, so each group's offsetTop is measured from the top of the list.
  const onScroll = () => {
    const body = bodyRef.current
    if (!body || variant !== 'phone') return
    let current = CHIPS[0]?.id
    for (const chip of CHIPS) {
      const el = document.getElementById(chip.id)
      if (el && el.offsetTop <= body.scrollTop + 16) current = chip.id
    }
    setActiveChip(current)
  }

  const jumpTo = (id: string) => {
    const body = bodyRef.current
    const el = document.getElementById(id)
    if (!body || !el) return
    body.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' })
    setActiveChip(id)
  }

  return (
    <>
      {variant === 'desktop' ? (
        <div className={styles.head}>
          <h2 id='customize-heading' className={styles.heading} tabIndex={-1}>
            Customize
          </h2>
          <span className={styles.live}>Live preview</span>
          <button type='button' className={styles.closeBtn} aria-label='Close' onClick={close}>
            <X size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className={styles.head}>
            {revertButton}
            <h2 id='customize-heading' className={styles.heading} tabIndex={-1}>
              Customize
            </h2>
            {doneButton}
          </div>
          <nav className={styles.chips} aria-label='Jump to'>
            {CHIPS.map(chip => (
              <button
                key={chip.id}
                type='button'
                className={styles.chip}
                aria-current={chip.id === activeChip ? 'true' : undefined}
                onClick={() => jumpTo(chip.id)}
              >
                {chip.chip}
              </button>
            ))}
          </nav>
        </>
      )}

      <div ref={bodyRef} className={styles.body} onScroll={onScroll}>
        {CUSTOMIZE_SECTIONS.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </div>

      {variant === 'desktop' && (
        <div className={styles.foot}>
          {revertButton}
          {doneButton}
        </div>
      )}
    </>
  )
}
