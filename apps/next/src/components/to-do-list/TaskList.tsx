// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/accordion'
// import { Checkbox } from '@repo/ui/checkbox'
// import { Input } from '@repo/ui/input'
// import { Separator } from '@repo/ui/separator'
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { stagger, useAnimate } from 'framer-motion'
// import { NotebookPen } from 'lucide-react'
// import { useEffect, useState } from 'react'
// import { api } from '~/lib/api.client'
// import { useTodoStore } from '~/store/useToDoStore'; // Zustand store
// import TaskItem from '../to-do-list/TaskItem'

// export const useCreateUserTask = () => {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: async (text: string) => {
//       const res = await api.user.tasks.$post({
//         json: {
//           text,
//         }
//       })
//       if (!res.ok) throw new Error('Failed to create task')
//       return res.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['userTasks'] })
//     },
//   })
// }

// export const useUserTasks = () =>
//   useQuery({
//     queryKey: ['userTasks'],
//     queryFn: async () => {
//       const res = await api.user.tasks.$get()
//       if (!res.ok) throw new Error('Failed to fetch user tasks')
//       return res.json()
//     },
//     select: raw =>
//       raw.map(task => ({
//         ...task,
//         editMode: false, // frontend-only state
//       })),
//     refetchOnWindowFocus: false,
//     enabled: false,
//   })

// export default function TaskList() {
//   const [ref, animate] = useAnimate()
//   const [newTask, setNewTask] = useState('')
//   const { addMode, addTask, toggleAdd, toggleTask, tasks, setTasks } = useTodoStore()

//   function handleChange(id: number) {
//     toggleTask(id)
//   }

//   useEffect(() => {
//     if (tasks.length === 0) return
//     if (!tasks.every(task => task.completed)) return

//     const timeout = setTimeout(() => {
//       const peers = document.querySelectorAll('.peer')
//       if (peers.length === 0) return

//       const random = Math.random()
//       if (random < 1 / 3) {
//         animate('.peer', { scale: [1, 1.25, 1] }, { duration: 0.35, delay: stagger(0.075) })
//       } else if (random < 2 / 3) {
//         animate('.peer', { x: [0, 2, -2, 0] }, { duration: 0.4, delay: stagger(0.1) })
//       } else {
//         animate('.peer', { rotate: [0, 10, -10, 0] }, { duration: 0.5, delay: stagger(0.1) })
//       }
//     }, 50)

//     return () => clearTimeout(timeout)
//   }, [tasks, animate])

//   // function handleAddTask() {
//   //   if (newTask.trim() !== '') {
//   //     addTask(newTask)
//   //     createTaskMutation.mutate(newTask)
//   //     setNewTask('')
//   //   }
//   // }

//   function handleAddTask() {
//     if (newTask.trim() !== '') {
//       createTaskMutation.mutate(newTask)
//       addTask(newTask)
//       setNewTask('')
//     }
//   }

//   const { data: userTasks } = useUserTasks()
//   // const existing = useTodoStore.getState().tasks

//   // useEffect(() => {
//   //   if (!userTasks) return

//   //   for (const task of userTasks) {
//   //     const alreadyExists = existing.some(t => t.id === task.id)
//   //     if (!alreadyExists) {
//   //       addTask(task.text)
//   //     }
//   //   }
//   // }, [userTasks, addTask, existing])

//   useEffect(() => {
//     if (userTasks) {
//       setTasks(userTasks)
//     }
//   }, [userTasks, setTasks])



//   const createTaskMutation = useCreateUserTask();


//   return (
//     <div className='h-fill'>
//       <div className='hidden sm:block'>
//         <NotebookPen />
//         <div className='mb-2 mt-4 text-lg font-bold'>befocus/todolist</div>
//         <Separator className='my-4 bg-white' />
//       </div>

//       <div className='sm:flex sm:min-h-full sm:flex-col sm:items-center sm:justify-center'>
//         <div className='flex w-full flex-col md:max-w-sm'>
//           <div>

//             {/* Add Mode */}
//             {addMode && (
//               <div className='flex w-full items-center border-b-2 py-2'>
//                 <Checkbox className='peer mr-2' />
//                 <Input
//                   type='text'
//                   placeholder='Add a task...'
//                   value={newTask}
//                   onChange={e => setNewTask(e.target.value)}
//                   onKeyDown={e => {
//                     if (e.key === 'Enter') {
//                       handleAddTask()
//                       toggleAdd()
//                     }
//                   }}
//                   onBlur={() => {
//                     handleAddTask()
//                     toggleAdd()
//                   }}
//                   className='rounded-0 border-input-0 border-0 px-4 focus-visible:ring-0'
//                 />
//               </div>
//             )}
//           </div>

//           {/* List of known tasks */}
//           <div ref={ref} className='w-full pl-1'>
//             {tasks
//               .filter(task => !task.archived)
//               .map(task => (
//                 <TaskItem key={task.id} task={task} handleChange={handleChange} />
//               ))}
//           </div>

//           {/* Archived Tasks */}
//           {tasks.some(task => task.archived) && (
//             <Accordion type='single' collapsible>
//               <AccordionItem value='item-1' className='border-0'>
//                 <AccordionTrigger className='font-bold'>Archived</AccordionTrigger>
//                 <AccordionContent className='pl-1'>
//                   <div ref={ref}>
//                     {tasks
//                       .filter(task => task.archived)
//                       .map(task => (
//                         <TaskItem key={task.id} task={task} handleChange={handleChange} />
//                       ))}
//                   </div>
//                 </AccordionContent>
//               </AccordionItem>
//             </Accordion>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/accordion'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Separator } from '@repo/ui/separator'
import { stagger, useAnimate } from 'framer-motion'
import { NotebookPen } from 'lucide-react'
import { useEffect, useState } from 'react'
import TaskItem from '../to-do-list/TaskItem'
import { useTodoStore } from '~/store/useToDoStore'
import { useCreateUserTask, useUserTasks } from '~/hooks/useTasks'

export default function TaskList() {
  const [ref, animate] = useAnimate()
  const [newTask, setNewTask] = useState('')
  const { addMode, addTask, toggleAdd, toggleTask, tasks, setTasks } = useTodoStore()
  const createTaskMutation = useCreateUserTask()
  const { data: userTasks } = useUserTasks()

  useEffect(() => {
    if (userTasks) {
      setTasks(userTasks)
    }
  }, [userTasks, setTasks])

  function handleChange(id: number) {
    toggleTask(id)
  }

  function handleAddTask() {
    if (newTask.trim() !== '') {
      createTaskMutation.mutate(newTask)
      addTask(newTask)
      setNewTask('')
    }
  }

  useEffect(() => {
    if (tasks.length === 0) return
    if (!tasks.every(task => task.completed)) return

    const timeout = setTimeout(() => {
      const peers = document.querySelectorAll('.peer')
      if (peers.length === 0) return

      const random = Math.random()
      if (random < 1 / 3) {
        animate('.peer', { scale: [1, 1.25, 1] }, { duration: 0.35, delay: stagger(0.075) })
      } else if (random < 2 / 3) {
        animate('.peer', { x: [0, 2, -2, 0] }, { duration: 0.4, delay: stagger(0.1) })
      } else {
        animate('.peer', { rotate: [0, 10, -10, 0] }, { duration: 0.5, delay: stagger(0.1) })
      }
    }, 50)

    return () => clearTimeout(timeout)
  }, [tasks, animate])

  return (
    <div className='h-fill'>
      <div className='hidden sm:block'>
        <NotebookPen />
        <div className='mb-2 mt-4 text-lg font-bold'>befocus/todolist</div>
        <Separator className='my-4 bg-white' />
      </div>

      <div className='sm:flex sm:min-h-full sm:flex-col sm:items-center sm:justify-center'>
        <div className='flex w-full flex-col md:max-w-sm'>
          <div>
            {addMode && (
              <div className='flex w-full items-center border-b-2 py-2'>
                <Checkbox className='peer mr-2' />
                <Input
                  type='text'
                  placeholder='Add a task...'
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddTask()
                      toggleAdd()
                    }
                  }}
                  onBlur={() => {
                    handleAddTask()
                    toggleAdd()
                  }}
                  className='rounded-0 border-input-0 border-0 px-4 focus-visible:ring-0'
                />
              </div>
            )}
          </div>

          <div ref={ref} className='w-full pl-1'>
            {tasks
              .filter(task => !task.archived)
              .map(task => (
                <TaskItem key={task.id} task={task} handleChange={handleChange} />
              ))}
          </div>

          {tasks.some(task => task.archived) && (
            <Accordion type='single' collapsible>
              <AccordionItem value='item-1' className='border-0'>
                <AccordionTrigger className='font-bold'>Archived</AccordionTrigger>
                <AccordionContent className='pl-1'>
                  <div ref={ref}>
                    {tasks
                      .filter(task => task.archived)
                      .map(task => (
                        <TaskItem key={task.id} task={task} handleChange={handleChange} />
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  )
}
