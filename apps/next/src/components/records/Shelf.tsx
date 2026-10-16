'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useShallow } from 'zustand/react/shallow'
import { useUserSounds } from '~/hooks/useSounds'
import { useSession } from '~/lib/auth.client'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import styles from './records.module.css'
import SoundOptions from './SoundOptions'
import { Eq, labelBackground, soundLook } from './Vinyl'

export const RECORD_MIME = 'application/x-befocus-record'

export default function Shelf({
  onAdd,
  onRename,
}: {
  onAdd: (from: HTMLElement) => void
  onRename: (sound: Sound) => void
}) {
  const { data: session } = useSession()
  const { isPending, isError, refetch } = useUserSounds()
  const records = useSoundsStore(
    useShallow(state => Object.values(state.sounds).filter(s => s.soundType === 'bgMusic')),
  )
  const bgMusicId = useSoundsStore(state => state.bgMusicId)
  const toggleRecord = useSoundsStore(state => state.toggleRecord)

  const loading = Boolean(session) && isPending
  const userRecords = records.filter(r => r.isCustom)

  return (
    <section className={styles.shelf} aria-labelledby='shelf-heading'>
      <h3 className={styles.sec}>
        <span id='shelf-heading'>Shelf</span>
        <em>
          {records.length} {records.length === 1 ? 'record' : 'records'}
        </em>
      </h3>
      {/* biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics under list-style none */}
      <ul role='list' className={styles.sleeves} aria-busy={loading || undefined}>
        {records.map(r => {
          const loaded = r.id === bgMusicId
          const playing = loaded && r.playing
          return (
            <li key={r.id} data-sound-id={r.id} className={styles.sleeveItem}>
              <button
                type='button'
                className={styles.sleeve}
                data-loaded={loaded || undefined}
                aria-pressed={playing}
                aria-label={`${playing ? 'Pause' : 'Play'} ${r.name}`}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData(RECORD_MIME, r.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => toggleRecord(r.id)}
              >
                <span className={styles.sq}>
                  <i style={labelBackground(soundLook(r))} />
                  {playing && <Eq />}
                </span>
                <span className={styles.nm}>{r.name}</span>
                <span className={styles.mt}>
                  {playing ? 'Playing' : loaded ? 'Paused' : 'Record'}
                </span>
              </button>
              {session && <SoundOptions sound={r} onRename={onRename} />}
            </li>
          )
        })}
        {loading && (
          <>
            <li className={styles.skeleton} aria-hidden='true'>
              <span className={styles.sq} />
            </li>
            <li className={styles.skeleton} aria-hidden='true'>
              <span className={styles.sq} />
            </li>
          </>
        )}
        {session && (
          <li>
            <button
              type='button'
              className={`${styles.sleeve} ${styles.add}`}
              onClick={e => onAdd(e.currentTarget)}
            >
              <span className={styles.sq}>
                <Plus aria-hidden='true' />
              </span>
              <span className={styles.nm}>Add</span>
              <span className={styles.mt}>Paste link</span>
            </button>
          </li>
        )}
      </ul>
      {session && isError && (
        <p className={styles.note}>
          Couldn't load your saved sounds.{' '}
          <button type='button' className={styles.retry} onClick={() => refetch()}>
            Try again
          </button>
        </p>
      )}
      {session && !loading && !isError && userRecords.length === 0 && (
        <p className={styles.note}>No records of your own yet. Paste a YouTube link to add one.</p>
      )}
      {!session && (
        <p className={styles.note}>
          <Link href='/sign-in' className={styles.retry}>
            Sign in
          </Link>{' '}
          to add and keep your own records.
        </p>
      )}
    </section>
  )
}
