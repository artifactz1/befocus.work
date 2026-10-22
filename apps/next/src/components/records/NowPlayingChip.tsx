'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useDeckStore } from '~/store/useDeckStore'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useCustomizeActions } from '../customize/useCustomizeActions'
import styles from './now-playing.module.css'
import Vinyl, { Eq, soundLook } from './Vinyl'

// The record outside the room: shown while it plays, and held after a pause from here.
export function useNowPlaying() {
  const isOpen = useDeckStore(state => state.deck === 'records')
  const record = useSoundsStore(state => state.sounds[state.bgMusicId])
  const chipHeld = useSoundsStore(state => state.chipHeld)
  const { close } = useCustomizeActions()

  const playing = Boolean(record?.playing)
  const shown = !isOpen && record !== undefined && (playing || chipHeld) ? record : undefined

  const toggle = () => {
    const { playRecord, pauseRecord, setChipHeld } = useSoundsStore.getState()
    if (playing) {
      setChipHeld(true)
      pauseRecord()
    } else if (record) playRecord(record.id)
  }
  const open = () => {
    close()
    useDeckStore.getState().openDeck('records')
  }
  return { record: shown, playing, toggle, open }
}

// Desktop pill above the timer controls. On phone the Records button carries the record instead.
export default function NowPlayingChip() {
  const { record, playing, toggle, open } = useNowPlaying()

  return (
    <AnimatePresence>
      {record && (
        <motion.div
          className={styles.pill}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type='button'
            className={styles.open}
            aria-label={`Open records, ${playing ? 'playing' : 'paused'} ${record.name}`}
            onClick={open}
          >
            <Vinyl size={26} look={soundLook(record)} spin={playing} />
            <span className={styles.name}>{record.name}</span>
            {playing && <Eq />}
          </button>
          <button
            type='button'
            className={styles.play}
            aria-label={`${playing ? 'Pause' : 'Play'} ${record.name}`}
            onClick={toggle}
          >
            {playing ? <Pause aria-hidden='true' /> : <Play aria-hidden='true' />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
