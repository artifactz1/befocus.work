'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTimerStore } from '~/store/useTimerStore'
import useIsLandscape from '../helper/useIsMobileLandscape'

export default function SessionTitleDisplay() {
  const { isWorking, isRunning, workDuration, timeLeft } = useTimerStore()

  const text = isRunning
    ? isWorking
      ? 'Focus'
      : 'Break'
    : workDuration === timeLeft
      ? 'Be Focus'
      : 'Paused'

  const isLandscape = useIsLandscape()
  const isIdle = !isRunning

  return (
    <AnimatePresence mode='wait'>
      <motion.p
        key={text}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`text-right text-4xl tracking-tight ${isIdle ? 'font-bold italic text-foreground/85' : 'font-bold italic text-foreground'
          } ${isLandscape ? 'pt-10 sm:text-4xl' : 'sm:text-5xl'} lg:text-7xl`}
      >
        {text}
      </motion.p>
    </AnimatePresence>
  )
}
