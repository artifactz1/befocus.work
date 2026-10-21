'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'
import { useSessionCard } from '../settings/useSessionCard'

const iconSize = 'md:h-5 xl:h-6 '
// Coarse pointers get the 44px touch minimum on every slot (slot widths never change).
const touch = '[@media(pointer:coarse)]:min-h-11'
// aria-disabled, never `disabled`: a dimmed button keeps focus and its tab stop (08-UI-SPEC).
const dimmedLook = 'aria-disabled:pointer-events-none aria-disabled:opacity-30'
const adjustText =
  'text-base font-semibold tabular-nums max-[639px]:text-sm touch-none select-none [-webkit-touch-callout:none]'

export default function TimerButtons() {
  const { isRunning, status, timeLeft, resetCurrentTime, skipToPrevSession, skipToNextSession } =
    useTimerStore()
  const adjust = useTimerStore(s => s.adjust)
  const card = useTimerStore(s => s.card)
  const { requestStart } = useSessionCard()

  const ended = status === 'ended'
  const adjusting = status === 'running' || ended
  const removeDimmed = ended || timeLeft <= 60

  return (
    <div data-transport className='flex items-center justify-center gap-1 px-2 py-1.5'>
      <TooltipProvider>
        <Tooltip open={removeDimmed ? false : undefined}>
          <TooltipTrigger asChild>
            {adjusting ? (
              <MenuButton
                onClick={() => {
                  if (!removeDimmed) adjust(-1)
                }}
                onContextMenu={e => e.preventDefault()}
                appearance='outline'
                className={`xl:h-12 xl:w-32 ${touch} ${dimmedLook} ${adjustText}`}
                data-slot='1'
                aria-label='Remove 1 minute'
                aria-keyshortcuts='-'
                aria-disabled={removeDimmed || undefined}
              >
                {'−1'}
              </MenuButton>
            ) : (
              <MenuButton
                onClick={skipToPrevSession}
                appearance='outline'
                className={`xl:h-12 xl:w-32 ${touch}`}
                data-slot='1'
                aria-label='Skip to previous'
              >
                <SkipBack className={`${iconSize}`} strokeWidth={2} />
              </MenuButton>
            )}
          </TooltipTrigger>
          <TooltipContent className='font-bold'>
            {adjusting ? 'Remove 1 min · hold for more' : 'Skip To Prev'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip open={card || ended ? false : undefined}>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={() => {
                if (!ended) requestStart()
              }}
              appearance='outline'
              className={`${touch} ${dimmedLook}`}
              data-slot='2'
              aria-label={isRunning ? 'Pause' : 'Start'}
              aria-keyshortcuts='Space'
              aria-disabled={ended || undefined}
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
              className={`xl:h-12 xl:w-32 ${touch}`}
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
            {adjusting ? (
              <MenuButton
                onClick={() => adjust(1)}
                onContextMenu={e => e.preventDefault()}
                appearance='outline'
                className={`xl:h-12 xl:w-32 ${touch} ${adjustText}`}
                data-slot='4'
                aria-label='Add 1 minute'
                aria-keyshortcuts='='
              >
                +1
              </MenuButton>
            ) : (
              <MenuButton
                onClick={skipToNextSession}
                appearance='outline'
                className={`xl:h-12 xl:w-32 ${touch}`}
                data-slot='4'
                aria-label='Skip to next'
              >
                <SkipForward className={`${iconSize}`} strokeWidth={2} />
              </MenuButton>
            )}
          </TooltipTrigger>
          <TooltipContent className='font-bold'>
            {adjusting ? 'Add 1 min · hold for more' : 'Skip To Next'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
