'use client'

import { Button } from '@repo/ui/button'
import { Settings2 } from 'lucide-react'
import { useCustomizeStore } from '~/store/useCustomizeStore'

export default function CustomizeRailButton() {
  const open = useCustomizeStore(s => s.open)
  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Customize'
      onClick={() => open()}
    >
      <Settings2 className='h-5 w-5' />
    </Button>
  )
}
