'use client'

import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TimerStoreProvider initialSettings={null}>
      <CustomizeStoreProvider initialLook={null}>
        <div>{children}</div>
      </CustomizeStoreProvider>
    </TimerStoreProvider>
  )
}
