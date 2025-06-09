'use client'

import ReactPlayer from 'react-player'
import { useSoundsStore } from '~/store/useSoundsStore'

import { useEffect, useState } from 'react'
import type { OnProgressProps } from 'react-player/base'
import { useUserSounds } from '~/hooks/useSounds'

const GlobalPlayer = () => {
  const { sounds } = useSoundsStore()
  const soundKeys = Object.keys(sounds)

  const addSound = useSoundsStore(s => s.addSound)
  const { data: userSounds } = useUserSounds()

  // State to hold timestamps: { [key: string]: number }
  const [timestamps, setTimestamps] = useState({})

  const setCurrentTime = useSoundsStore(s => s.setCurrentTime)


  // const handleProgress = (key : string, state: OnProgressProps) => {
  //   // state has playedSeconds property which is the current timestamp in seconds
  //   setTimestamps(prev => ({
  //     ...prev,
  //     [key]: state.playedSeconds,
  //   }))
  // }

  const handleProgress = (key: string, state: OnProgressProps) => {
    setCurrentTime(key, state.playedSeconds)
  }


  useEffect(() => {
    if (!userSounds) return;

    const existing = useSoundsStore.getState().sounds;

    // instead of userSounds.forEach(...)
    for (const s of userSounds) {
      if (!existing[s.id]) {
        addSound(s.id, s.name, s.url, s.isCustom, s.soundType);
      }
    }
  }, [userSounds, addSound]);

  return (
    <>
      {soundKeys
        .filter(key => sounds[key]?.soundType !== 'alarm')
        .map((
          key,
          index,
        ) => {
          const sound = sounds[key]

          // Check if sound exists before rendering the ReactPlayer
          if (!sound) return null

          return (
            <ReactPlayer
              config={{
                youtube: {
                  // 1) Tell YouTube your actual page origin:
                  playerVars: {
                    origin:
                      typeof window !== 'undefined'
                        ? window.location.origin     // "http://localhost:3000"
                        : undefined,
                    enablejsapi: 1,               // ensure JS API is enabled
                  },
                  // 2) (Optional) If you want the no-cookie host:
                  embedOptions: {
                    host: 'https://www.youtube-nocookie.com',
                  },
                },
              }}
              key={key}
              url={sound.url}
              playing={sound.playing}
              volume={sound.volume}
              controls={false} // Don't show controls as it's controlled globally
              muted={!sound.playing}
              width='0'
              height='0'
              onReady={() => console.log(`Player is ready ${key}`)}
              // onPause={() => `Pause index ${index}`}
              onStart={() => console.log(`Playing index ${index}`)}
              onProgress={(state) => handleProgress(key, state)}
            />
          )
        })}
      {/* <pre>{JSON.stringify(timestamps, null, 2)}</pre> */}
    </>
  )
}

export default GlobalPlayer
