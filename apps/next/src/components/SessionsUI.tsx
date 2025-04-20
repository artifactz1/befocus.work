'use client'

import { useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '~/lib/utils'
import { useTimerStore } from '~/store/useTimerStore'
import useIsLandscape from './useIsMobileLandscape'

export default function SessionsUI() {
  const { sessions, currentSession, isWorking, timeLeft, workDuration, breakDuration } =
    useTimerStore()

  const isLandscape = useIsLandscape() // Get Zustand state & function

  const opacitySession = Math.round((1 - timeLeft / workDuration) * 100) // Clamp between 0 and 1
  const opacitySessionBrk = Math.round((1 - timeLeft / breakDuration) * 100) // Clamp between 0 and 1

  // Map opacitySession to Tailwind opacity classes
  // const getOpacityClass = (opacity: number) => {
  //   if (opacity <= 0) return "";
  //   if (opacity <= 10) return "bg-pink-500/10 ";
  //   if (opacity <= 20) return "bg-pink-500/20 ";
  //   if (opacity <= 30) return "bg-pink-500/30 ";
  //   if (opacity <= 40) return "bg-pink-500/40 ";
  //   if (opacity <= 50) return "bg-pink-500/50 ";
  //   if (opacity <= 60) return "bg-pink-500/60 ";
  //   if (opacity <= 70) return "bg-pink-500/70 ";
  //   if (opacity <= 80) return "bg-pink-500/80 ";
  //   if (opacity <= 90) return "bg-pink-500/90 ";
  //   return "bg-pink-500 ";
  // };

  // const opacityClass = getOpacityClass(opacitySession);
  // const opacityClassBrk = getOpacityClass(opacitySessionBrk);

  const sessionKeys = useMemo(() => Array.from({ length: sessions }, () => uuidv4()), [sessions])

  return (
    <main>
      <div className='hidden h-[15vh] sm:block'>
        {/* <div className="mx-auto flex w-full flex-col items-center justify-center space-y-3"> */}
        <div
          className={`mx-auto flex w-full flex-col items-center justify-center ${isLandscape ? 'space-y-1' : 'space-y-3'}`}
        >
          <p className={`${isLandscape ? 'text-lg' : 'text-2xl'} font-semibold`}>
            {currentSession} / {sessions}
          </p>
          <div className='space-y-1'>
            <div className='flex space-x-1'>
              {sessionKeys.map((key, index) => (
                <div
                  key={key}
                  className={cn(
                    `${isLandscape ? 'h-6 w-6' : 'h-12 w-12'} flex-1 rounded-lg border-2 transition-all duration-300 lg:h-14 lg:w-14`,
                    'border-gray-300 dark:border-white/80', // Light mode: black, Dark mode: white
                    index <= currentSession - 1 // Completed work sessions
                      ? isWorking && currentSession - 1 === index
                        ? // ? `${opacityClass}`
                          'bg-pink-500'
                        : 'bg-green-500'
                      : '', // No color if not completed
                  )}
                />
              ))}
            </div>
            <div className='flex space-x-1'>
              {sessionKeys.map((key, index) => (
                <div
                  key={key}
                  className={cn(
                    `${isLandscape ? 'h-6 w-6' : 'h-12 w-12'} flex-1 rounded-lg border-2 transition-all duration-300 lg:h-14 lg:w-14`,
                    'border-gray-300 dark:border-white/80', // Light mode: black, Dark mode: white
                    index < currentSession - 1 // Completed break sessions
                      ? 'bg-green-500'
                      : !isWorking && currentSession - 1 === index // Current break session
                        ? // ? `${opacityClassBrk}`
                          'bg-pink-500'
                        : 'bg-transparent',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='block sm:hidden'>
        <div className='flex w-full flex-col items-center justify-center space-y-1 sm:mx-auto sm:p-6'>
          <div
            className='grid w-full gap-1'
            style={{
              gridTemplateColumns: `repeat(${sessions}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
            }}
          >
            {sessionKeys.map((key, index) => (
              <div
                key={key}
                className={cn(
                  'aspect-square rounded-lg border-2 transition-all duration-300',
                  'border-gray-300 dark:border-white/80',
                  index <= currentSession - 1
                    ? isWorking && currentSession - 1 === index
                      ? // ? `${opacityClass}`
                        'bg-pink-500'
                      : 'bg-green-500'
                    : '',
                )}
              />
            ))}
          </div>

          <div
            className='grid w-full gap-1'
            style={{
              gridTemplateColumns: `repeat(${sessions}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
            }}
          >
            {sessionKeys.map((key, index) => (
              <div
                key={key}
                className={cn(
                  'aspect-square rounded-lg border-2 transition-all duration-300',
                  'border-gray-300 dark:border-white/80',
                  index < currentSession - 1
                    ? 'bg-green-500'
                    : !isWorking && currentSession - 1 === index
                      ? // ? `${opacityClassBrk}`
                        'bg-pink-500'
                      : 'bg-transparent',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
