'use client'

import { useSoundsStore } from '~/store/useSoundsStore'
import Divider from '../../helper/Divider'
import AmbientSoundsButton from './AmbientSoundButton'

export default function AmbientSoundsMenu() {
  const { sounds } = useSoundsStore()

  return (
    <main>
      <Divider />
      <div className='space-y-4'>
        {Object.keys(sounds)
          .filter(id => sounds[id]?.soundType === 'ambient')
          .map(id => (
            <AmbientSoundsButton key={id} soundId={id} />
          ))}
      </div>
    </main>
  )
}
