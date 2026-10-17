// hooks/useUserSettings.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'

export type UserSettings = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
  askBeforeStart: boolean
  userId: string
  id: string
}

export type UserSettingsInput = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
  askBeforeStart?: boolean
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

// Combined hook to save settings (create or update based on existence).
// Tries PUT first; a 404 means the user has no settings row yet, so it falls
// back to POST. This avoids depending on useUserSettings' (possibly seeded-null,
// per D-08) cache state to decide create vs. update.
export const useSaveUserSettings = (options?: { quiet?: boolean }) => {
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
      if (!options?.quiet) toast('Session settings saved')
    },
    onError: error => {
      toast.error("Couldn't save your session settings", {
        description: 'They apply to this session only. Check your connection and save again.',
      })
      console.error('Error saving settings:', error)
    },
  })
}
