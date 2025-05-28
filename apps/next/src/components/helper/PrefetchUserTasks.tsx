'use client'

import { useEffect } from 'react'
import { useUserTasks } from '~/hooks/useTasks'
import { useTodoStore } from '~/store/useToDoStore'

export default function PrefetchUserTasks() {
  const { refetch } = useUserTasks()
  const { setTasks } = useTodoStore()

  useEffect(() => {
    refetch().then(result => {
      if (result.data) {
        setTasks(result.data)
      }
    })
  }, [refetch, setTasks])

  return null // no UI
}
