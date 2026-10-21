'use client'

import { useEffect } from 'react'
import { useUserTasks } from '~/hooks/useTasks'
import { useTasksStoreApi } from '~/store/useToDoStore'

export default function PrefetchUserTasks() {
  const { refetch } = useUserTasks()
  const store = useTasksStoreApi()

  useEffect(() => {
    refetch().then(result => {
      if (result.data) store.getState().hydrateTasks(result.data)
    })
  }, [refetch, store])

  return null // no UI
}
