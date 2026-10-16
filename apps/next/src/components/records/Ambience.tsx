'use client'

import { Plus } from 'lucide-react'
import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUserSounds } from '~/hooks/useSounds'
import { useSession } from '~/lib/auth.client'
import { knobKeyValue } from '~/lib/sounds/sounds'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import styles from './records.module.css'
import SoundOptions from './SoundOptions'

// One ambience layer: a labelled slider that reads Off at 0. Moving off 0 starts it, 0 stops it.
function AmbienceRow({ sound, options }: { sound: Sound; options: React.ReactNode }) {
  const setVolume = useSoundsStore(state => state.setVolume)
  const toggleSound = useSoundsStore(state => state.toggleSound)
  const last = useRef(sound.volume || 0.4)

  const value = sound.playing ? sound.volume : 0
  const pct = Math.round(value * 100)

  const apply = (v: number) => {
    const next = Math.min(1, Math.max(0, v))
    if (next > 0) last.current = next
    setVolume(sound.id, next)
    const playing = useSoundsStore.getState().sounds[sound.id]?.playing
    if ((next > 0.01 && !playing) || (next === 0 && playing)) toggleSound(sound.id)
  }

  return (
    <div className={styles.row} data-sound-id={sound.id} data-on={pct > 0 || undefined}>
      <span className={styles.rowName} title={sound.name}>
        {sound.name}
      </span>
      <input
        type='range'
        className={styles.slider}
        style={{ ['--v' as string]: value }}
        aria-label={sound.name}
        aria-valuetext={pct === 0 ? 'Off' : `${pct}%`}
        min={0}
        max={100}
        value={pct}
        onChange={e => apply(Number(e.target.value) / 100)}
        onKeyDown={e => {
          // 5% steps, Enter and Space toggle back to the last level.
          const next = knobKeyValue(value, e.key, last.current)
          if (next === null) return
          e.preventDefault()
          apply(next)
        }}
      />
      <span className={styles.rowValue} aria-hidden='true'>
        {pct === 0 ? 'Off' : pct}
      </span>
      {options}
    </div>
  )
}

export default function Ambience({
  onAdd,
  onRename,
}: {
  onAdd: (from: HTMLElement) => void
  onRename: (sound: Sound) => void
}) {
  const { data: session } = useSession()
  const { isPending } = useUserSounds()
  const ambient = useSoundsStore(
    useShallow(state => Object.values(state.sounds).filter(s => s.soundType === 'ambient')),
  )
  const loading = Boolean(session) && isPending
  const on = ambient.filter(s => s.playing && s.volume > 0).length

  return (
    <section className={styles.ambience} aria-labelledby='ambience-heading'>
      <h3 className={styles.sec}>
        <span id='ambience-heading'>Ambience</span>
        {ambient.length > 0 && <em>{on} on</em>}
      </h3>
      {ambient.length === 0 && !loading && !session ? (
        <p className={styles.note}>No ambience yet. Paste a YouTube link to add one.</p>
      ) : (
        <div className={styles.rows} aria-busy={loading || undefined}>
          {ambient.map(s => (
            <AmbienceRow
              key={s.id}
              sound={s}
              options={session && <SoundOptions sound={s} onRename={onRename} />}
            />
          ))}
          {loading && <div className={styles.skeletonRow} aria-hidden='true' />}
          {session && (
            <button type='button' className={styles.addRow} onClick={e => onAdd(e.currentTarget)}>
              <Plus aria-hidden='true' />
              Add ambience
            </button>
          )}
        </div>
      )}
    </section>
  )
}
