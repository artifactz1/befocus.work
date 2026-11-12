'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { NotebookPen } from 'lucide-react'
import { useState } from 'react'
import { useDeckStore } from '~/store/useDeckStore'
import { useCustomizeActions } from '../customize/useCustomizeActions'
import MenuButton from '../helper/MenuButtons'

// The panel holding List, Plan and Log. Its button, heading and close label all read this.
export const PANEL_NAME = 'Focus'

export default function TasksButton() {
  const isOpen = useDeckStore(s => s.deck === 'tasks')
  const toggleDeck = useDeckStore(s => s.toggleDeck)
  const { close } = useCustomizeActions()
  const [tip, setTip] = useState(false)

  const toggle = () => {
    if (!isOpen) close()
    toggleDeck('tasks')
  }

  return (
    <TooltipProvider>
      {/* Closed while the card is open (its Escape listener would swallow ours) and only opened
          by hover or keyboard focus, not by focus returning after a tap or click. */}
      <Tooltip
        open={tip && !isOpen}
        onOpenChange={open =>
          setTip(
            open &&
              Boolean(document.querySelector('[data-tasks-trigger]:is(:hover, :focus-visible)')),
          )
        }
      >
        <TooltipTrigger asChild>
          <MenuButton
            aria-label={PANEL_NAME}
            aria-expanded={isOpen}
            data-tasks-trigger
            data-active={isOpen || undefined}
            onClick={toggle}
          >
            <NotebookPen />
          </MenuButton>
        </TooltipTrigger>
        <TooltipContent className='font-bold' side='top' sideOffset={8}>
          <p>{PANEL_NAME}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
