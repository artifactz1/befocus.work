'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { History } from 'lucide-react'
import Link from 'next/link'
import { isLive } from '~/lib/blocks/blocks'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'

// /log sits outside the timer layouts, so a running session would be lost: disabled while live.
export default function LogButton() {
  const live = useTimerStore(s => isLive(s))
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {live ? (
            <MenuButton aria-label='Log' aria-disabled='true' className='opacity-40'>
              <History />
            </MenuButton>
          ) : (
            <MenuButton asChild aria-label='Log'>
              <Link href='/log'>
                <History />
              </Link>
            </MenuButton>
          )}
        </TooltipTrigger>
        <TooltipContent className='font-bold' side='top' sideOffset={8}>
          <p>{live ? 'Log opens between sessions' : 'Log'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
