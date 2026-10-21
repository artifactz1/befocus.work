'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useTimerKeyboard } from '~/hooks/useTimerKeyboard'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useTimerStore, useTimerStoreApi } from '~/store/useTimerStore'
import useIsLandscape from '../helper/useIsMobileLandscape'
import TimerUI from './TimeUI'
import styles from './timer-progress.module.css'

const RULER_TICKS = Array.from({ length: 25 }, (_, i) => i)

type ProgressStyle = CSSProperties & Record<'--progress', string>
type DigitsStyle = CSSProperties & Record<'--digit-size', string>
type RootStyle = ProgressStyle & Record<'--stack-size', string>

function DesktopDigits({
  minutes,
  seconds,
  fontSize,
}: {
  minutes: number
  seconds: number
  fontSize: string
}) {
  return (
    <>
      <TimerUI value={minutes} fontSize={fontSize} />
      <p className='flex h-full items-center' style={{ fontSize, lineHeight: '1em' }}>
        :
      </p>
      <TimerUI value={seconds} fontSize={fontSize} />
    </>
  )
}

export default function Timer() {
  const alarmUrl = useSoundsStore(s => s.sounds[s.alarmId]?.url)
  const alarmVolume = useSoundsStore(s => s.sounds[s.alarmId]?.volume ?? 0.5)
  // Above the record sheet (under 1024px) the timer is one 64px line, as on the board.
  const roomOpen = useSoundsStore(s => s.roomOpen)
  const narrow = useMediaQuery('(max-width: 1023.98px)')
  const strip = roomOpen && narrow
  const phone = useMediaQuery('(max-width: 639.98px)')
  const store = useTimerStoreApi()
  const { timeLeft, isRunning, status, blocks, currentBlockId } = useTimerStore()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)

  const [minutes, setMinutes] = useState<number>(timeLeft / 60)
  const [seconds, setSeconds] = useState<number>(0)
  const isLandscape = useIsLandscape()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useTimerKeyboard()

  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('sounds/public_sounds_alarm1.mp3')
    const worker = new Worker(new URL('../../lib/timerWorker', import.meta.url))
    workerRef.current = worker
    worker.onmessage = e => {
      if (e.data === 'tick') store.getState().tick(Date.now())
    }
    // A background tab can throttle the worker: catch an end that passed while hidden at once.
    const catchUp = () => store.getState().tick(Date.now())
    document.addEventListener('visibilitychange', catchUp)
    window.addEventListener('focus', catchUp)

    return () => {
      document.removeEventListener('visibilitychange', catchUp)
      window.removeEventListener('focus', catchUp)
      worker.terminate()
    }
  }, [store])

  useEffect(() => {
    if (isRunning) {
      workerRef.current?.postMessage({ command: 'start', interval: 250 })
    } else {
      workerRef.current?.postMessage({ command: 'stop' })
    }
  }, [isRunning])

  useEffect(() => {
    if (alarmUrl && audioRef.current) {
      audioRef.current.src = alarmUrl
      audioRef.current.load()
    }
  }, [alarmUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = alarmVolume
  }, [alarmVolume])

  const playAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error)
      })
    }
  }, [])

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  const prevStatus = useRef(status)
  useEffect(() => {
    if (prevStatus.current !== status) {
      if (status === 'ended') playAlarm()
      else if (prevStatus.current === 'ended') stopAlarm()
      prevStatus.current = status
    }
  }, [status, playAlarm, stopAlarm])

  useEffect(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    setMinutes(mins)
    setSeconds(secs)
  }, [timeLeft])

  const [widthSize, setWidthSize] = useState('25vw')

  useEffect(() => {
    const handleResize = () => {
      setWidthSize(window.innerWidth < 640 ? '50vw' : '25vw')
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const block = blocks.find(b => b.id === currentBlockId)
  const total = block ? block.plannedSeconds + block.addedSeconds : 0
  const elapsed = total > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / total)) : 0
  const nowIndex = Math.floor(elapsed * 25)

  const ended = status === 'ended'
  const nextKind = blocks[blocks.findIndex(b => b.id === currentBlockId) + 1]?.kind
  const primaryText =
    nextKind === 'break' ? 'Start break' : nextKind === 'focus' ? 'Start focus' : 'Finish session'
  const nextHint = primaryText.toLowerCase()
  const doneLabel = `${block?.kind === 'break' ? 'Break' : 'Focus block'} done`
  const endedMinutes = block ? Math.round(total / 60) : 0

  const desktopFontSize = strip
    ? '64px'
    : `calc(${isLandscape ? '30vh' : widthSize} * var(--timer-scale, 1))`
  const mobileFontSize = `calc(${widthSize} * var(--timer-scale, 1))`

  const rootStyle: RootStyle = {
    '--progress': String(elapsed),
    '--stack-size': `calc(${mobileFontSize} * 1.8)`,
  }
  const digitsStyle: DigitsStyle = { '--digit-size': desktopFontSize }

  // A mouse user who clicked Play still has focus in the footer: hand it to the ended primary.
  useEffect(() => {
    if (!ended) return
    const active = document.activeElement
    const root = rootRef.current
    if (
      active instanceof HTMLElement &&
      root &&
      active.closest('.bf-chrome') &&
      root.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      primaryRef.current?.focus()
    }
  }, [ended])

  const primary = (
    <button
      ref={primaryRef}
      type='button'
      data-ended-primary
      aria-keyshortcuts='Enter'
      className={styles.primary}
      onClick={() => store.getState().startNext()}
    >
      {primaryText}
    </button>
  )

  return (
    <div
      ref={rootRef}
      className='relative z-0 flex min-h-0 flex-1 items-center justify-center font-display text-dash'
      style={rootStyle}
    >
      <span role='timer' aria-label='Time remaining' className='sr-only'>
        {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </span>

      {ended && phone && !strip && (
        <p data-ended-label className={styles.phoneLabel}>
          {doneLabel}
        </p>
      )}

      <div className={`absolute inset-0 flex items-center justify-center ${styles.stage}`}>
        <div
          className={`relative hidden h-[70vh] items-center justify-center font-bold sm:flex ${styles.digits}`}
          style={digitsStyle}
        >
          <div aria-hidden className='contents'>
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          </div>
          <div
            aria-hidden
            className={`absolute inset-0 items-center justify-center ${styles.inkOverlay}`}
          >
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          </div>

          <div className={styles.under}>
            {ended && !phone ? (
              <div data-ended-group className={styles.ended}>
                <p data-ended-label className={styles.endedLabel}>
                  {`${doneLabel} \u00B7 ${endedMinutes} min`}
                </p>
                {primary}
                <div aria-hidden className={`${styles.hints} ${styles.endedHints} bf-chrome`}>
                  <span>
                    <kbd>+</kbd>add 1 min
                  </span>
                  <span>
                    <kbd>Enter</kbd>
                    {nextHint}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div aria-hidden className={styles.ruler}>
                  {RULER_TICKS.map(i => (
                    <i
                      key={`tick-${i}`}
                      className={
                        i < nowIndex
                          ? styles.done
                          : i === nowIndex && timeLeft > 0
                            ? styles.now
                            : undefined
                      }
                    />
                  ))}
                </div>
                <div aria-hidden className={`${styles.hints} bf-chrome`}>
                  <span>
                    <kbd>Space</kbd>pause/start
                  </span>
                  <span>
                    <kbd>R</kbd>reset
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className={`absolute flex-row items-center font-bold sm:hidden ${strip ? 'flex' : ''} ${styles.digits}`}
        >
          {strip ? (
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          ) : (
            <>
              <TimerUI value={minutes} fontSize={mobileFontSize} />
              <TimerUI value={seconds} fontSize={mobileFontSize} />
            </>
          )}
        </div>
      </div>

      {ended && phone && !strip && (
        <div data-ended-row className={styles.phoneRow}>
          {primary}
        </div>
      )}

      <div aria-hidden data-edge-progress className={styles.edgeTrack} />
      <div aria-hidden data-edge-progress className={styles.edgeFill} />
    </div>
  )
}
