'use client'

import { ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUserSounds } from '~/hooks/useSounds'
import { useSession } from '~/lib/auth.client'
import { discBase } from '~/lib/sounds/sounds'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import styles from './records.module.css'
import SoundOptions from './SoundOptions'
import Vinyl, { Eq, labelBackground, soundLook } from './Vinyl'

export const RECORD_MIME = 'application/x-befocus-record'

// Sleeve edges standing behind the front record.
const BEHIND = 4

const sleeveColour = (r: Sound) =>
  ({ '--sl': `color-mix(in srgb, ${soundLook(r).label} 26%, #191919)` }) as CSSProperties

// A record crate: one sleeve at the front with its disc out, the next few standing behind it.
export default function Shelf({
  show,
  onAdd,
  onRename,
}: {
  show: string | null
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

  // The crate opens on the loaded record and goes back to it whenever another one is loaded.
  const [pick, setPick] = useState<string | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on every load, not read
  useEffect(() => setPick(null), [bgMusicId])
  useEffect(() => {
    if (show) setPick(show)
  }, [show])

  const loading = Boolean(session) && isPending
  const userRecords = records.filter(r => r.isCustom)
  const n = records.length
  const found = records.findIndex(r => r.id === (pick ?? bgMusicId))
  const at = Math.max(found, 0)
  const front = records[at]
  const behind = records
    .slice(at + 1)
    .concat(records.slice(0, at))
    .slice(0, BEHIND)
  const flip = (step: number) => {
    const next = records[(at + step + n) % n]
    if (next) setPick(next.id)
  }

  const swipe = useRef<{ x: number; done: boolean } | null>(null)
  const frontButton = useRef<HTMLButtonElement>(null)

  // Edges that stay in the crate glide to their new slot when it flips instead of jumping.
  const backs = useRef<HTMLDivElement>(null)
  const tops = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    const moving = !matchMedia('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, number>()
    for (const el of backs.current?.querySelectorAll<HTMLElement>('[data-edge]') ?? []) {
      const id = el.dataset.edge ?? ''
      const was = tops.current.get(id)
      if (moving && was !== undefined && was !== el.offsetTop) {
        el.animate(
          { translate: [`0 ${was - el.offsetTop}px`, '0 0'] },
          { duration: 450, easing: 'cubic-bezier(0.34, 1.8, 0.64, 1)' },
        )
      }
      next.set(id, el.offsetTop)
    }
    tops.current = next
  })

  // On a flip the old front record stays underneath while the new one pops in over it.
  const [gone, setGone] = useState<Sound | null>(null)
  const shown = useRef(front)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the front record changes
  useLayoutEffect(() => {
    const was = shown.current
    shown.current = front
    if (!was || !front || was.id === front.id) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setGone(was)
    const t = setTimeout(() => setGone(null), 300)
    return () => clearTimeout(t)
  }, [front?.id])

  const loaded = front?.id === bgMusicId
  const playing = loaded && Boolean(front?.playing)

  return (
    <section className={styles.shelf} aria-labelledby='shelf-heading'>
      <h3 className={styles.sec}>
        <span id='shelf-heading'>Shelf</span>
        <em>
          {n} {n === 1 ? 'record' : 'records'}
        </em>
      </h3>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: arrow keys flip the crate from any of its buttons */}
      <div
        className={styles.crate}
        aria-busy={loading || undefined}
        onKeyDown={e => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
          if (!(e.target instanceof HTMLButtonElement) || n < 2) return
          // the options trigger is remounted with each front record, so it keeps its keys
          if (e.target.hasAttribute('aria-haspopup')) return
          e.preventDefault()
          flip(e.key === 'ArrowLeft' ? -1 : 1)
        }}
      >
        {behind.length > 0 && (
          <div ref={backs} className={styles.backs}>
            {behind.map((r, d) => (
              <button
                key={r.id}
                type='button'
                className={styles.edge}
                data-edge={r.id}
                style={{ ...sleeveColour(r), '--d': d + 1 } as CSSProperties}
                aria-label={`Show ${r.name}`}
                onClick={() => {
                  // this edge leaves the crate as its record comes to the front, so focus follows it
                  setPick(r.id)
                  frontButton.current?.focus()
                }}
              >
                <i style={labelBackground(soundLook(r))} />
                <span>{r.name}</span>
              </button>
            ))}
          </div>
        )}
        {front && (
          <div className={styles.front} data-sound-id={front.id} style={sleeveColour(front)}>
            {gone && gone.id !== front.id && (
              <span className={styles.frontGone} style={sleeveColour(gone)}>
                <FrontFace record={gone} state='Play' />
              </span>
            )}
            <button
              ref={frontButton}
              type='button'
              className={styles.frontButton}
              data-loaded={loaded || undefined}
              aria-pressed={playing}
              aria-label={`${playing ? 'Pause' : 'Play'} ${front.name}`}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData(RECORD_MIME, front.id)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onPointerDown={e => {
                if (e.pointerType === 'touch') swipe.current = { x: e.clientX, done: false }
              }}
              onPointerMove={e => {
                const s = swipe.current
                if (!s || s.done || Math.abs(e.clientX - s.x) < 40) return
                s.done = true
                flip(e.clientX < s.x ? 1 : -1)
              }}
              onClick={() => {
                // a swipe flips the crate, it does not also play the record
                if (swipe.current?.done) return
                toggleRecord(front.id)
              }}
              onPointerUp={() => {
                requestAnimationFrame(() => {
                  swipe.current = null
                })
              }}
            >
              <span key={front.id} className={styles.frontOpen}>
                <FrontFace
                  record={front}
                  spin={playing}
                  state={playing ? 'Playing' : loaded ? 'Paused' : 'Play'}
                />
              </span>
            </button>
            {session && <SoundOptions key={front.id} sound={front} onRename={onRename} />}
          </div>
        )}
        <div className={styles.crateBox} aria-hidden='true' />
        <div className={styles.crateNav}>
          <span aria-live='polite'>{n > 0 ? `${at + 1} of ${n}` : 'Empty crate'}</span>
          <span className={styles.crateButtons}>
            {n > 1 && (
              <>
                <button
                  type='button'
                  className={styles.flip}
                  aria-label='Previous record'
                  onClick={() => flip(-1)}
                >
                  <ChevronLeft aria-hidden='true' />
                </button>
                <button
                  type='button'
                  className={styles.flip}
                  aria-label='Next record'
                  onClick={() => flip(1)}
                >
                  <ChevronRight aria-hidden='true' />
                </button>
              </>
            )}
            {session && (
              <button
                type='button'
                className={styles.addRecord}
                onClick={e => onAdd(e.currentTarget)}
              >
                <Plus aria-hidden='true' />
                Add
              </button>
            )}
          </span>
        </div>
      </div>
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

// The front record's sleeve and its disc. The crate shows every disc black; the label keeps its
// colour or picture.
function FrontFace({
  record,
  spin = false,
  state,
}: {
  record: Sound
  spin?: boolean
  state: 'Playing' | 'Paused' | 'Play'
}) {
  const look = soundLook(record)
  return (
    <>
      <span className={styles.frontTray}>
        <span className={styles.frontDisc}>
          <Vinyl size={176} look={{ ...look, base: discBase('black', look.label) }} spin={spin} />
        </span>
      </span>
      <span className={styles.frontCover}>
        <span
          className={styles.frontSleeve}
          style={look.pic ? labelBackground({ ...look, label: '#1c1c1c' }) : undefined}
        />
        <span className={styles.frontState}>
          {state === 'Playing' ? (
            <Eq />
          ) : (
            <Play size={10} fill='currentColor' strokeWidth={0} aria-hidden='true' />
          )}
          {state}
        </span>
        <span className={styles.frontMeta}>
          <b>{record.name}</b>
          <span>{record.isCustom ? 'Your record' : 'Starter record'}</span>
        </span>
      </span>
    </>
  )
}
