'use client'
import { motion } from 'framer-motion'
import CommandMenu from '~/components/CommandMenu'
import AppBackground from '~/components/dashboard/AppBackground'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { SessionCompleteModal } from '~/components/SessionCompleteModal'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import PrefetchUserTasks from '~/components/helper/PrefetchUserTasks'
import Timer from '~/components/timer/Timer'
import { TimerInitializer } from '~/components/timer/TimerInitializer'

export default function Dashboard() {
  return (
    <div>
      <GlobalSoundsPlayer />
      <TimerInitializer />
      <PrefetchUserTasks />
      <SessionCompleteModal />
      <CommandMenu />
      <AppBackground />
      <motion.main
        className='continer px-auto relative z-10 flex h-screen w-screen flex-col items-center justify-center'
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
