'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'
import { useSessionCard } from '../settings/useSessionCard'

const iconSize = 'md:h-5 xl:h-6 '

export default function TimerButtons() {
  const { isRunning, resetCurrentTime, skipToPrevSession, skipToNextSession } = useTimerStore()
  const card = useTimerStore(s => s.card)
  const { requestStart } = useSessionCard()

  return (
    <div data-transport className='flex items-center justify-center gap-1 px-2 py-1.5'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={skipToPrevSession}
              appearance='outline'
              className='xl:h-12 xl:w-32'
              data-slot='1'
              aria-label='Skip to previous'
            >
              <SkipBack className={`${iconSize}`} strokeWidth={2} />
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>Skip To Prev</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip open={card ? false : undefined}>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={requestStart}
              appearance='outline'
              data-slot='2'
              aria-label={isRunning ? 'Pause' : 'Start'}
              aria-keyshortcuts='Space'
            >
              {isRunning ? (
                <Pause className={`${iconSize}`} strokeWidth={2} />
              ) : (
                <Play className={`${iconSize}`} strokeWidth={2} />
              )}
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>{isRunning ? 'Pause' : 'Play'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={resetCurrentTime}
              appearance='outline'
              className='xl:h-12 xl:w-32'
              data-slot='3'
              aria-label='Reset time'
              aria-keyshortcuts='R'
            >
              <RotateCcw className={`${iconSize}`} strokeWidth={2} />
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>Reset Time</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={skipToNextSession}
              appearance='outline'
              className='xl:h-12 xl:w-32'
              data-slot='4'
              aria-label='Skip to next'
            >
              <SkipForward className={`${iconSize}`} strokeWidth={2} />
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>Skip To Next</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
