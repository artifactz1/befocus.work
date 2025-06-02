// 'use client'

// import { useEffect, useRef } from 'react'
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { useTimerStore } from '~/store/useTimerStore'
// import { api } from '~/lib/api.client'
// import { toast } from 'sonner'

// type UserSettings = {
//   workDuration: number
//   breakDuration: number
//   numberOfSessions: number
//   userId: string
//   id: string
// }

// export const useTimer = () => {
//   const queryClient = useQueryClient()
//   const hydrateFromSettings = useTimerStore(state => state.hydrateFromSettings)
//   const updateSettingsStore = useTimerStore(state => state.updateSettings)
//   const resetTimer = useTimerStore(state => state.reset)

//   const hydratedRef = useRef(false)

//   // 1. Fetch user settings
//   const { data } = useQuery<UserSettings | null>({
//     queryKey: ['userSettings'],
//     queryFn: async () => {
//       const response = await api.user.settings.$get()
//       if (!response.ok) return null
//       return await response.json()
//     },
//   })

//   // 2. Hydrate Zustand store once
//   useEffect(() => {
//     if (data && !hydratedRef.current) {
//       hydrateFromSettings({
//         workDuration: data.workDuration,
//         breakDuration: data.breakDuration,
//         sessions: data.numberOfSessions,
//       })
//       hydratedRef.current = true
//     }
//   }, [data, hydrateFromSettings])

//   // 3. Create new user settings
//   const createSettings = async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
//     const response = await api.user.settings.$post({
//       json: settings,
//     })
//     if (!response.ok) throw new Error('Failed to create user settings')
//     return await response.json()
//   }

//   // 4. Update existing settings
//   const updateSettings = async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
//     const response = await api.user.settings.$put({
//       json: settings,
//     })
//     if (!response.ok) throw new Error('Failed to update user settings')
//     return await response.json()
//   }

//   // 5. Mutation for saving (create or update based on existing data)
//   const saveSettings = useMutation({
//     mutationKey: ['userSettings'],
//     mutationFn: async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
//       if (!data) {
//         return await createSettings(settings)
//       }
//       return await updateSettings(settings)
//     },
//     onSuccess: () => {
//       toast('Session Settings has been saved', {
//         description: 'Your preferences have been updated.',
//       })
//       queryClient.invalidateQueries({ queryKey: ['userSettings'] })
//     },
//     onError: error => {
//       toast.error('Failed to save settings')
//       console.error('Save error:', error)
//     },
//   })

//   // 6. Helper function to save + sync Zustand
//   const saveAndSync = async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
//     await saveSettings.mutateAsync(settings)
//     updateSettingsStore('workDuration', settings.workDuration)
//     updateSettingsStore('breakDuration', settings.breakDuration)
//     updateSettingsStore('sessions', settings.numberOfSessions)
//     resetTimer()
//   }

//   return {
//     data,
//     saveSettings: saveAndSync,
//   }
// }

'use client'
import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTimerStore } from '~/store/useTimerStore'
import { api } from '~/lib/api.client'
import { toast } from 'sonner'

type UserSettings = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
  userId: string
  id: string
}

export const useTimer = () => {
  const queryClient = useQueryClient()
  const hydrateFromSettings = useTimerStore(state => state.hydrateFromSettings)
  const updateSettingsStore = useTimerStore(state => state.updateSettings)
  const resetTimer = useTimerStore(state => state.reset)
  const timerState = useTimerStore(state => ({
    timeLeft: state.timeLeft,
    workDuration: state.workDuration,
    isRunning: state.isRunning,
  }))

  const hydratedRef = useRef(false)

  // 1. Fetch user settings
  const { data } = useQuery<UserSettings | null>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await api.user.settings.$get()
      if (!response.ok) return null
      return await response.json()
    },
  })

  // 2. Hydrate Zustand store once, but preserve active timer sessions
  useEffect(() => {
    if (data && !hydratedRef.current) {
      // Check if localStorage has been restored first (small delay to ensure Timer component has run)
      const timer = setTimeout(() => {
        hydrateFromSettings({
          workDuration: data.workDuration,
          breakDuration: data.breakDuration,
          sessions: data.numberOfSessions,
        })
        hydratedRef.current = true
      }, 100) // Small delay to let localStorage restoration happen first

      return () => clearTimeout(timer)
    }
  }, [data, hydrateFromSettings])

  // 3. Create new user settings
  const createSettings = async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
    const response = await api.user.settings.$post({
      json: settings,
    })
    if (!response.ok) throw new Error('Failed to create user settings')
    return await response.json()
  }

  // 4. Update existing settings
  const updateSettings = async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
    const response = await api.user.settings.$put({
      json: settings,
    })
    if (!response.ok) throw new Error('Failed to update user settings')
    return await response.json()
  }

  // 5. Mutation for saving (create or update based on existing data)
  const saveSettings = useMutation({
    mutationKey: ['userSettings'],
    mutationFn: async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
      if (!data) {
        return await createSettings(settings)
      }
      return await updateSettings(settings)
    },
    onSuccess: () => {
      toast('Session Settings has been saved', {
        description: 'Your preferences have been updated.',
      })
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
    },
    onError: error => {
      toast.error('Failed to save settings')
      console.error('Save error:', error)
    },
  })

  // 6. Helper function to save + sync Zustand
  const saveAndSync = async (settings: Omit<UserSettings, 'id' | 'userId'>) => {
    await saveSettings.mutateAsync(settings)
    updateSettingsStore('workDuration', settings.workDuration)
    updateSettingsStore('breakDuration', settings.breakDuration)
    updateSettingsStore('sessions', settings.numberOfSessions)
    resetTimer()
  }

  return {
    data,
    saveSettings: saveAndSync,
  }
}