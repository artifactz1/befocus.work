'use client'

import type { Task } from '@repo/types/tasks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api.client'

// Fetch user tasks
export const useUserTasks = () =>
  useQuery<Task[]>({
    queryKey: ['userTasks'],
    queryFn: async () => {
      const res = await api.user.tasks.$get()
      if (!res.ok) throw new Error('Failed to fetch user tasks')
      return res.json()
    },
    select: raw =>
      raw.map(task => ({
        ...task,
        editMode: false, // add frontend-only state
      })) satisfies Task[],
    refetchOnWindowFocus: false,
    enabled: false,
  })

// Create a new task
export const useCreateUserTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (text: string) => {
      const res = await api.user.tasks.$post({
        json: { text },
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTasks'] })
    },
  })
}
