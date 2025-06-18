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

// Combined hook to save settings (create or update based on existence)
export const useSaveUserSettings = () => {
  const queryClient = useQueryClient()
  const { data: existingSettings } = useUserSettings()
  
  return useMutation({
    mutationFn: async (settings: UserSettingsInput) => {
      if (existingSettings) {
        // Update existing settings
        const response = await api.user.settings.$put({
          json: settings,
        })
        if (!response.ok) {
          throw new Error('Failed to update settings')
        }
        return response
      }  
        // Create new settings
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