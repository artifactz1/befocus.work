'use client'

import { Separator } from '@repo/ui/separator'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '~/lib/api.client'
import { useSoundsStore } from '~/store/useSoundsStore'
import SoundButton from './SoundButton'

export default function BgMusicSoundsButton() {
  const sounds = useSoundsStore(s => s.sounds)
  const addSound = useSoundsStore(s => s.addSound)

  const {
    data: userSounds,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['userSounds'],
    queryFn: async () => {
      const res = await api.user.sounds.$get()
      if (!res.ok) throw new Error('Failed to fetch user sounds')
      return res.json()                              // RawSound[]
    },
    select: (raw) =>
      raw.map(r => ({
        ...r,
        soundType: r.soundType as 'alarm' | 'ambient' | 'bgMusic',
        playing: false,
        volume: 0,
      })),                                           // Sound[]
    // we only need the sounds once → don’t refetch on focus
    refetchOnWindowFocus: false,
  })

  /* merge user sounds into the store once the fetch succeeds */
  useEffect(() => {
    if (!userSounds) return
    for (const s of userSounds) {
      addSound(s.id, s.url, s.isCustom, s.soundType)
    }
  }, [userSounds, addSound])

  /* ------------------------------------------------------------------ */
  return (
    <main>
      <Separator className="my-4 bg-white" />

      {isLoading && (
        <p className="mb-2 text-sm text-gray-300">Loading your sounds…</p>
      )}
      {isError && (
        <p className="mb-2 text-sm text-red-400">
          Couldn’t load your sounds – showing defaults only.
        </p>
      )}

      <div className="space-y-4">
        {Object.entries(sounds)
          .filter(([_, s]) => s.soundType === 'bgMusic')
          .map(([id]) => (
            <SoundButton key={id} soundId={id} />
          ))}
      </div>
    </main>
  )
}
