'use client'

import Footer from '~/components/Footer'
import GlobalSoundsPlayer from '~/components/GlobalSoundsPlayer'
import Header from '~/components/Header'
import Timer from '~/components/timer/Timer'

export default function App() {
  // TODO: update use of useSession with useQueryClient
  return (
    <div>
      <GlobalSoundsPlayer />
      <main className='continer px-auto flex h-screen w-screen flex-col items-center justify-center'>
        <Header />
        <Timer />
        <Footer />
      </main>
    </div>
  )
}
