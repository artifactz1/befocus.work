import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type Task = {
  id: number
  text: string
  completed: boolean
  editMode: boolean
  archived: boolean
  createdAt: string
  userId: string
}

export function useTasks() {
  const queryClient = useQueryClient()

  // ⏬ GET /user/tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/user/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    },
  })

  // ➕ POST /user/tasks
  const createTask = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/user/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // 📝 PUT /user/tasks/:id
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      const res = await fetch(`/api/user/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // ❌ DELETE /user/tasks/:id
  const deleteTask = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/user/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  }
}
