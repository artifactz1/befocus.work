import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '~/lib/api.client'
import { useTimerStore } from '~/store/useTimerStore'

export const TimerInitializer = () => {
  const hydrateFromSettings = useTimerStore(state => state.hydrateFromSettings)

  const { data, isSuccess, isLoading, isError } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const res = await api.user.settings.$get()
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
  })

  useEffect(() => {
    if (isSuccess && data) {
      hydrateFromSettings({
        sessions: data.numberOfSessions,
        workDuration: data.workDuration,
        breakDuration: data.breakDuration,
      })
    }
  }, [isSuccess, data, hydrateFromSettings])

  return null
}
