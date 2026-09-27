'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Palette } from 'lucide-react'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import MenuButton from '../helper/MenuButtons'
import { useCustomizeActions } from './useCustomizeActions'

export default function CustomizeButton({ className }: { className?: string }) {
  const panelOpen = useCustomizeStore(state => state.panelOpen)
  const { toggle } = useCustomizeActions()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <MenuButton
            className={className}
            aria-label='Customize'
            aria-expanded={panelOpen}
            data-customize-trigger
            onClick={toggle}
          >
            <Palette className='text-user-accent' />
          </MenuButton>
        </TooltipTrigger>
        <TooltipContent className='font-bold' side='top' sideOffset={8}>
          <p>Customize</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
