'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog'
import { Play, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useSaveUserSettings } from '~/hooks/useSession'
import {
  clampToLimit,
  endsAt,
  formatTotal,
  isFresh,
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

function Body({ guest, mode }: { guest: boolean; mode: 'start' | 'edit' }) {
  const store = useTimerStoreApi()
  const edit = mode === 'edit'
  // Body remounts per open, so the mode is fixed for the hook's lifetime.
  const save = useSaveUserSettings({ quiet: !edit })
  const [confirming, setConfirming] = useState(false)
  const focusRef = useRef<HTMLSpanElement>(null)

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

  const persist = (workDuration: number, breakDuration: number) => {
    if (guest) return writeAskBeforeStart(ask)
    save.mutate({
      workDuration,
      breakDuration,
      numberOfSessions: rounds,
      askBeforeStart: ask,
    })
  }

  const apply = (run: boolean) => {
    const workDuration = focus * 60
    const breakDuration = brk * 60
    store
      .getState()
      .applySettings(
        { workDuration, breakDuration, sessions: rounds, askBeforeStart: ask },
        { run },
      )
    return { workDuration, breakDuration }
  }

  const submit = () => {
    if (!edit) {
      const { workDuration, breakDuration } = apply(true)
      const changed =
        workDuration !== initial.workDuration ||
        breakDuration !== initial.breakDuration ||
        rounds !== initial.sessions ||
        ask !== initial.ask
      if (guest) return writeAskBeforeStart(ask)
      if (changed) persist(workDuration, breakDuration)
      return
    }
    const planChanged =
      focus * 60 !== initial.workDuration ||
      brk * 60 !== initial.breakDuration ||
      rounds !== initial.sessions
    if (!planChanged && ask === initial.ask) return store.getState().closeCard()
    if (!planChanged) {
      // Switch only: persist it, no reset.
      store.getState().setAskBeforeStart(ask)
      persist(initial.workDuration, initial.breakDuration)
      return store.getState().closeCard()
    }
    if (!isFresh(store.getState())) return setConfirming(true)
    const { workDuration, breakDuration } = apply(false)
    persist(workDuration, breakDuration)
  }

  const saveAndRestart = () => {
    const { workDuration, breakDuration } = apply(true)
    persist(workDuration, breakDuration)
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
        if (edit) focusRef.current?.focus()
        else startRef.current?.focus()
      }}
    >
      <div className={styles.head}>
        <div className={styles.headText}>
          <DialogPrimitive.Title className={styles.title}>
            {edit ? 'Session settings' : 'Start a session'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className={styles.sub}>
            {edit ? (
              'Saving restarts the timer'
            ) : (
              <>
                Ends around <b>{time}</b>
                <span className={styles.hint}> · Enter to start</span>
              </>
            )}
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
          <Stepper
            kind='focus'
            label='Focus'
            value={focus}
            onChange={setFocus}
            spinRef={focusRef}
          />
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
            {!edit && <Play size={14} fill='currentColor' aria-hidden />}
            {edit ? 'Save' : 'Start'}
          </button>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart the session?</AlertDialogTitle>
            <AlertDialogDescription>
              Saving applies your new plan and starts again from round 1. Time on the current round
              is not kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={saveAndRestart}>Save and restart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogPrimitive.Content>
  )
}

export default function SessionCard({ guest = false }: { guest?: boolean }) {
  const store = useTimerStoreApi()
  const open = useTimerStore(s => s.card !== null)
  const closeCard = useTimerStore(s => s.closeCard)
  const card = useTimerStore(s => s.card)
  // Keep the last mode while the close animation plays (card is null by then).
  const lastMode = useRef<'start' | 'edit'>('start')
  if (card) lastMode.current = card

  // Guest switch lives in localStorage; read after mount so SSR and hydration match.
  useEffect(() => {
    if (guest) store.getState().setAskBeforeStart(readAskBeforeStart())
  }, [guest, store])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={o => !o && closeCard()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <Body guest={guest} mode={lastMode.current} />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
