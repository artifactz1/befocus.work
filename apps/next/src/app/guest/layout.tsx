'use client'

import CustomizePanel from '~/components/customize/CustomizePanel'
import RecordRoom from '~/components/records/RecordRoom'
import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TimerStoreProvider initialSettings={null}>
      <CustomizeStoreProvider initialLook={null}>
        <div>{children}</div>
        <CustomizePanel />
        <RecordRoom />
      </CustomizeStoreProvider>
    </TimerStoreProvider>
  )
}
