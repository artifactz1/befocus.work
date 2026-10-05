'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { labelInk } from '~/lib/sounds/sounds'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useCustomizeActions } from '../customize/useCustomizeActions'
import styles from './now-playing.module.css'

export default function NowPlayingChip({ variant }: { variant: 'full' | 'compact' }) {
  const roomOpen = useSoundsStore(state => state.roomOpen)
  const record = useSoundsStore(state => state.sounds[state.bgMusicId])
  const chipHeld = useSoundsStore(state => state.chipHeld)
  const { close } = useCustomizeActions()

  const visible = !roomOpen && record !== undefined && (record.playing || chipHeld)
  const playing = Boolean(record?.playing)

  const toggle = () => {
    const { playRecord, pauseRecord, setChipHeld } = useSoundsStore.getState()
    if (playing) {
      setChipHeld(true)
      pauseRecord()
    } else if (record) playRecord(record.id)
  }
  const open = () => {
    close()
    useSoundsStore.getState().setRoomOpen(true)
  }

  return (
    <AnimatePresence>
      {visible && record && (
        <motion.div
          className={`${styles.chip} ${variant === 'compact' ? styles.compact : ''}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type='button'
            className={styles.play}
            aria-label={`${playing ? 'Pause' : 'Play'} ${record.name}`}
            onClick={toggle}
          >
            {playing ? (
              <Pause size={16} aria-hidden='true' />
            ) : (
              <Play size={16} aria-hidden='true' />
            )}
          </button>
          <button
            type='button'
            className={styles.open}
            aria-label={`Open records, ${record.name}`}
            onClick={open}
          >
            <span
              className={styles.disc}
              data-playing={playing || undefined}
              style={{ ['--ink' as string]: labelInk(record.name).ink }}
              aria-hidden='true'
            />
            {variant === 'full' && (
              <>
                {playing && <span className={styles.dot} aria-hidden='true' />}
                <span className={styles.name}>{record.name}</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
