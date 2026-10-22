'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTimerStore } from '~/store/useTimerStore'
import useIsLandscape from '../helper/useIsMobileLandscape'

export default function SessionTitleDisplay() {
  const { isWorking, isRunning, status } = useTimerStore()

  // From the run status: a block lengthened in the plan never reads Paused before it starts
  const text =
    isRunning || status === 'ended'
      ? isWorking
        ? 'Focus'
        : 'Break'
      : status === 'paused'
        ? 'Paused'
        : 'Be Focus'

  const isLandscape = useIsLandscape()
  const isIdle = !isRunning && status !== 'ended'

  return (
    <AnimatePresence mode='wait'>
      <motion.p
        key={text}
        animate={{ opacity: isIdle ? 0.85 : 1, y: 0 }}
        exit={{ opacity: 0, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`text-right text-4xl tracking-tight font-display font-bold italic text-dash ${isLandscape ? 'pt-10 sm:text-4xl' : 'sm:text-5xl'} lg:text-7xl`}
      >
        {text}
      </motion.p>
    </AnimatePresence>
  )
}
