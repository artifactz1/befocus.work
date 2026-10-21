import { DEFAULT_LOOK } from '@repo/types/look'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import CustomizePanel from '~/components/customize/CustomizePanel'
import { LookPaintScript } from '~/components/customize/LookPaintScript'
import RecordRoom from '~/components/records/RecordRoom'
import SessionCard from '~/components/settings/SessionCard'
import TasksCard from '~/components/tasks/TasksCard'
import { lookToTokens } from '~/lib/customize/catalog'
import { getUserSettings } from '~/lib/server/getUserSettings'
import { getUserTasks } from '~/lib/server/getUserTasks'
import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'
import { TasksStoreProvider } from '~/store/useToDoStore'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [settings, tasks] = await Promise.all([getUserSettings(), getUserTasks()])
  const look = settings?.look ?? null

  const queryClient = new QueryClient()
  queryClient.setQueryData(['userSettings'], settings)

  // Tokens always passed for a signed-in user, so the script never reads the guest cache here.
  return (
    <>
      <LookPaintScript tokens={lookToTokens(look ?? DEFAULT_LOOK)} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TimerStoreProvider initialSettings={settings} mode='account'>
          <CustomizeStoreProvider mode='account' initialLook={look}>
            <TasksStoreProvider mode='account' initialTasks={tasks}>
              {children}
              <CustomizePanel />
              <RecordRoom />
              <TasksCard />
              <SessionCard />
            </TasksStoreProvider>
          </CustomizeStoreProvider>
        </TimerStoreProvider>
      </HydrationBoundary>
    </>
  )
}
