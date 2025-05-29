import DashboardShell from '~/hooks/DashboardShell'
import { getUserSettings } from '~/lib/server/getUserSettings'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server action of getting settings
  const data = await getUserSettings()

  console.log("FETCHED FROM SERVER COMPONENT", data)

  return (
    <DashboardShell initialSettings={data}>
      {children}
    </DashboardShell>
  )
}
