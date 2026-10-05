'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useShallow } from 'zustand/react/shallow'
import { useUserSounds } from '~/hooks/useSounds'
import { useSession } from '~/lib/auth.client'
import { labelInk } from '~/lib/sounds/sounds'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import styles from './records.module.css'
import SoundOptions from './SoundOptions'

export const RECORD_MIME = 'application/x-befocus-record'

export default function Shelf({
  onAdd,
  onRename,
}: {
  onAdd: () => void
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
    <section className={styles.shelf} aria-label='Record shelf'>
      {/* biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics under list-style none */}
      <ul role='list' className={styles.sleeves} aria-busy={loading || undefined}>
        {records.map(r => {
          const { ink, inkDeep, sleeve, sleeveDeep } = labelInk(r.name)
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
                style={{
                  background: `linear-gradient(160deg, ${sleeve}, ${sleeveDeep})`,
                }}
              >
                <span
                  className={styles.sleeveLabel}
                  style={{ background: `radial-gradient(${ink} 60%, ${inkDeep})` }}
                  aria-hidden='true'
                />
                <span className={styles.sleeveName}>{r.name}</span>
                {playing && <span className={styles.sleeveDot} aria-hidden='true' />}
              </button>
              {session && <SoundOptions sound={r} onRename={onRename} />}
            </li>
          )
        })}
        {loading && (
          <>
            <li className={styles.skeleton} aria-hidden='true' />
            <li className={styles.skeleton} aria-hidden='true' />
          </>
        )}
        {session && (
          <li>
            <button type='button' className={styles.addTile} onClick={onAdd}>
              <Plus size={20} aria-hidden='true' />
              Add record
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
        <p className={styles.note}>
          No records yet. <span>Paste a YouTube link to add one.</span>
        </p>
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
