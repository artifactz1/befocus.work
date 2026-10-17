'use client'

import type { ButtonProps } from '@repo/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Timer } from 'lucide-react'
import { useState } from 'react'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'
import { useSessionCard } from './useSessionCard'

export default function SessionSettingsButton({
  className,
  size,
}: {
  className?: string
  size?: ButtonProps['size']
}) {
  const card = useTimerStore(s => s.card)
  const { openEdit } = useSessionCard()
  const [tip, setTip] = useState(false)

  return (
    <TooltipProvider>
      {/* Opened only by hover or keyboard focus, so focus returning after the card closes
          does not pop it. */}
      <Tooltip
        open={tip && card === null}
        onOpenChange={open =>
          setTip(
            open &&
              Boolean(document.querySelector('[data-session-trigger]:is(:hover, :focus-visible)')),
          )
        }
      >
        <TooltipTrigger asChild>
          <MenuButton
            data-session-trigger
            aria-label='Session settings'
            aria-haspopup='dialog'
            aria-expanded={card === 'edit'}
            size={size}
            className={className}
            onClick={openEdit}
          >
            <Timer />
          </MenuButton>
        </TooltipTrigger>
        <TooltipContent className='font-bold' side='top' sideOffset={8}>
          <p>Session settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
