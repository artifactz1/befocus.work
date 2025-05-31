'use client'

import { useSoundsStore } from '~/store/useSoundsStore'
import Divider from '../helper/Divider'
import SoundButton from './SoundButton'

export default function AmbientSoundsButton() {
  const { sounds } = useSoundsStore()

  return (
    <main>
      <Divider />
      <div className='space-y-4'>
        {Object.keys(sounds)
          .filter(id => sounds[id]?.soundType === 'ambient')
          .map(id => (
            <SoundButton key={id} soundId={id} />
          ))}
      </div>
    </main>
  )
}
