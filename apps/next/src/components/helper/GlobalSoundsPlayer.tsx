'use client'

import ReactPlayer from 'react-player'
import { useSoundsStore } from '~/store/useSoundsStore'

import { useEffect } from 'react'
import type { OnProgressProps } from 'react-player/base'
import { useUserSounds } from '~/hooks/useSounds'

const GlobalPlayer = () => {
  // Use selective subscriptions to prevent unnecessary re-renders
  const sounds = useSoundsStore(state => state.sounds)
  const seekingStates = useSoundsStore(state => state.seekingStates)
  const setCurrentTime = useSoundsStore(state => state.setCurrentTime)
  const setDuration = useSoundsStore(state => state.setDuration)
  const setPlayerRef = useSoundsStore(state => state.setPlayerRef)
  const addSound = useSoundsStore(state => state.addSound)

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
    if (!userSounds) return;

    const existing = sounds; // Use the sounds from the hook subscription

    for (const s of userSounds) {
      if (!existing[s.id]) {
        addSound(s.id, s.name, s.url, s.isCustom, s.soundType);
      }
    }
  }, [userSounds, addSound, sounds]); // Add sounds to dependencies

  return (
    <>
      {soundKeys
        .filter(key => sounds[key]?.soundType !== 'alarm')
        .map((key) => {
          const sound = sounds[key]

          if (!sound) return null

          return (
            <ReactPlayer
              ref={(player) => {
                if (player) {
                  handleReady(key, player)
                }
              }}
              config={{
                youtube: {
                  playerVars: {
                    origin:
                      typeof window !== 'undefined'
                        ? window.location.origin
                        : undefined,
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
              onReady={() => { }} // Remove console.log to prevent re-renders
              onStart={() => { }} // Remove console.log to prevent re-renders
              onProgress={(state) => handleProgress(key, state)}
              onDuration={(duration) => handleDuration(key, duration)}
            // onError={(error) => console.error(`[${key}] Player error:`, error)}
            />
          )
        })}
    </>
  )
}

export default GlobalPlayer