// hooks/useUserSettings.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'

export type UserSettings = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
  userId: string
  id: string
}

export type UserSettingsInput = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
}

// Hook to fetch user settings
export const useUserSettings = () => {
  return useQuery<UserSettings | null>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await api.user.settings.$get()
      if (!response.ok) return null
      return await response.json()
    },
    // The server layout seeds this query via HydrationBoundary - never refetch on mount/focus.
    staleTime: Number.POSITIVE_INFINITY,
  })
}

// Hook to create user settings
export const useCreateUserSettings = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (settings: UserSettingsInput) => {
      const response = await api.user.settings.$post({
        json: settings,
      })
      if (!response.ok) {
        throw new Error('Failed to create settings')
      }
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
      toast('Session Settings created successfully', {
        description: 'Your preferences have been saved.',
      })
    },
    onError: (error) => {
      toast.error('Failed to create settings')
      console.error('Error creating settings:', error)
    },
  })
}

// Hook to update user settings
export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (settings: UserSettingsInput) => {
      const response = await api.user.settings.$put({
        json: settings,
      })
      if (!response.ok) {
        throw new Error('Failed to update settings')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
      toast('Session Settings updated successfully', {
        description: 'Your preferences have been saved.',
      })
    },
    onError: (error) => {
      toast.error('Failed to update settings')
      console.error('Error updating settings:', error)
    },
  })
}

// Combined hook to save settings (create or update based on existence).
// Tries PUT first; a 404 means the user has no settings row yet, so it falls
// back to POST. This avoids depending on useUserSettings' (possibly seeded-null,
// per D-08) cache state to decide create vs. update.
export const useSaveUserSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: UserSettingsInput) => {
      const putResponse = await api.user.settings.$put({
        json: settings,
      })
      if (putResponse.ok) {
        return await putResponse.json()
      }
      if (putResponse.status !== 404) {
        throw new Error('Failed to update settings')
      }

      const postResponse = await api.user.settings.$post({
        json: settings,
      })
      if (!postResponse.ok) {
        throw new Error('Failed to create settings')
      }
      return await postResponse.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
      toast('Session Settings saved successfully', {
        description: 'Your preferences have been updated.',
      })
    },
    onError: (error) => {
      toast.error('Failed to save settings')
      console.error('Error saving settings:', error)
    },
  })
}