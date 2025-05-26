'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'

import AccountButton from '../AccountButton'

const iconSize = 'md:h-5 xl:h-6 '

export default function TimerButtons() {
  const { isRunning, resetCurrentTime, skipToNextSession, toggleTimer } = useTimerStore()

  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768) // 'sm' breakpoint is 640px
    }

    handleResize() // Set initial state
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const buttonVariant = isSmallScreen ? 'ghost' : 'outline'

  return (
    <div className='flex items-center justify-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={toggleTimer}
              variant={buttonVariant}
            // size={window.length < 640 ? "sm" : "lg"}
            >
              {isRunning ? (
                <Pause className={`${iconSize}`} strokeWidth={3} />
              ) : (
                <Play className={`${iconSize}`} strokeWidth={3} />
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
              variant={buttonVariant}
              className='xl:h-12 xl:w-32'
            >
              <RotateCcw className={`${iconSize}`} strokeWidth={3} />
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
              variant={buttonVariant}
              className='xl:h-12 xl:w-32'
            >
              <SkipForward className={`${iconSize}`} strokeWidth={3} />
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>Skip To Next</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AccountButton />
    </div>
  )
}
