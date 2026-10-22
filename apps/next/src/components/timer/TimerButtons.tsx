'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import { useHoldPress } from '~/hooks/useHoldPress'
import { useTimerStore } from '~/store/useTimerStore'
import MenuButton from '../helper/MenuButtons'
import { useSessionCard } from '../settings/useSessionCard'
import AdjustTray, { markAdjustHintSeen } from './AdjustTray'
import tray from './adjust-tray.module.css'

const iconSize = 'md:h-5 xl:h-6 '
// Coarse pointers get the 44px touch minimum on every slot (slot widths never change).
const touch = '[@media(pointer:coarse)]:min-h-11'
// aria-disabled, never `disabled`: a dimmed button keeps focus and its tab stop (08-UI-SPEC).
const dimmedLook = 'aria-disabled:pointer-events-none aria-disabled:opacity-30'
const adjustText =
  'text-base font-semibold tabular-nums max-[639px]:text-sm touch-none select-none [-webkit-touch-callout:none]'

type OpenTray = { sign: 1 | -1; by: 'pointer' | 'keyboard' } | null

// -1 / +1 trigger: tap, 400 ms hold and ArrowUp / ArrowDown all lead to the same tray.
function AdjustSlot({
  sign,
  dimmed,
  openTray,
  setOpenTray,
}: {
  sign: 1 | -1
  dimmed: boolean
  openTray: OpenTray
  setOpenTray: (t: OpenTray) => void
}) {
  const adjust = useTimerStore(s => s.adjust)
  const trayId = useId()
  const descId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const open = !dimmed && openTray?.sign === sign
  const close = useCallback(() => setOpenTray(null), [setOpenTray])
  const hold = useHoldPress({
    onTap: () => {
      close()
      adjust(sign)
    },
    onHoldOpen: () => {
      setOpenTray({ sign, by: 'pointer' })
      markAdjustHintSeen()
    },
    onRelease: m => {
      close()
      adjust(sign * m)
    },
  })

  // A trigger that dims (under 1:00, or -1 at 00:00) cannot keep a tray.
  useEffect(() => {
    if (dimmed && openTray?.sign === sign) close()
  }, [dimmed, openTray, sign, close])

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (dimmed || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    setOpenTray({ sign, by: 'keyboard' })
    markAdjustHintSeen()
  }

  const word = sign === 1 ? 'Add' : 'Remove'
  return (
    <TooltipProvider>
      <Tooltip open={dimmed || open || hold.held ? false : undefined}>
        <span className='relative'>
          <TooltipTrigger asChild>
            <MenuButton
              ref={triggerRef}
              {...(dimmed ? {} : hold.handlers)}
              onClick={dimmed ? undefined : hold.handlers.onClick}
              onKeyDown={onKeyDown}
              onContextMenu={e => e.preventDefault()}
              appearance='outline'
              className={`xl:h-12 xl:w-32 ${touch} ${dimmedLook} ${adjustText} ${tray.holdable} ${hold.held || open ? tray.held : ''}`}
              data-slot={sign === 1 ? '4' : '1'}
              aria-label={`${word} 1 minute`}
              aria-keyshortcuts={sign === 1 ? '=' : '-'}
              aria-disabled={dimmed || undefined}
              aria-expanded={open}
              aria-controls={open ? trayId : undefined}
              aria-describedby={descId}
            >
              {sign === 1 ? '+1' : '\u22121'}
            </MenuButton>
          </TooltipTrigger>
          <span id={descId} className='sr-only'>
            Arrow Up for 1, 5 or 10 minutes
          </span>
          <AdjustTray
            id={trayId}
            sign={sign}
            open={open}
            activeMinutes={hold.activeMinutes}
            openedBy={openTray?.by ?? 'pointer'}
            onApply={m => {
              close()
              adjust(sign * m)
            }}
            onClose={close}
            triggerRef={triggerRef}
          />
        </span>
        <TooltipContent className='font-bold'>{word} 1 min · hold for more</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function TimerButtons() {
  const { isRunning, status, timeLeft, resetCurrentTime, skipToPrevSession, skipToNextSession } =
    useTimerStore()
  const card = useTimerStore(s => s.card)
  const { requestStart } = useSessionCard()
  const [openTray, setOpenTray] = useState<OpenTray>(null)

  const ended = status === 'ended'
  const adjusting = status === 'running' || ended
  const removeDimmed = ended || timeLeft <= 60

  // Any status change (pause, reset, running -> ended at the block end) closes the tray.
  const prevStatus = useRef(status)
  useEffect(() => {
    if (prevStatus.current !== status) setOpenTray(null)
    prevStatus.current = status
  }, [status])

  return (
    <div data-transport className='flex items-center justify-center gap-1 px-2 py-1.5'>
      {adjusting ? (
        <AdjustSlot sign={-1} dimmed={removeDimmed} openTray={openTray} setOpenTray={setOpenTray} />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <MenuButton
                onClick={skipToPrevSession}
                appearance='outline'
                className={`xl:h-12 xl:w-32 ${touch}`}
                data-slot='1'
                aria-label='Skip to previous'
              >
                <SkipBack className={`${iconSize}`} strokeWidth={2} />
              </MenuButton>
            </TooltipTrigger>
            <TooltipContent className='font-bold'>Skip To Prev</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
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

      {adjusting ? (
        <AdjustSlot sign={1} dimmed={false} openTray={openTray} setOpenTray={setOpenTray} />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <MenuButton
                onClick={skipToNextSession}
                appearance='outline'
                className={`xl:h-12 xl:w-32 ${touch}`}
                data-slot='4'
                aria-label='Skip to next'
              >
                <SkipForward className={`${iconSize}`} strokeWidth={2} />
              </MenuButton>
            </TooltipTrigger>
            <TooltipContent className='font-bold'>Skip To Next</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
