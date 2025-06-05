'use client'

import { createId } from '@paralleldrive/cuid2'
import type { SoundType } from '@repo/api/db/schemas'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import type { Sound } from '~/store/useSoundsStore'; // or define a local type alias if needed
import { useSoundsStore } from '~/store/useSoundsStore'

export const useSound = ({
  name,
  url,
  type,
  onSuccessCallback,
}: {
  name: string
  url: string
  type: SoundType
  onSuccessCallback?: (newSound: any) => void
}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['userSounds'],
    mutationFn: async () => {

      const payload = {
        id: createId(),
        name,
        url,
        isCustom: true,
        soundType: type,
      }

      console.log('Payload:', payload)

      const res = await api.user.sounds.$post({
        json: payload
      })

      console.log('Status:', res.status)
      console.log('Response:', await res.text()) // avoid .json() in case of invalid JSON

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(message)
      }
      return res.json()
    },
    onSuccess: newSound => {
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
      toast.success('Sound added!')
      onSuccessCallback?.(newSound)
    },
    onError: (err: any) => {
      toast.error(`Error adding sound: ${err.message}`)
    },
  })
}

export const useUpdateUserSound = (soundId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['updateSound', soundId],
    mutationFn: async (newName: string) => {
      const res = await api.user.sounds.$put({
        json: { id: soundId, name: newName },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Failed to update sound')
      }
      return res.json()
    },
    onSuccess: () => {
      console.log("SUCESSFULLY UPDATED :", soundId)
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
    },
    onError: (err: any) => {
      console.log("ERROR UPDATING :", soundId)
      toast.error(`Error updating sound: ${err.message}`)
    },
  })
}

export const useDeleteUserSound = () => {
  const queryClient = useQueryClient()
  const { deleteSound } = useSoundsStore()

  return useMutation<void, Error, string>({
    mutationFn: async id => {
      const res = await api.user.sounds[':id'].$delete({ param: { id } })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Failed to delete sound')
      }
    },
    onSuccess: (_, id) => {
      deleteSound(id)
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
      toast.success('Sound deleted.')
    },
    onError: err => {
      toast.error(`Error deleting sound: ${err.message}`)
    },
  })
}

// Raw response type from the backend
interface RawSound {
  id: string
  name: string
  url: string
  isCustom: boolean
  soundType: 'alarm' | 'ambient' | 'bgMusic' | string // cast to correct type later
}

export const useUserSounds = () => {
  return useQuery({
    queryKey: ['userSounds'],
    queryFn: async () => {
      const res = await api.user.sounds.$get()
      if (!res.ok) throw new Error('Failed to fetch user sounds')
      return res.json() as Promise<RawSound[]>
    },
    select: (raw): Sound[] =>
      raw.map(
        (r): Sound => ({
          ...r,
          playing: false,
          volume: 0,
          soundType: r.soundType as 'alarm' | 'ambient' | 'bgMusic',
        }),
      ),
    refetchOnWindowFocus: false,
  })
}
