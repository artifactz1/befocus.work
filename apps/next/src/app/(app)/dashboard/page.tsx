'use client'
import { motion } from 'framer-motion'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
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

// 'use client'

// import { motion } from 'framer-motion'
// import { useEffect, useState } from 'react'
// import Footer from '~/components/Footer'
// import Header from '~/components/Header'
// import LoadingAnimation from '~/components/LoadingAnimation'
// import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
// import PrefetchUserTasks from '~/components/helper/PrefetchUserTasks'
// import Timer from '~/components/timer/Timer'
// import { TimerInitializer } from '~/components/timer/TimerInitializer'

// export default function Dashboard() {
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     const timer = setTimeout(() => setIsLoading(false), 1000)
//     return () => clearTimeout(timer)
//   }, [])

//   return (
//     <>

//       <GlobalSoundsPlayer />
//       <TimerInitializer />
//       <PrefetchUserTasks />

//       <motion.main
//         className="container px-auto flex h-screen w-screen flex-col items-center justify-center"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: isLoading ? 0 : 1 }}
//         transition={{ duration: 0.6, ease: 'easeOut' }}
//       >
//         <Header />
//         <Timer />
//         <Footer />
//       </motion.main>
//     </>
//   )
// }
