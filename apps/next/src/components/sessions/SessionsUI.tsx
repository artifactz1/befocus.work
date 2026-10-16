'use client'

import { cn } from '@repo/ui/lib/utils'
import { useMemo } from 'react'
import { useTimerStore } from '~/store/useTimerStore'
import useIsLandscape from '../helper/useIsMobileLandscape'

type CellState = 'done' | 'now' | 'todo'

export default function SessionsUI() {
  const { sessions, currentSession, isWorking } = useTimerStore()

  const isLandscape = useIsLandscape()

  const indices = useMemo(() => Array.from({ length: sessions }, (_, i) => i), [sessions])

  const focusState = (index: number): CellState => {
    if (isWorking && index === currentSession - 1) return 'now'
    if (index <= currentSession - 1) return 'done'
    return 'todo'
  }

  const breakState = (index: number): CellState => {
    if (index < currentSession - 1) return 'done'
    if (!isWorking && index === currentSession - 1) return 'now'
    return 'todo'
  }

  return (
    <main data-sessions-ui>
      <div className='hidden h-[calc(11vh+var(--pad-y))] sm:block'>
        <div
          className={`mx-auto flex w-full flex-col items-center justify-center ${isLandscape ? 'space-y-1' : 'space-y-3'}`}
        >
          <p
            className={`${isLandscape ? 'text-lg' : 'text-2xl'} font-display font-bold text-dash tabular-nums`}
          >
            {currentSession} / {sessions}
          </p>
          <div className='space-y-1' aria-hidden>
            <div className='flex space-x-1'>
              {indices.map(index => (
                <div
                  key={`focus-${index}`}
                  data-state={focusState(index)}
                  className={cn(
                    'bf-cell',
                    `${isLandscape ? 'h-6 w-6' : 'h-12 w-12'} flex-1 lg:h-14 lg:w-14`,
                  )}
                />
              ))}
            </div>
            <div className='flex space-x-1'>
              {indices.map(index => (
                <div
                  key={`break-${index}`}
                  data-state={breakState(index)}
                  className={cn(
                    'bf-cell',
                    `${isLandscape ? 'h-6 w-6' : 'h-12 w-12'} flex-1 lg:h-14 lg:w-14`,
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='block sm:hidden'>
        <div className='flex w-full flex-col items-center justify-center space-y-1 sm:mx-auto sm:p-6 min-h-[120px]'>
          <div
            className='grid w-full max-w-xs gap-1'
            style={{
              gridTemplateColumns: `repeat(${Math.max(sessions, 4)}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
            }}
            aria-hidden
          >
            {indices.map(index => (
              <div
                key={`m-${index}`}
                data-state={focusState(index)}
                className='bf-cell aspect-square'
              />
            ))}
          </div>

          <div
            className='grid w-full max-w-xs gap-1'
            style={{
              gridTemplateColumns: `repeat(${Math.max(sessions, 4)}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
            }}
            aria-hidden
          >
            {indices.map(index => (
              <div
                key={`m-break-${index}`}
                data-state={breakState(index)}
                className='bf-cell aspect-square'
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
