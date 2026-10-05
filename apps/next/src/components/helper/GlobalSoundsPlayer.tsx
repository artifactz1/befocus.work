'use client'

import { useEffect } from 'react'
import ReactPlayer from 'react-player'
import type { OnProgressProps } from 'react-player/base'
import { useUserSounds } from '~/hooks/useSounds'
import { useSoundsStore } from '~/store/useSoundsStore'

const GlobalPlayer = () => {
  // Use selective subscriptions to prevent unnecessary re-renders
  const sounds = useSoundsStore(state => state.sounds)
  const seekingStates = useSoundsStore(state => state.seekingStates)
  const setCurrentTime = useSoundsStore(state => state.setCurrentTime)
  const setDuration = useSoundsStore(state => state.setDuration)
  const setPlayerRef = useSoundsStore(state => state.setPlayerRef)
  const syncUserSounds = useSoundsStore(state => state.syncUserSounds)

  const soundKeys = Object.keys(sounds)
  const { data: userSounds } = useUserSounds()

  // Simplified progress handler
  const handleProgress = (key: string, state: OnProgressProps) => {
    const isSeeking = seekingStates[key] ?? false

    // console.log(`[${key}] Progress:`, state.playedSeconds, 'Seeking:', isSeeking)

    // Only update currentTime if we're not actively seeking
    if (!isSeeking) {
      setCurrentTime(key, state.playedSeconds)
    }
  }

  const handleDuration = (key: string, duration: number) => {
    // console.log(`[${key}] Duration loaded:`, duration)
    setDuration(key, duration)
  }

  const handleReady = (key: string, player: ReactPlayer) => {
    // console.log(`[${key}] Player ready`)
    setPlayerRef(key, player)
  }

  useEffect(() => {
    syncUserSounds(userSounds)
  }, [userSounds, syncUserSounds])

  return (
    <>
      {soundKeys
        .filter(key => sounds[key]?.soundType !== 'alarm')
        .map(key => {
          const sound = sounds[key]

          if (!sound) return null

          return (
            <ReactPlayer
              ref={player => {
                if (player) {
                  handleReady(key, player)
                }
              }}
              config={{
                youtube: {
                  playerVars: {
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                    enablejsapi: 1,
                  },
                  embedOptions: {
                    host: 'https://www.youtube-nocookie.com',
                  },
                },
              }}
              key={key}
              url={sound.url}
              playing={sound.playing}
              volume={sound.volume}
              controls={false}
              muted={!sound.playing}
              width='0'
              height='0'
              onReady={() => {}} // Remove console.log to prevent re-renders
              onStart={() => {}} // Remove console.log to prevent re-renders
              onProgress={state => handleProgress(key, state)}
              onDuration={duration => handleDuration(key, duration)}
              // onError={(error) => console.error(`[${key}] Player error:`, error)}
            />
          )
        })}
    </>
  )
}

export default GlobalPlayer
