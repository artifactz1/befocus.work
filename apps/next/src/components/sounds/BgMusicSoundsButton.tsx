'use client'

import { Separator } from '@repo/ui/separator'
import { useSoundsStore } from '~/store/useSoundsStore'
import SoundButton from './SoundButton'

export default function BgMusicSoundsButton() {
  const { sounds } = useSoundsStore()

  return (
    <main>
      <Separator className='my-4 bg-white' />
      <div className='space-y-4'>
        {Object.keys(sounds)
          .filter(soundId => sounds[soundId]?.soundType === 'bgMusic')
          .map(soundId => (
            <SoundButton key={soundId} soundId={soundId} />
          ))}
      </div>
    </main>
  )
}

