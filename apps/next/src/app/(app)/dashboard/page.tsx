"use client"
import Footer from '~/components/Footer';
import GlobalSoundsPlayer from '~/components/GlobalSoundsPlayer';
import Header from '~/components/Header';
import Timer from '~/components/timer/Timer';
import { TimerInitializer } from '~/components/timer/TimerInitializer';

export default function Dashboard() {

  return (
    <div>
      <TimerInitializer/>
      <GlobalSoundsPlayer />
      <main className="continer px-auto flex h-screen w-screen flex-col items-center justify-center">
        <Header />
        <Timer />
        <Footer />
      </main>
    </div>
  )
}