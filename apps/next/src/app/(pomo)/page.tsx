'use client'

import Footer from '~/components/Footer'
import Header from '~/components/Header'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
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
