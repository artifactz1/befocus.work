'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Play, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useSaveUserSettings } from '~/hooks/useSession'
import {
  clampToLimit,
  endsAt,
  formatTotal,
  readAskBeforeStart,
  totalMinutes,
  writeAskBeforeStart,
} from '~/lib/session/session'
import { useTimerStore, useTimerStoreApi } from '~/store/useTimerStore'
import { AlarmPicker } from './AlarmPicker'
import Stepper from './Stepper'
import styles from './session-card.module.css'

// Enter is a shortcut only where it would not already activate or open something.
const ENTER_IGNORED = "button, a[href], [role='combobox']"

function Body({ guest }: { guest: boolean }) {
  const store = useTimerStoreApi()
  const save = useSaveUserSettings({ quiet: true })

  // Fresh draft per open: this component mounts with the dialog content.
  const [initial] = useState(() => {
    const s = store.getState()
    return {
      focus: clampToLimit(s.workDuration / 60, 'focus'),
      brk: clampToLimit(s.breakDuration / 60, 'break'),
      rounds: clampToLimit(s.sessions, 'rounds'),
      ask: s.askBeforeStart,
      workDuration: s.workDuration,
      breakDuration: s.breakDuration,
      sessions: s.sessions,
    }
  })
  const [focus, setFocus] = useState(initial.focus)
  const [brk, setBrk] = useState(initial.brk)
  const [rounds, setRounds] = useState(initial.rounds)
  const [ask, setAsk] = useState(initial.ask)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const startRef = useRef<HTMLButtonElement>(null)
  const armed = useRef(false)

  const total = totalMinutes(focus, brk, rounds)
  const time = new Date(endsAt(now, total)).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  const submit = () => {
    const workDuration = focus * 60
    const breakDuration = brk * 60
    store
      .getState()
      .applySettings(
        { workDuration, breakDuration, sessions: rounds, askBeforeStart: ask },
        { run: true },
      )
    if (guest) return writeAskBeforeStart(ask)
    const changed =
      workDuration !== initial.workDuration ||
      breakDuration !== initial.breakDuration ||
      rounds !== initial.sessions ||
      ask !== initial.ask
    if (changed) {
      save.mutate({
        workDuration,
        breakDuration,
        numberOfSessions: rounds,
        askBeforeStart: ask,
      })
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    if (e.repeat) return e.preventDefault()
    if (e.defaultPrevented) return
    // Select content is portalled, so its events still bubble through the React tree.
    if (!e.currentTarget.contains(e.target as Node)) return
    if ((e.target as Element).closest(ENTER_IGNORED)) return
    e.preventDefault()
    submit()
  }

  return (
    <DialogPrimitive.Content
      className={styles.card}
      onKeyDown={onKeyDown}
      onOpenAutoFocus={e => {
        e.preventDefault()
        startRef.current?.focus()
      }}
    >
      <div className={styles.head}>
        <div className={styles.headText}>
          <DialogPrimitive.Title className={styles.title}>Start a session</DialogPrimitive.Title>
          <DialogPrimitive.Description className={styles.sub}>
            Ends around <b>{time}</b>
            <span className={styles.hint}> · Enter to start</span>
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close className={styles.x} aria-label='Close'>
          <X size={16} aria-hidden />
        </DialogPrimitive.Close>
      </div>

      <div className={styles.body}>
        <section>
          <h3 className={styles.sec}>
            Session
            <em>{formatTotal(total)}</em>
          </h3>
          <Stepper kind='focus' label='Focus' value={focus} onChange={setFocus} />
          <Stepper kind='break' label='Break' value={brk} onChange={setBrk} />
          <Stepper kind='rounds' label='Rounds' value={rounds} onChange={setRounds} />
        </section>
        <section>
          <AlarmPicker labelClassName={styles.sec} />
        </section>
      </div>

      <div className={styles.foot}>
        <button
          type='button'
          role='switch'
          aria-checked={ask}
          className={styles.switch}
          onClick={() => setAsk(v => !v)}
        >
          <span className={styles.track} aria-hidden />
          Ask before each session
        </button>
        <div className={styles.actions}>
          <DialogPrimitive.Close type='button' className={styles.ghost}>
            Cancel
          </DialogPrimitive.Close>
          <button
            ref={startRef}
            type='button'
            className={styles.primary}
            aria-keyshortcuts='Enter'
            onClick={submit}
            // A Space press that began elsewhere (the Play button) must not click Start on keyup.
            onKeyDown={e => {
              if (e.key === ' ') armed.current = true
            }}
            onKeyUp={e => {
              if (e.key !== ' ') return
              if (!armed.current) e.preventDefault()
              armed.current = false
            }}
          >
            <Play size={14} fill='currentColor' aria-hidden />
            Start
          </button>
        </div>
      </div>
    </DialogPrimitive.Content>
  )
}

export default function SessionCard({ guest = false }: { guest?: boolean }) {
  const store = useTimerStoreApi()
  const open = useTimerStore(s => s.card !== null)
  const closeCard = useTimerStore(s => s.closeCard)

  // Guest switch lives in localStorage; read after mount so SSR and hydration match.
  useEffect(() => {
    if (guest) store.getState().setAskBeforeStart(readAskBeforeStart())
  }, [guest, store])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={o => !o && closeCard()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <Body guest={guest} />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
