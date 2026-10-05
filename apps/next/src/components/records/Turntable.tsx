'use client'

import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { labelInk } from '~/lib/sounds/sounds'
import { useSoundsStore } from '~/store/useSoundsStore'
import styles from './records.module.css'
import { RECORD_MIME } from './Shelf'

const SPIN_DEG_PER_S = 200 // 1.8s per turn
const EASE = [0.2, 0.7, 0.2, 1] as const
const ARM_DOWN = 22

export default function Turntable() {
  const reduced = useReducedMotion()
  const bgMusicId = useSoundsStore(state => state.bgMusicId)
  const record = useSoundsStore(state => state.sounds[state.bgMusicId])
  const sounds = useSoundsStore(state => state.sounds)
  const toggleRecord = useSoundsStore(state => state.toggleRecord)
  const playRecord = useSoundsStore(state => state.playRecord)
  const setVolume = useSoundsStore(state => state.setVolume)

  const playing = Boolean(record?.playing)
  const [shown, setShown] = useState(record)
  const [swapping, setSwapping] = useState(false)
  const [over, setOver] = useState(false)

  const rotation = useMotionValue(0)
  const speed = useRef(0)
  const arm = useMotionValue(0)
  const discOpacity = useMotionValue(1)

  // Swap: arm lifts, old disc fades, new disc fades in, arm lowers (via the arm effect below).
  const lastId = useRef(bgMusicId)
  // biome-ignore lint/correctness/useExhaustiveDependencies: swap runs on id change only
  useEffect(() => {
    if (!record || reduced || lastId.current === bgMusicId) {
      lastId.current = bgMusicId
      setShown(record)
      return
    }
    lastId.current = bgMusicId
    let live = true
    setSwapping(true)
    ;(async () => {
      await animate(arm, 0, { duration: 0.25, ease: EASE })
      await animate(discOpacity, 0, { duration: 0.2 })
      if (!live) return
      setShown(record)
      await animate(discOpacity, 1, { duration: 0.3 })
      if (live) setSwapping(false)
    })()
    return () => {
      live = false
      setSwapping(false)
      discOpacity.set(1)
    }
  }, [bgMusicId, reduced])

  useEffect(() => {
    const target = playing && !swapping ? ARM_DOWN : 0
    if (reduced) arm.set(target)
    else animate(arm, target, { duration: 0.35, ease: EASE })
  }, [playing, swapping, reduced, arm])

  useAnimationFrame((_, delta) => {
    if (reduced) return
    const target = playing && !swapping ? SPIN_DEG_PER_S : 0
    const step = (SPIN_DEG_PER_S / (target ? 0.6 : 0.8)) * (delta / 1000)
    speed.current =
      target > speed.current
        ? Math.min(target, speed.current + step)
        : Math.max(target, speed.current - step)
    if (speed.current) rotation.set((rotation.get() + (speed.current * delta) / 1000) % 360)
  })

  const ink = labelInk(shown?.name ?? '')
  const acceptable = (e: React.DragEvent) => e.dataTransfer.types.includes(RECORD_MIME)

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target, keyboard path is the shelf
    <div
      className={styles.turntable}
      onDragOver={e => {
        if (!acceptable(e)) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        setOver(false)
        const id = e.dataTransfer.getData(RECORD_MIME)
        if (sounds[id]?.soundType !== 'bgMusic') return
        e.preventDefault()
        playRecord(id)
      }}
    >
      <svg viewBox='0 0 400 400' className={styles.deck} aria-hidden='true'>
        <defs>
          <linearGradient id='plinth' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' stopColor='#22201e' />
            <stop offset='1' stopColor='#181716' />
          </linearGradient>
        </defs>
        <rect x='0' y='0' width='400' height='400' rx='20' fill='url(#plinth)' />
        <circle cx='176' cy='200' r='150' fill='#2c2a28' />
        <circle cx='176' cy='200' r='146' fill='#1a1918' />
        {over && (
          <circle
            cx='176'
            cy='200'
            r='152'
            fill='none'
            stroke='var(--user-accent)'
            strokeWidth='3'
          />
        )}
        <motion.g style={{ opacity: discOpacity }}>
          <motion.g style={{ rotate: rotation, originX: '176px', originY: '200px' }}>
            <circle cx='176' cy='200' r='140' fill='#0c0c0c' />
            {[128, 116, 104, 92, 80, 68].map(r => (
              <circle
                key={r}
                cx='176'
                cy='200'
                r={r}
                fill='none'
                stroke='#fff'
                strokeOpacity='0.05'
              />
            ))}
            {shown && (
              <>
                <circle cx='176' cy='200' r='48' fill={ink.ink} />
                <circle cx='176' cy='200' r='44' fill='none' stroke={ink.inkDeep} strokeWidth='2' />
                <circle cx='176' cy='170' r='6' fill={ink.inkDeep} />
              </>
            )}
          </motion.g>
          <path d='M176 200 L176 60 A140 140 0 0 1 275 101 Z' fill='#fff' fillOpacity='0.04' />
        </motion.g>
        <circle cx='176' cy='200' r='4' fill='#cfcac3' />
        <circle cx='352' cy='300' r='6' fill='#3a3735' />
        <circle cx='344' cy='72' r='22' fill='#3a3735' />
        <motion.g style={{ rotate: arm, originX: '344px', originY: '72px' }}>
          <rect x='334' y='34' width='20' height='26' rx='4' fill='#5a5651' />
          <path d='M344 72 L344 270 L326 292' fill='none' stroke='#bdb8b2' strokeWidth='4' />
          <rect x='319' y='284' width='14' height='22' rx='3' fill='#bdb8b2' />
        </motion.g>
      </svg>
      <button
        type='button'
        className={styles.playBtn}
        disabled={!record}
        aria-label={record ? `${playing ? 'Pause' : 'Play'} ${record.name}` : 'Play'}
        onClick={() => record && toggleRecord(record.id)}
      >
        {playing ? <Pause size={18} aria-hidden='true' /> : <Play size={18} aria-hidden='true' />}
      </button>
      <input
        type='range'
        className={styles.volume}
        aria-label='Record volume'
        min={0}
        max={1}
        step={0.01}
        disabled={!record}
        value={record?.volume ?? 0}
        onChange={e => record && setVolume(record.id, Number(e.target.value))}
      />
    </div>
  )
}
