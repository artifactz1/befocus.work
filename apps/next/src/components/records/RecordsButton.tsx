'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Disc3 } from 'lucide-react'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useCustomizeActions } from '../customize/useCustomizeActions'
import MenuButton from '../helper/MenuButtons'

export default function RecordsButton() {
  const roomOpen = useSoundsStore(state => state.roomOpen)
  const setRoomOpen = useSoundsStore(state => state.setRoomOpen)
  const { close } = useCustomizeActions()

  const toggle = () => {
    if (!roomOpen) close()
    setRoomOpen(!roomOpen)
  }

  return (
    <TooltipProvider>
      {/* forced closed while open so the tooltip's Escape listener cannot swallow ours */}
      <Tooltip open={roomOpen ? false : undefined}>
        <TooltipTrigger asChild>
          <MenuButton
            aria-label='Records'
            aria-expanded={roomOpen}
            data-records-trigger
            className={roomOpen ? 'bg-foreground/[0.07] text-foreground' : undefined}
            onClick={toggle}
          >
            <Disc3 />
          </MenuButton>
        </TooltipTrigger>
        <TooltipContent className='font-bold' side='top' sideOffset={8}>
          <p>Records</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
