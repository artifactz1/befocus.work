'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTimerKeyboard } from '~/hooks/useTimerKeyboard'
import { computeTimerTransform, type TimerTransform } from '~/lib/customize/timer-scale'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useTimerStore } from '~/store/useTimerStore'
import useIsLandscape from '../helper/useIsMobileLandscape'
import TimerUI from './TimeUI'
import styles from './timer-progress.module.css'

const RULER_TICKS = Array.from({ length: 25 }, (_, i) => i)

type ProgressStyle = CSSProperties & Record<'--progress', string>

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
  const { sounds, alarmId } = useSoundsStore()
  const { timeLeft, isRunning, decrementTime, workDuration, breakDuration, isWorking } =
    useTimerStore()
  const panelOpen = useCustomizeStore(s => s.panelOpen)

  const [minutes, setMinutes] = useState<number>(timeLeft / 60)
  const [seconds, setSeconds] = useState<number>(0)
  const isLandscape = useIsLandscape()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const clockRef = useRef<HTMLDivElement | null>(null)
  const [transform, setTransform] = useState<TimerTransform | null>(null)

  useTimerKeyboard()

  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('sounds/public_sounds_alarm1.mp3')
      workerRef.current = new Worker(new URL('../../lib/timerWorker', import.meta.url))
      workerRef.current.onmessage = e => {
        if (e.data === 'decrement') {
          decrementTime()
        }
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [decrementTime])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      workerRef.current?.postMessage({ command: 'start', interval: 1000 })
    } else {
      workerRef.current?.postMessage({ command: 'stop' })
    }
  }, [isRunning, timeLeft])

  useEffect(() => {
    const selectedAlarm = sounds[alarmId]
    if (selectedAlarm && audioRef.current) {
      audioRef.current.src = selectedAlarm.url
      audioRef.current.load()
      audioRef.current.volume = selectedAlarm.volume
    }
  }, [alarmId, sounds])

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

  useEffect(() => {
    if (timeLeft === 0) {
      playAlarm()
    } else {
      stopAlarm()
    }
  }, [timeLeft, playAlarm, stopAlarm])

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

  useLayoutEffect(() => {
    if (!panelOpen) {
      setTransform(null)
      return
    }

    const measure = () => {
      const root = rootRef.current
      const clock = clockRef.current
      if (!root || !clock) return

      const digitsBlocks = clock.querySelectorAll<HTMLElement>('[data-timer-digits]')
      let visible: HTMLElement | null = null
      for (const el of digitsBlocks) {
        if (el.offsetParent !== null) {
          visible = el
          break
        }
      }
      if (!visible) return

      const rootRect = root.getBoundingClientRect()
      setTransform(
        computeTimerTransform({
          panelOpen: true,
          vw: window.innerWidth,
          vh: window.innerHeight,
          timerW: visible.offsetWidth,
          timerH: visible.offsetHeight,
          centerY: rootRect.top + rootRect.height / 2,
        }),
      )
    }

    measure()
    window.addEventListener('resize', measure)

    const observer = new ResizeObserver(measure)
    const clock = clockRef.current
    if (clock) {
      for (const el of clock.querySelectorAll<HTMLElement>('[data-timer-digits]')) {
        observer.observe(el)
      }
    }

    return () => {
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [panelOpen])

  const total = isWorking ? workDuration : breakDuration
  const elapsed = total > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / total)) : 0
  const nowIndex = Math.floor(elapsed * 25)

  const desktopFontSize = `calc(${isLandscape ? '30vh' : widthSize} * var(--timer-scale, 1))`
  const mobileFontSize = `calc(${widthSize} * var(--timer-scale, 1))`

  const rootStyle: ProgressStyle = { '--progress': String(elapsed) }

  const clockStyle: CSSProperties = transform
    ? { transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})` }
    : {}

  return (
    <div
      ref={rootRef}
      className='relative z-0 flex min-h-0 flex-1 items-center justify-center font-display text-dash'
      style={rootStyle}
    >
      <span role='timer' aria-label='Time remaining' className='sr-only'>
        {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </span>

      <div
        ref={clockRef}
        data-timer-clock
        className={`absolute inset-0 flex items-center justify-center ${styles.clockTransition}`}
        style={clockStyle}
      >
        <div
          aria-hidden
          className={`relative hidden h-[70vh] items-center justify-center font-bold sm:flex ${styles.digits}`}
          data-timer-digits
        >
          <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          <div
            aria-hidden
            className={`absolute inset-0 items-center justify-center ${styles.inkOverlay}`}
          >
            <DesktopDigits minutes={minutes} seconds={seconds} fontSize={desktopFontSize} />
          </div>

          <div className={styles.under}>
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
          </div>
        </div>

        <div
          aria-hidden
          className={`absolute flex-row items-center font-bold sm:hidden ${styles.digits}`}
          data-timer-digits
        >
          <TimerUI value={minutes} fontSize={mobileFontSize} />
          <TimerUI value={seconds} fontSize={mobileFontSize} />
        </div>
      </div>

      <div aria-hidden data-edge-progress className={styles.edgeTrack} />
      <div aria-hidden data-edge-progress className={styles.edgeFill} />
    </div>
  )
}
