'use client'

import { TimerStoreProvider } from '~/store/useTimerStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TimerStoreProvider initialSettings={null}>
      <div>{children}</div>
    </TimerStoreProvider>
  )
}
