'use client'

import dynamic from 'next/dynamic'
// import CommandMenu from '~/components/CommandMenu'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { SessionCompleteModal } from '~/components/SessionCompleteModal'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import Timer from '~/components/timer/Timer'

export default function App() {
  // TODO: update use of useSession with useQueryClient

  const CommandMenu = dynamic(() => import('~/components/CommandMenu'), { ssr: false })
  return (
    <div>
      <GlobalSoundsPlayer />
      <SessionCompleteModal />
      <CommandMenu />
      <main className='continer px-auto flex h-screen w-screen flex-col items-center justify-center'>
        <Header />
        <Timer />
        <Footer />
      </main>
    </div>
  )
}
