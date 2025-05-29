import { Button } from '@repo/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
// components/SessionCompleteModal.tsx
import { useEffect, useState } from 'react'
import { useTimerStore } from '~/store/useTimerStore'

export function SessionCompleteModal() {
  const { currentSession, sessions, resetAll } = useTimerStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (currentSession >= sessions + 0) {
      setShow(true)
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-xl shadow-2xl max-w-md w-full text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h2 className="text-2xl font-bold mb-4">🎉 Session Complete!</h2>
            <p className="mb-6">
              You’ve finished all {sessions} sessions. Great job!
            </p>
            <Button
              onClick={handleContinue}
              className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md hover:opacity-90 transition font-medium"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
