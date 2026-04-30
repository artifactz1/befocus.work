'use client'

import { Button } from '@repo/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Settings2 } from 'lucide-react'
import { useCustomizeStore } from '~/store/useCustomizeStore'

export default function CustomizeRailButton() {
  const open = useCustomizeStore(s => s.open)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Customize' onClick={() => open()}>
            <Settings2 className='h-5 w-5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='font-bold' side='right'>
          Customize
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
