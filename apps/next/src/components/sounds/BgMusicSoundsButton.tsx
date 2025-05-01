// 'use client'

// import { Separator } from '@repo/ui/separator'
// import { useSoundsStore } from '~/store/useSoundsStore'
// import SoundButton from './SoundButton'

// export default function BgMusicSoundsButton() {
//   const { sounds } = useSoundsStore()

//   return (
//     <main>
//       <Separator className='my-4 bg-white' />
//       <div className='space-y-4'>
//         {Object.keys(sounds)
//           .filter(soundId => sounds[soundId]?.soundType === 'bgMusic')
//           .map(soundId => (
//             <SoundButton key={soundId} soundId={soundId} />
//           ))}
//       </div>
//     </main>
//   )
// }

'use client'

import { Separator } from '@repo/ui/separator'
import { useSoundsStore } from '~/store/useSoundsStore'
import SoundButton from './SoundButton'
import { useQuery } from '@tanstack/react-query'
import { api } from '~/lib/api.client'
import { useEffect } from 'react'

export const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
export type SoundType = (typeof soundTypes)[number]

// type Sound = {
//   id: string
//   url: string
//   isCustom: boolean
//   soundType: SoundType 
//   createdAt: string | null
//   userId: string
// }

// 1) Raw server response
type RawSound = {
  id: string
  url: string
  isCustom: boolean
  soundType: string         // <-- just `string` here
  createdAt: string | null
  userId: string
}

// 2) Your store’s richer type
type Sound = RawSound & {
  playing: boolean
  volume: number
  soundType: 'alarm' | 'ambient' | 'bgMusic'  // narrower union
}

export default function BgMusicSoundsButton() {
  const sounds = useSoundsStore((s) => s.sounds)
  const addSound = useSoundsStore((s) => s.addSound)

  // const { data: userSounds, isLoading, error } = useQuery<RawSound[]>({
  //   queryKey: ['userSounds'],
  //   queryFn: async () => {
  //     const res = await api.user.sounds.$get()
  //     if (!res.ok) throw new Error('Failed to fetch user sounds')
  //     return await res.json() 
  //   },
  //   // You can choose whether to refetch on window focus, on reconnect, etc.
  //   // refetchOnWindowFocus: false,
  // })

  // 3) useQuery with select
  const { data: userSounds, isLoading, error } = useQuery<
    RawSound[],   // TQueryFnData
    Error,        // TError
    Sound[]       // TData (after select)
  >({
    queryKey: ['userSounds'],
    queryFn: async (): Promise<RawSound[]> => {
      const res = await api.user.sounds.$get()
      if (!res.ok) throw new Error('Failed to fetch user sounds')
      return res.json()
    },
    select: (raw): Sound[] =>
      raw
        // optionally filter out any totally bogus `soundType`
        .filter((r): r is RawSound => true)
        .map((r) => ({
          ...r,
          // cast the string into the union (you could also runtime-validate here)
          soundType: r.soundType as Sound['soundType'],
          playing: false,
          volume: 0,
        })),
  })
  
  useEffect(() => {
    if (!userSounds) return

    //⬇️ Replace forEach with for…of
    for (const s of userSounds) {
      addSound(s.id, s.url, s.isCustom, s.soundType)
    }
  }, [userSounds, addSound])

  if (isLoading) return <div>Loading music...</div>
  if (error) return <div className="text-red-400">Error loading music</div>

  return (
    <main>
      <Separator className="my-4 bg-white" />
      <div className="space-y-4">
        {Object.entries(sounds)
          .filter(([_, s]) => s.soundType === 'bgMusic')
          .map(([soundId]) => (
            <SoundButton key={soundId} soundId={soundId} />
          ))}
      </div>
    </main>
  )
}
