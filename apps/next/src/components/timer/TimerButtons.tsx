'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'

const iconSize = 'md:h-5 xl:h-6 '

export default function TimerButtons() {
  const { isRunning, resetCurrentTime, skipToPrevSession, skipToNextSession, toggleTimer } =
    useTimerStore()

  return (
    <div className='flex items-center justify-center gap-1 rounded-full bg-card/50 px-2 py-1.5 backdrop-blur-md shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)]'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={skipToPrevSession}
              appearance='outline'
              className='xl:h-12 xl:w-32'
              aria-label='Skip to previous'
            >
              <SkipBack className={`${iconSize}`} strokeWidth={2} />
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>Skip To Prev</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={toggleTimer}
              appearance='outline'
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
