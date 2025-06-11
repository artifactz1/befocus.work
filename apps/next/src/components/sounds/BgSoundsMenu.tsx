'use client'

import { useSoundsStore } from '~/store/useSoundsStore'
import Divider from '../helper/Divider'
import SoundsButton from './SoundsButton'

export default function BgMusicSoundsButton() {
  const { sounds } = useSoundsStore()

  return (
    <main>
      <Divider />
      <div className='space-y-4'>
        {Object.keys(sounds)
          .filter(id => sounds[id]?.soundType === 'bgMusic')
          .map(id => (
            <SoundsButton key={id} soundId={id} type='bgMusic' />
          ))}
      </div>
    </main>
  )
}
