'use client'

import CustomizePanel from '~/components/customize/CustomizePanel'
import RecordRoom from '~/components/records/RecordRoom'
import SessionCard from '~/components/settings/SessionCard'
import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <TimerStoreProvider initialSettings={null} mode='guest'>
      <CustomizeStoreProvider mode='guest' initialLook={null}>
        <div>{children}</div>
        <CustomizePanel />
        <RecordRoom />
        <SessionCard guest />
      </CustomizeStoreProvider>
    </TimerStoreProvider>
  )
}
