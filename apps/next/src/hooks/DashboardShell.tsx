'use client'

import { useEffect } from 'react'
import { useTimerStore } from '~/store/useTimerStore'

type UserSettings = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
}

export default function DashboardShell({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: UserSettings
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
