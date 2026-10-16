'use client'

import {
  animate,
  type MotionValue,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion'
import { Pause, Play, Volume1 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useSoundsStore } from '~/store/useSoundsStore'
import styles from './records.module.css'
import { RECORD_MIME } from './Shelf'
import Vinyl, { Eq, soundLook } from './Vinyl'

const SPIN_DEG_PER_S = 112 // 3.2s per turn, the same as the small spinning discs
const EASE = [0.2, 0.7, 0.2, 1] as const
const EMPTY = { label: 'rgb(255 255 255 / 0.06)', base: '#0b0b0b' }

// Hairline tonearm. It rests straight down beside the disc and swings onto it to play.
function Arm({ size, swing }: { size: number; swing: MotionValue<number> }) {
  const px = size + 18
  const py = 20
  const len = size * 0.7 - py
  return (
    <svg
      className={styles.arm}
      width={size + 40}
      height={size}
      viewBox={`0 0 ${size + 40} ${size}`}
      aria-hidden='true'
    >
      <motion.g style={{ rotate: swing, originX: `${px}px`, originY: `${py}px` }}>
        <line
          x1={px}
          y1={py}
          x2={px}
          y2={py + len}
          stroke='rgb(245 245 244 / 0.55)'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <line
          x1={px}
          y1={py}
          x2={px}
          y2={py - len * 0.12}
          stroke='rgb(245 245 244 / 0.35)'
          strokeWidth='4'
          strokeLinecap='round'
        />
        <rect x={px - 6} y={py + len - 3} width='12' height='6' rx='1.5' fill='#d6d3d1' />
      </motion.g>
      <circle cx={px} cy={py} r='7' fill='#1b1b1b' stroke='rgb(255 255 255 / 0.14)' />
      <circle cx={px} cy={py} r='2' fill='rgb(255 255 255 / 0.4)' />
    </svg>
  )
}

// Swing that puts the stylus at (0.78, 0.62) of the disc, as on the board.
const armDown = (size: number) =>
  (Math.atan2(size * 0.62 - 20, size * 0.78 - size - 18) * 180) / Math.PI - 90

export default function Turntable() {
  const reduced = useReducedMotion()
  const phone = useMediaQuery('(max-width: 639px)')
  const size = phone ? 176 : 224
  const bgMusicId = useSoundsStore(state => state.bgMusicId)
  const record = useSoundsStore(state => state.sounds[state.bgMusicId])
  const sounds = useSoundsStore(state => state.sounds)
  const recordIds = useSoundsStore(
    useShallow(state =>
      Object.values(state.sounds)
        .filter(s => s.soundType === 'bgMusic')
        .map(s => s.id),
    ),
  )
  const toggleRecord = useSoundsStore(state => state.toggleRecord)
  const playRecord = useSoundsStore(state => state.playRecord)
  const setVolume = useSoundsStore(state => state.setVolume)

  const playing = Boolean(record?.playing)
  const [shown, setShown] = useState(record)
  const [swapping, setSwapping] = useState(false)
  const [over, setOver] = useState(false)

  const rotation = useMotionValue(0)
  const speed = useRef(0)
  const swing = useMotionValue(0)
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
    // The arm effect owns the swing and lifts it while swapping; awaiting a swing animation
    // here would hang, since that effect interrupts it.
    setSwapping(true)
    ;(async () => {
      await animate(discOpacity, 0, { duration: 0.2, delay: 0.25 })
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

  // Same record, new look (a label picture finished uploading): show it straight away.
  useEffect(() => {
    if (!swapping && record?.id === shown?.id) setShown(record)
  }, [record, shown?.id, swapping])

  useEffect(() => {
    const target = playing && !swapping ? armDown(size) : 0
    if (reduced) swing.set(target)
    else animate(swing, target, { duration: 0.35, ease: EASE })
  }, [playing, swapping, reduced, swing, size])

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

  const acceptable = (e: React.DragEvent) => e.dataTransfer.types.includes(RECORD_MIME)
  const position = record ? recordIds.indexOf(record.id) + 1 : 0
  const volume = Math.round((record?.volume ?? 0) * 100)

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target, keyboard path is the shelf */}
      <div
        className={styles.deck}
        data-over={over || undefined}
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
        <div className={styles.deckInner} style={{ width: size + 40, height: size }}>
          <motion.div style={{ opacity: discOpacity }}>
            <Vinyl
              size={size}
              look={shown ? soundLook(shown) : EMPTY}
              rotate={rotation}
              className={styles.deckDisc}
            />
          </motion.div>
          <Arm size={size} swing={swing} />
        </div>
      </div>
      <div className={styles.transport}>
        <button
          type='button'
          className={styles.play}
          disabled={!record}
          aria-label={record ? `${playing ? 'Pause' : 'Play'} ${record.name}` : 'Play'}
          onClick={() => record && toggleRecord(record.id)}
        >
          {playing ? <Pause aria-hidden='true' /> : <Play aria-hidden='true' />}
        </button>
        <div className={styles.now}>
          <p className={styles.title}>{record?.name ?? 'Pick a record'}</p>
          <p className={styles.sub}>
            {record ? (
              <>
                {playing && <Eq />}
                {playing ? 'Playing' : 'Paused'} · {position} of {recordIds.length}
              </>
            ) : (
              'From the shelf below'
            )}
          </p>
        </div>
        <label className={styles.vol}>
          <Volume1 aria-hidden='true' />
          <input
            type='range'
            className={styles.slider}
            style={{ ['--v' as string]: volume / 100 }}
            aria-label='Record volume'
            min={0}
            max={100}
            disabled={!record}
            value={volume}
            onChange={e => record && setVolume(record.id, Number(e.target.value) / 100)}
          />
          <span className={styles.volValue} aria-hidden='true'>
            {volume}
          </span>
        </label>
      </div>
    </>
  )
}
