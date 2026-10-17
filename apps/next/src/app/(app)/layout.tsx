import { DEFAULT_LOOK } from '@repo/types/look'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import CustomizePanel from '~/components/customize/CustomizePanel'
import { LookPaintScript } from '~/components/customize/LookPaintScript'
import RecordRoom from '~/components/records/RecordRoom'
import SessionCard from '~/components/settings/SessionCard'
import { lookToTokens } from '~/lib/customize/catalog'
import { getUserSettings } from '~/lib/server/getUserSettings'
import { CustomizeStoreProvider } from '~/store/useCustomizeStore'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUserSettings()
  const look = settings?.look ?? null

  const queryClient = new QueryClient()
  queryClient.setQueryData(['userSettings'], settings)

  // Tokens always passed for a signed-in user, so the script never reads the guest cache here.
  return (
    <>
      <LookPaintScript tokens={lookToTokens(look ?? DEFAULT_LOOK)} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TimerStoreProvider initialSettings={settings}>
          <CustomizeStoreProvider mode='account' initialLook={look}>
            {children}
            <CustomizePanel />
            <RecordRoom />
            <SessionCard />
          </CustomizeStoreProvider>
        </TimerStoreProvider>
      </HydrationBoundary>
    </>
  )
}
