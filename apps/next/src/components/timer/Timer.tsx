'use client'

import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useEndedCues } from '~/hooks/useEndedCues'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useTimerKeyboard } from '~/hooks/useTimerKeyboard'
import { badgeText, minutesLabel } from '~/lib/blocks/blocks'
import { useDeckStore } from '~/store/useDeckStore'
import { useTimerStore, useTimerStoreApi } from '~/store/useTimerStore'
import useIsLandscape from '../helper/useIsMobileLandscape'
import { readAdjustHintSeen } from './AdjustTray'
import TimerUI from './TimeUI'
import styles from './timer-progress.module.css'

const RULER_TICKS = Array.from({ length: 25 }, (_, i) => i)

type ProgressStyle = CSSProperties & Record<'--progress', string> & { '--notch'?: string }
type DigitsStyle = CSSProperties & Record<'--digit-size', string>

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
  // Above the record sheet (under 1024px) the timer is one 64px line, as on the board.
  const deck = useDeckStore(s => s.deck)
  const narrow = useMediaQuery('(max-width: 1023.98px)')
  const strip = deck !== null && narrow
  const phone = useMediaQuery('(max-width: 639.98px)')
  const store = useTimerStoreApi()
  const { timeLeft, isRunning, status, blocks, currentBlockId } = useTimerStore()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)

  const [minutes, setMinutes] = useState<number>(timeLeft / 60)
  const [seconds, setSeconds] = useState<number>(0)
  const isLandscape = useIsLandscape()
  useTimerKeyboard()
  useEndedCues()

  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
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
  // Desktop first-run hint: read after mount (no SSR drift), cleared for good by the first tray open.
  const [hintSeen, setHintSeen] = useState(false)
  useEffect(() => {
    setHintSeen(readAdjustHintSeen())
    const seen = () => setHintSeen(true)
    window.addEventListener('befocus:adjust-hint-seen', seen)
    return () => window.removeEventListener('befocus:adjust-hint-seen', seen)
  }, [])
  const nextKind = blocks[blocks.findIndex(b => b.id === currentBlockId) + 1]?.kind
  const primaryText =
    nextKind === 'break' ? 'Start break' : nextKind === 'focus' ? 'Start focus' : 'Finish session'
  const nextHint = primaryText.toLowerCase()
  const doneLabel = `${block?.kind === 'break' ? 'Break' : 'Focus block'} done`
  const endedMinutes = block ? Math.round(total / 60) : 0

  const desktopFontSize = strip
    ? '64px'
    : `calc(${isLandscape ? '30vh' : widthSize} * var(--timer-scale, 1))`
  const phoneEnded = ended && phone && !strip
  // Ended on phone: the stacked digits shrink to fit between the label (top 40px) and the
  // Start row (bottom 84px) of the Timer root, a size container so cqh is its height.
  // Every other state keeps 12px clear above and below, the touch footer row sticks 14px above the root (matters at 375x667, where 50vw is too tall).
  const mobileFontSize = `min(calc(${widthSize} * var(--timer-scale, 1)), calc((100cqh - ${phoneEnded ? 124 : 52}px) / 1.8))`

  // Net time added: the bar rescales to planned + added, with a notch at the planned end.
  const added = block?.addedSeconds ?? 0
  const notch = block && added > 0 ? block.plannedSeconds / total : null
  const badge = block && status !== 'idle' && !strip ? badgeText(block.addedSeconds) : null

  const rootStyle: ProgressStyle = {
    containerType: 'size',
    '--progress': String(elapsed),
    ...(notch !== null && { '--notch': String(notch) }),
  }
  const digitsStyle: DigitsStyle = { '--digit-size': desktopFontSize }

  const [liveText, setLiveText] = useState('')
  const prevFocus = useRef({ status, blockId: currentBlockId })
  const primaryHadFocus = useRef(false)

  // Announce the end once, and hand focus on when the ended primary goes away (UI-SPEC focus rules).
  useLayoutEffect(() => {
    const prev = prevFocus.current
    prevFocus.current = { status, blockId: currentBlockId }
    if (status === 'ended' && prev.status !== 'ended') {
      setLiveText(`Time's up. ${doneLabel}, ${minutesLabel(endedMinutes)}.`)
    } else if (prev.status === 'ended' && status !== 'ended') {
      setLiveText('')
      if (primaryHadFocus.current && status === 'running') {
        const slot = prev.blockId !== currentBlockId ? '2' : '4'
        document.querySelector<HTMLElement>(`[data-transport] [data-slot="${slot}"]`)?.focus()
      }
      primaryHadFocus.current = false
    }
  }, [status, currentBlockId, doneLabel, endedMinutes])

  // One listener hears every adjustment (keyboard, footer, tray): same block, running now, was
  // running or ended before, added time changed. Resets and block changes fall out of the guard.
  const prevAdjust = useRef({ status, blockId: currentBlockId, added })
  const liveFlip = useRef(false)
  const [adjusting, setAdjusting] = useState(false)
  const adjustTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useLayoutEffect(() => {
    const prev = prevAdjust.current
    prevAdjust.current = { status, blockId: currentBlockId, added }
    if (
      prev.blockId !== currentBlockId ||
      status !== 'running' ||
      (prev.status !== 'running' && prev.status !== 'ended') ||
      prev.added === added
    )
      return
    const delta = Math.round((added - prev.added) / 60)
    if (delta === 0) return
    // A trailing nbsp on alternate calls makes a repeated message count as new text.
    liveFlip.current = !liveFlip.current
    const tail = liveFlip.current ? '' : '\u00A0'
    setLiveText(
      delta > 0
        ? `Added ${minutesLabel(delta)}${prev.status === 'ended' ? '. Block resumed.' : ''}${tail}`
        : `Removed ${minutesLabel(-delta)}${tail}`,
    )
    setAdjusting(true)
    clearTimeout(adjustTimer.current)
    adjustTimer.current = setTimeout(() => setAdjusting(false), 400)
  }, [status, currentBlockId, added])
  useEffect(() => () => clearTimeout(adjustTimer.current), [])

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
      onFocus={() => {
        primaryHadFocus.current = true
      }}
      onBlur={() => {
        primaryHadFocus.current = false
      }}
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
      data-adjusting={adjusting || undefined}
      data-extended={notch !== null || undefined}
    >
      <span role='timer' aria-label='Time remaining' className='sr-only'>
        {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </span>
      <span aria-live='polite' className='sr-only' data-timer-live>
        {liveText}
      </span>

      {phoneEnded && (
        <p data-ended-label className={styles.phoneLabel}>
          {doneLabel}
        </p>
      )}

      <div
        className={`absolute inset-0 flex items-center justify-center ${styles.stage}`}
        style={phoneEnded ? { top: 40, bottom: 84 } : undefined}
      >
        <div
          className={`relative hidden h-[70vh] items-center justify-center font-bold sm:flex ${styles.digits}`}
          style={digitsStyle}
        >
          <div
            aria-hidden
            className={`flex h-full items-center justify-center ${ended ? styles.breathe : ''}`}
          >
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          </div>
          <div
            aria-hidden
            className={`absolute inset-0 items-center justify-center ${styles.inkOverlay} ${ended ? styles.breathe : ''}`}
          >
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          </div>

          {notch !== null && <div aria-hidden data-ink-notch className={styles.inkNotch} />}
          {badge && (
            <span aria-hidden data-adjust-badge className={styles.badge}>
              {badge}
            </span>
          )}

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
                  {RULER_TICKS.map(i => {
                    const state =
                      i < nowIndex ? styles.done : i === nowIndex && timeLeft > 0 ? styles.now : ''
                    const ext = notch !== null && i / 25 >= notch ? styles.ext : ''
                    return <i key={`tick-${i}`} className={`${state} ${ext}`.trim() || undefined} />
                  })}
                  {notch !== null && <b className={styles.rulerNotch} />}
                </div>
                <div aria-hidden className={`${styles.hints} bf-chrome`}>
                  <span>
                    <kbd>Space</kbd>pause/start
                  </span>
                  <span>
                    <kbd>R</kbd>reset
                  </span>
                  {status === 'running' && !hintSeen && (
                    <span>
                      <kbd>+</kbd>
                      <kbd>-</kbd>1 min, hold for more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className={`absolute flex-row items-center font-bold sm:hidden ${strip ? 'flex' : ''} ${styles.digits} ${ended ? styles.breatheKids : ''}`}
        >
          {strip ? (
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          ) : (
            <>
              <TimerUI value={minutes} fontSize={mobileFontSize} />
              <TimerUI value={seconds} fontSize={mobileFontSize} />
              {badge && (
                <span data-adjust-badge className={`${styles.badge} ${styles.badgePhone}`}>
                  {badge}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {phoneEnded && (
        <div data-ended-row className={styles.phoneRow}>
          {primary}
        </div>
      )}

      <div aria-hidden data-edge-progress className={styles.edgeTrack} />
      {notch !== null && <div aria-hidden data-edge-progress className={styles.edgeHatch} />}
      <div aria-hidden data-edge-progress className={styles.edgeFill} />
      {notch !== null && <div aria-hidden data-edge-progress className={styles.edgeNotch} />}
    </div>
  )
}
