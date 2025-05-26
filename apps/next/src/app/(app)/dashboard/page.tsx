'use client'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import Timer from '~/components/timer/Timer'
import { TimerInitializer } from '~/components/timer/TimerInitializer'

export default function Dashboard() {
  return (
    <div>
      <GlobalSoundsPlayer />
      <TimerInitializer />
      <main className='continer px-auto flex h-screen w-screen flex-col items-center justify-center'>
        <Header />
        <Timer />
        <Footer />
      </main>
    </div>
  )
}
