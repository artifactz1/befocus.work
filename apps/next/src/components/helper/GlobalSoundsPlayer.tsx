'use client'

import { useQuery } from '@tanstack/react-query'
import ReactPlayer from 'react-player'
import { useSoundsStore } from '~/store/useSoundsStore'

import { useEffect } from 'react'
import { api } from '~/lib/api.client'
import { useUserSounds } from '~/hooks/useSounds'

const GlobalPlayer = () => {
  const { sounds } = useSoundsStore()
  const soundKeys = Object.keys(sounds)

  const addSound = useSoundsStore(s => s.addSound)
  const { data: userSounds } = useUserSounds()

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
              // config={{
              //   youtube: {
              //     playerVars: {
              //       // exactly your page’s origin:
              //       origin:
              //         typeof window !== 'undefined'
              //           ? window.location.origin    // e.g. "http://localhost:3000"
              //           : undefined,
              //     },
              //     embedOptions: {
              //       // optional: use no-cookie host if you prefer
              //       host: 'https://www.youtube-nocookie.com',
              //     },
              //   },
              // }}
              // config={{
              //   youtube: {
              //     // pass your origin so postMessage doesn’t get blocked:
              //     playerVars: {
              //       origin: typeof window !== 'undefined'
              //         ? window.location.origin
              //         : undefined,
              //     },
              //     // override the iframe embed host:
              //     embedOptions: {
              //       host: 'https://www.youtube.com',
              //     },
              //   },
              // }}
              key={key}
              url={sound.url}
              playing={sound.playing}
              volume={sound.volume}
              controls={false} // Don't show controls as it's controlled globally
              muted={!sound.playing}
              width='0'
              height='0'
              onReady={() => console.log(`Player is ready ${index}`)}
              // onPause={() => `Pause index ${index}`}
              onStart={() => console.log(`Playing index ${index}`)}
            />
          )
        })}
    </>
  )
}

export default GlobalPlayer
