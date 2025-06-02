import { Button } from '@repo/ui/button'
import confetti from "canvas-confetti"
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTimerStore } from '~/store/useTimerStore'
import Divider from './helper/Divider'

export function SessionCompleteModal() {
  const { currentSession, sessions, resetAll } = useTimerStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (currentSession > sessions) {
      // Confetti fireworks function
      const triggerFireworks = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      };

      // Trigger fireworks first
      triggerFireworks()
      // Then show modal after a delay
      setTimeout(() => {
        setShow(true)
      }, 1000) // Show modal after fireworks start
    }
    console.log("CHECKK", currentSession, sessions);
  }, [currentSession, sessions])

  const handleContinue = () => {
    resetAll()       // Fully reset all session progress
    setShow(false)   // Close modal
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-xl shadow-2xl max-w-md w-full"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h2 className="text-4xl font-bold mb-4">🎉 Congratulations!</h2>
            <Divider />
            <p className="mb-2 text-lg font-semibold text-green-600 dark:text-green-400">
              All Sessions Complete!
            </p>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              You&apos;ve successfully finished all {sessions} sessions. Amazing work on your focus and dedication!
            </p>
            <Button
              onClick={handleContinue}
            >
              Start New Session
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}