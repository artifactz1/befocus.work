import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import CustomizePanel from '~/components/customize/CustomizePanel'
import RecordRoom from '~/components/records/RecordRoom'
import { getUserSettings } from '~/lib/server/getUserSettings'
import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUserSettings()

  const queryClient = new QueryClient()
  queryClient.setQueryData(['userSettings'], settings)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TimerStoreProvider initialSettings={settings}>
        <CustomizeStoreProvider initialLook={null}>
          {children}
          <CustomizePanel />
          <RecordRoom />
        </CustomizeStoreProvider>
      </TimerStoreProvider>
    </HydrationBoundary>
  )
}
