'use client'

import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUserSounds } from '~/hooks/useSounds'
import { useSession } from '~/lib/auth.client'
import { knobKeyValue } from '~/lib/sounds/sounds'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import panel from '../customize/customize-panel.module.css'
import styles from './records.module.css'

const SWEEP = 135 // degrees either side of straight up
const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return `${32 + r * Math.sin(a)} ${32 - r * Math.cos(a)}`
}
const arc = (from: number, to: number) =>
  `M ${point(from, 28)} A 28 28 0 ${to - from > 180 ? 1 : 0} 1 ${point(to, 28)}`

function Knob({ sound }: { sound: Sound }) {
  const setVolume = useSoundsStore(state => state.setVolume)
  const toggleSound = useSoundsStore(state => state.toggleSound)
  const last = useRef(sound.volume || 0.4)
  const drag = useRef<{ y: number; v: number; moved: number } | null>(null)

  const value = sound.playing ? sound.volume : 0
  const pct = Math.round(value * 100)

  const apply = (v: number) => {
    const next = Math.min(1, Math.max(0, v))
    if (next > 0) last.current = next
    setVolume(sound.id, next)
    const playing = useSoundsStore.getState().sounds[sound.id]?.playing
    if ((next > 0.01 && !playing) || (next === 0 && playing)) toggleSound(sound.id)
  }

  const angle = -SWEEP + value * 2 * SWEEP

  return (
    <div
      className={styles.knob}
      role='slider'
      tabIndex={0}
      aria-label={sound.name}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={pct === 0 ? 'Off' : `${pct}%`}
      onKeyDown={e => {
        const next = knobKeyValue(value, e.key, last.current)
        if (next === null) return
        e.preventDefault()
        apply(next)
      }}
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { y: e.clientY, v: value, moved: 0 }
      }}
      onPointerMove={e => {
        const d = drag.current
        if (!d) return
        d.moved = Math.max(d.moved, Math.abs(e.clientY - d.y))
        if (d.moved >= 3) apply(Math.round((d.v + (d.y - e.clientY) / 200) * 100) / 100)
      }}
      onPointerUp={() => {
        const d = drag.current
        drag.current = null
        if (d && d.moved < 3) apply(knobKeyValue(value, 'Enter', last.current) ?? 0)
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
    >
      <svg viewBox='0 0 64 64' width='64' height='64' aria-hidden='true'>
        <defs>
          <linearGradient id='knobCap' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' stopColor='#3a3735' />
            <stop offset='1' stopColor='#242120' />
          </linearGradient>
        </defs>
        <path
          d={arc(-SWEEP, SWEEP)}
          fill='none'
          stroke='#fff'
          strokeOpacity='0.12'
          strokeWidth='3'
          strokeLinecap='round'
        />
        {value > 0 && (
          <path
            d={arc(-SWEEP, angle)}
            fill='none'
            stroke='var(--user-accent)'
            strokeWidth='3'
            strokeLinecap='round'
          />
        )}
        <circle cx='32' cy='32' r='22' fill='url(#knobCap)' stroke='#fff' strokeOpacity='0.1' />
        <g transform={`rotate(${angle} 32 32)`}>
          <rect x='31' y='12' width='2' height='8' rx='1' fill='hsl(var(--foreground))' />
        </g>
      </svg>
      <span className={styles.knobName}>{sound.name}</span>
      <span className={styles.knobValue}>{pct === 0 ? 'Off' : `${pct}%`}</span>
    </div>
  )
}

export default function KnobRow() {
  const { data: session } = useSession()
  const { isPending } = useUserSounds()
  const ambient = useSoundsStore(
    useShallow(state => Object.values(state.sounds).filter(s => s.soundType === 'ambient')),
  )
  const loading = Boolean(session) && isPending

  return (
    <section aria-label='Ambience'>
      <h3 className={panel.label}>Ambience</h3>
      {ambient.length === 0 && !loading ? (
        <p className={styles.note}>No ambience yet. Paste a YouTube link to add one.</p>
      ) : (
        <div className={styles.knobs} aria-busy={loading || undefined}>
          {ambient.map(s => (
            <Knob key={s.id} sound={s} />
          ))}
          {loading && <div className={styles.skeletonKnob} aria-hidden='true' />}
        </div>
      )}
    </section>
  )
}
