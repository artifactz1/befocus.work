'use client'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
// import CommandMenu from '~/components/CommandMenu'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { SessionCompleteModal } from '~/components/SessionCompleteModal'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import PrefetchUserTasks from '~/components/helper/PrefetchUserTasks'
import Timer from '~/components/timer/Timer'
import { TimerInitializer } from '~/components/timer/TimerInitializer'
import { useTimerStore } from '~/store/useTimerStore'

export default function Dashboard() {

  const { currentSession, sessions } = useTimerStore()
  console.log('Dashboard store state:', currentSession, sessions)
  const CommandMenu = dynamic(() => import('~/components/CommandMenu'), { ssr: false })


  return (
    <div>
      <GlobalSoundsPlayer />
      <TimerInitializer />
      <PrefetchUserTasks />
      <SessionCompleteModal />
      <CommandMenu />
      <motion.main className='continer px-auto flex h-screen w-screen flex-col items-center justify-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.25 }}
      >
        <Header />
        <Timer />
        <Footer />
      </motion.main>
    </div>
  )
}