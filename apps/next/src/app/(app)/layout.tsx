import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getUserSettings } from '~/lib/server/getUserSettings'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUserSettings()

  const queryClient = new QueryClient()
  queryClient.setQueryData(['userSettings'], settings)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TimerStoreProvider initialSettings={settings}>{children}</TimerStoreProvider>
    </HydrationBoundary>
  )
}
