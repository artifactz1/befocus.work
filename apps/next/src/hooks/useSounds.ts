'use client'

import { createId } from '@paralleldrive/cuid2'
import type { SoundType } from '@repo/api/db/schemas'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { useSession } from '~/lib/auth.client'
import { type DiscFinish, hideStarter, isStarterId, type ServerSound } from '~/lib/sounds/sounds'
import { useSoundsStore } from '~/store/useSoundsStore'

export interface NewSound {
  name: string
  url: string
  soundType: SoundType
  labelColor?: string | null
  labelImage?: 'thumbnail' | null
  discFinish?: DiscFinish
  // a resized label picture, uploaded once the sound row exists
  upload?: Blob
}

export const labelImageUrl = (id: string) =>
  api.user.sounds[':id'].label.$url({ param: { id } }).toString()

async function uploadLabel(id: string, image: Blob) {
  const res = await fetch(labelImageUrl(id), {
    method: 'PUT',
    body: image,
    headers: { 'Content-Type': image.type },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('upload failed')
  return (await res.json()) as ServerSound
}

export const useSound = () => {
  const queryClient = useQueryClient()

  return useMutation<ServerSound, Error, NewSound>({
    mutationKey: ['userSounds'],
    mutationFn: async ({ upload, ...sound }) => {
      const res = await api.user.sounds.$post({
        json: { id: createId(), isCustom: true, ...sound },
      })
      if (res.status === 409) throw new Error('You already have this sound.')
      if (!res.ok) throw new Error("Couldn't save this sound. Check your connection and try again.")
      const saved = (await res.json()) as ServerSound
      if (!upload) return saved
      try {
        return await uploadLabel(saved.id, upload)
      } catch {
        toast.error("Added, but the label picture couldn't be saved. It uses a colour for now.")
        return saved
      }
    },
    onSuccess: newSound => {
      queryClient.setQueryData<ServerSound[]>(['userSounds'], old => [...(old ?? []), newSound])
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
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
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
    },
    onError: (err: any) => {
      toast.error(`Error updating sound: ${err.message}`)
    },
  })
}

export const useDeleteUserSound = () => {
  const queryClient = useQueryClient()
  const { deleteSound } = useSoundsStore()

  return useMutation<void, Error, string, { prev?: ServerSound[]; name?: string }>({
    mutationFn: async id => {
      // Starters are built in, not DB rows: removal is remembered per browser.
      if (isStarterId(id)) return
      const res = await api.user.sounds[':id'].$delete({ param: { id } })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Failed to delete sound')
      }
    },
    onMutate: async id => {
      if (isStarterId(id)) return {}
      await queryClient.cancelQueries({ queryKey: ['userSounds'] })
      const prev = queryClient.getQueryData<ServerSound[]>(['userSounds'])
      queryClient.setQueryData<ServerSound[]>(['userSounds'], old => old?.filter(s => s.id !== id))
      return { prev, name: prev?.find(s => s.id === id)?.name }
    },
    onSuccess: (_, id) => {
      if (isStarterId(id)) {
        hideStarter(id)
        deleteSound(id)
      }
      toast.success('Sound deleted.')
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['userSounds'], ctx?.prev)
      toast.error(`Couldn't delete ${ctx?.name ?? 'sound'}. Try again.`)
    },
    onSettled: (_, __, id) => {
      if (!isStarterId(id)) queryClient.invalidateQueries({ queryKey: ['userSounds'] })
    },
  })
}

export const useUserSounds = () => {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['userSounds'],
    queryFn: async () => {
      const res = await api.user.sounds.$get()
      if (!res.ok) throw new Error('Failed to fetch user sounds')
      return res.json() as Promise<ServerSound[]>
    },
    enabled: Boolean(session),
    refetchOnWindowFocus: false,
  })
}
