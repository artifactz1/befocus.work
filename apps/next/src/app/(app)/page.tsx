'use client'
import { motion } from 'framer-motion'
import CommandMenu from '~/components/CommandMenu'
import AppBackground from '~/components/dashboard/AppBackground'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import { Stage } from '~/components/logs/Stage'

export default function Dashboard() {
  return (
    <div>
      <GlobalSoundsPlayer />
      <CommandMenu />
      <AppBackground />
      <motion.main
        className='continer px-auto relative z-10 flex h-screen w-screen flex-col items-center justify-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.25 }}
      >
        <Header />
        <Stage />
        <Footer />
      </motion.main>
    </div>
  )
}
