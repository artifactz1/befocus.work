'use client'

import { useEffect, useRef } from 'react'
import { nudgeDelays } from '~/lib/blocks/blocks'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useTimerStore } from '~/store/useTimerStore'

const ENDED_TITLE = "Time's up · Be Focus"

// The one owner of the alarm: rings at the block's wall-clock end, nudges at +30 s and +60 s,
// stops asking on any input, and sets the tab title while ended.
export function useEndedCues() {
  const alarmUrl = useSoundsStore(s => s.sounds[s.alarmId]?.url)
  const alarmVolume = useSoundsStore(s => s.sounds[s.alarmId]?.volume ?? 0.5)
  const ended = useTimerStore(s => s.status === 'ended')
  const blockId = useTimerStore(s => s.currentBlockId)
  const endedAt = useTimerStore(s => s.blocks.find(b => b.id === s.currentBlockId)?.endedAt ?? null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // never `loop`: the alarm sounds at most three times per block
    audioRef.current = new Audio('sounds/public_sounds_alarm1.mp3')
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (alarmUrl && audioRef.current) {
      audioRef.current.src = alarmUrl
      audioRef.current.load()
    }
  }, [alarmUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = alarmVolume
  }, [alarmVolume])

  // biome-ignore lint/correctness/useExhaustiveDependencies: blockId re-arms the cues when a new block ends
  useEffect(() => {
    if (!ended || endedAt === null) return
    const audio = audioRef.current
    const ring = () => {
      if (!audio) return
      audio.currentTime = 0
      audio.play().catch(error => console.error('Error playing audio:', error))
    }
    ring()
    // only nudges still in the future: a tab hidden past one does not replay it
    const timers = nudgeDelays(endedAt, Date.now()).map(d => setTimeout(ring, d))
    const cancel = () => {
      for (const t of timers) clearTimeout(t)
    }
    // listeners only clear timeouts: no preventDefault, no stopPropagation
    window.addEventListener('keydown', cancel, { capture: true })
    window.addEventListener('pointerdown', cancel, { capture: true })

    const previousTitle = document.title
    document.title = ENDED_TITLE

    return () => {
      cancel()
      window.removeEventListener('keydown', cancel, { capture: true })
      window.removeEventListener('pointerdown', cancel, { capture: true })
      document.title = previousTitle
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [ended, blockId, endedAt])
}
