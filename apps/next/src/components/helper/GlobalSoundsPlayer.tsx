'use client'

import { useEffect } from 'react'
import ReactPlayer from 'react-player'
import { useUserSounds } from '~/hooks/useSounds'
import { useSoundsStore } from '~/store/useSoundsStore'

const GlobalPlayer = () => {
  // Use selective subscriptions to prevent unnecessary re-renders
  const sounds = useSoundsStore(state => state.sounds)
  const syncUserSounds = useSoundsStore(state => state.syncUserSounds)

  const soundKeys = Object.keys(sounds)
  const { data: userSounds } = useUserSounds()

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
            />
          )
        })}
    </>
  )
}

export default GlobalPlayer
