'use client'

import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
// import CommandMenu from '~/components/CommandMenu'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { SessionCompleteModal } from '~/components/SessionCompleteModal'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import Timer from '~/components/timer/Timer'

const INTRO_FLAG = 'befocus.guestIntroShown'

export default function App() {
  // TODO: update use of useSession with useQueryClient

  const CommandMenu = dynamic(() => import('~/components/CommandMenu'), { ssr: false })

  const [showIntro, setShowIntro] = useState(false)
  const [introDone, setIntroDone] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const alreadyShown = localStorage.getItem(INTRO_FLAG) === '1'
    if (!alreadyShown) {
      setShowIntro(true)
      setIntroDone(false)
      const t = setTimeout(() => {
        setShowIntro(false)
        localStorage.setItem(INTRO_FLAG, '1')
      }, 1600)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div>
      <GlobalSoundsPlayer />
      <SessionCompleteModal />
      <CommandMenu />

      <AnimatePresence onExitComplete={() => setIntroDone(true)}>
        {showIntro && (
          <motion.div
            key='intro'
            className='fixed inset-0 z-50 flex items-center justify-center bg-background'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.h1
              className='text-7xl font-semibold tracking-tight sm:text-9xl'
              initial={{ opacity: 0, filter: 'blur(16px)', scale: 1.15 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              Be Focus
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {introDone && (
        <motion.main
          className='continer px-auto flex h-screen w-screen flex-col items-center justify-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.25 }}
        >
          <Header />
          <Timer />
          <Footer />
        </motion.main>
      )}
    </div>
  )
}
