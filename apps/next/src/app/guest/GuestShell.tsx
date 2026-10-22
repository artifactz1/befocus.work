'use client'

import CustomizePanel from '~/components/customize/CustomizePanel'
import RecordRoom from '~/components/records/RecordRoom'
import SessionCard from '~/components/settings/SessionCard'
import TasksCard from '~/components/tasks/TasksCard'
import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'
import { TasksStoreProvider } from '~/store/useToDoStore'

export default function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <TimerStoreProvider initialSettings={null} mode='guest'>
      <CustomizeStoreProvider mode='guest' initialLook={null}>
        <TasksStoreProvider mode='guest' initialTasks={null}>
          <div>{children}</div>
          <CustomizePanel />
          <RecordRoom />
          <TasksCard />
          <SessionCard guest />
        </TasksStoreProvider>
      </CustomizeStoreProvider>
    </TimerStoreProvider>
  )
}
