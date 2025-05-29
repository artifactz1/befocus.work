'use client'

import type { Settings } from '@repo/api/db/schemas'
import { useEffect } from 'react'
import { useTimerStore } from '~/store/useTimerStore'

export default function DashboardShell({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: Settings | null
}) {
  const hydrateFromSettings = useTimerStore(state => state.hydrateFromSettings)
  const isHydrated = useTimerStore(state => state.isHydrated)

  useEffect(() => {
    if (!isHydrated && initialSettings) {
      hydrateFromSettings({
        workDuration: initialSettings.workDuration,
        breakDuration: initialSettings.breakDuration,
        sessions: initialSettings.numberOfSessions,
      })
    }
  }, [initialSettings, isHydrated, hydrateFromSettings])

  return <>{children}</>
}
