'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Disc3 } from 'lucide-react'
import { useState } from 'react'
import { useDeckStore } from '~/store/useDeckStore'
import { useCustomizeActions } from '../customize/useCustomizeActions'
import MenuButton from '../helper/MenuButtons'
import { useNowPlaying } from './NowPlayingChip'
import styles from './now-playing.module.css'
import Vinyl, { soundLook } from './Vinyl'

// Below md the button carries the playing record (a spinning disc); on wider screens the pill does.
export default function RecordsButton({ caption = false }: { caption?: boolean }) {
  const isOpen = useDeckStore(state => state.deck === 'records')
  const toggleDeck = useDeckStore(state => state.toggleDeck)
  const { close } = useCustomizeActions()
  const { record, playing } = useNowPlaying()
  const [tip, setTip] = useState(false)

  const toggle = () => {
    if (!isOpen) close()
    toggleDeck('records')
  }

  return (
    <>
      <TooltipProvider>
        {/* Closed while the room is open, so its Escape listener cannot swallow ours, and only
            opened by hover or keyboard focus, not by focus returning after a tap or click. */}
        <Tooltip
          open={tip && !isOpen}
          onOpenChange={open =>
            setTip(
              open &&
                Boolean(
                  document.querySelector('[data-records-trigger]:is(:hover, :focus-visible)'),
                ),
            )
          }
        >
          <TooltipTrigger asChild>
            <MenuButton
              aria-label={
                record ? `Records, ${playing ? 'playing' : 'paused'} ${record.name}` : 'Records'
              }
              aria-expanded={isOpen}
              data-records-trigger
              data-active={isOpen || undefined}
              data-carrying={record ? true : undefined}
              className={styles.button}
              onClick={toggle}
            >
              <span className={styles.ring} aria-hidden='true' />
              <Disc3 className={styles.icon} />
              {record && (
                <Vinyl
                  size={26}
                  look={soundLook(record)}
                  spin={playing}
                  className={styles.carried}
                />
              )}
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold' side='top' sideOffset={8}>
            <p>Records</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {caption && record && (
        <p className={styles.caption} aria-hidden='true'>
          {record.name} · tap to open
        </p>
      )}
    </>
  )
}
