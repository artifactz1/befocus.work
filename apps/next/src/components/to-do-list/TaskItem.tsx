import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { motion } from 'framer-motion'
import { Archive, ArchiveRestore } from 'lucide-react'
import { useTodoStore } from '~/store/useToDoStore'
import { useUpdateUserTask } from '~/hooks/useTasks'
import { useState } from 'react'


interface TaskItemProps {
  task: {
    id: number
    text: string
    completed: boolean
    editMode: boolean
    archived: boolean
  }
  handleChange: (id: number) => void
}

// export default function TaskItem({ task, handleChange }: TaskItemProps) {
//   const { editTask, toggleEditMode, archiveTask } = useTodoStore()

//   const updateTask = useUpdateUserTask()
//   const [originalText, setOriginalText] = useState(task.text)



//   return (
//     <div className='items-bottom flex space-x-2 border-b-2 py-2'>
//       <motion.div
//         whileTap={{ scale: 0.8 }}
//         className='flex items-center'
//       >

//         <Checkbox
//           checked={task.completed}
//           onCheckedChange={() => handleChange(task.id)}
//           className='peer mr-2'
//         />
//       </motion.div>
//       <motion.div
//         animate={{ x: task.completed ? [5, 0, 0] : 0 }}
//         transition={{ type: 'tween', duration: 1.2, ease: 'easeInOut' }}
//         className={`group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-1000 ${task.completed ? 'text-stone-500' : 'font-semibold'
//           }`}
//         onClick={e => {
//           if (e.detail === 1 && !task.editMode) {
//             toggleEditMode(task.id)
//           }
//         }}
//       >
//         {task.editMode ? (
//           <Input
//             type='text'
//             value={task.text}
//             autoFocus
//             onChange={e => editTask(task.id, e.target.value)}
//             onBlur={() => toggleEditMode(task.id)}
//             onKeyDown={e => e.key === 'Enter' && toggleEditMode(task.id)}
//             // className="w-full rounded border p-2 text-sm font-medium"
//             className='bg-transparent h-fit px-0 py-0 '
//           />
//         ) : (
//           <span className='relative inline-block'>
//             {task.text}
//             <span
//               className={`absolute left-0 top-1/2 h-[2px] transition-all duration-500 ${task.completed ? 'w-full bg-stone-500' : 'w-0 bg-white'
//                 }`}
//               style={{ transform: 'translateY(-50%)' }}
//             />
//           </span>
//         )}
//       </motion.div>

//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <div className='flex items-center opacity-0 transition-opacity hover:opacity-100'>
//               <Button variant='ghost' onClick={() => archiveTask(task.id)}>
//                 {task.archived ? (
//                   <ArchiveRestore strokeWidth={1.5} />
//                 ) : (
//                   <Archive strokeWidth={1.5} />
//                 )}
//               </Button>
//             </div>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>{task.archived ? 'Restore item' : 'Archive item'}</p>
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>



//       {/* <div className='flex items-center opacity-0 transition-opacity hover:opacity-100'>
//         <Button variant='ghost' onClick={() => archiveTask(task.id)}>
//           {task.archived ? <ArchiveRestore strokeWidth={1.5} /> : <Archive strokeWidth={1.5} />}
//         </Button>
//       </div> */}

//       {/* {task.archived ? (
//         <Button variant='ghost' onClick={() => archiveTask(task.id)}>
//           {task.archived ? <ArchiveRestore strokeWidth={1.5} /> : <Archive strokeWidth={1.5} />}
//         </Button>
//       ) : (
//         <Checkbox
//           checked={task.completed}
//           onCheckedChange={() => handleChange(task.id)}
//           className='peer mr-2'
//         />
//       )} */}
//     </div>
//   )
// }

export default function TaskItem({ task, handleChange }: TaskItemProps) {
  const { editTask, toggleEditMode, archiveTask, toggleTask  } = useTodoStore()
  const updateTask = useUpdateUserTask()

  // Store original text in case editing is canceled
  const [originalText, setOriginalText] = useState(task.text)

  return (
    <div className='items-bottom flex space-x-2 border-b-2 py-2'>
      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className='flex items-center'>
        {/* <Checkbox
          checked={task.completed}
          onCheckedChange={() => handleChange(task.id)}
          className='peer mr-2'
        /> */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => {
            toggleTask(task.id) // local update
            updateTask.mutate({
              id: task.id,
              updates: { completed: !task.completed }, // flip the value
            })
          }}
          className='peer mr-2'
        />
      </motion.div>

      <motion.div
        animate={{ x: task.completed ? [5, 0, 0] : 0 }}
        transition={{ type: 'tween', duration: 1.2, ease: 'easeInOut' }}
        className={`group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-1000 ${task.completed ? 'text-stone-500' : 'font-semibold'}`}
        onClick={e => {
          if (e.detail === 1 && !task.editMode) {
            setOriginalText(task.text) // Save original before editing
            toggleEditMode(task.id)
          }
        }}
      >
        {task.editMode ? (
          <Input
            type='text'
            value={task.text}
            autoFocus
            onChange={e => editTask(task.id, e.target.value)}
            onBlur={() => {
              toggleEditMode(task.id)

              // Avoid empty string or unchanged values
              if (task.text.trim() === '' || task.text === originalText) return

              updateTask.mutate({
                id: task.id,
                updates: { text: task.text },
              })
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                toggleEditMode(task.id)

                if (task.text.trim() === '' || task.text === originalText) return

                updateTask.mutate({
                  id: task.id,
                  updates: { text: task.text },
                })
              }
            }}
            className='bg-transparent h-fit px-0 py-0'
          />
        ) : (
          <span className='relative inline-block'>
            {task.text}
            <span
              className={`absolute left-0 top-1/2 h-[2px] transition-all duration-500 ${
                task.completed ? 'w-full bg-stone-500' : 'w-0 bg-white'
              }`}
              style={{ transform: 'translateY(-50%)' }}
            />
          </span>
        )}
      </motion.div>

      {/* Archive Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center opacity-0 transition-opacity hover:opacity-100'>
              {/* <Button variant='ghost' onClick={() => archiveTask(task.id)}>

                {task.archived ? (
                  <ArchiveRestore strokeWidth={1.5} />
                ) : (
                  <Archive strokeWidth={1.5} />
                )}
              </Button> */}

              <Button
                variant='ghost'
                onClick={() => {
                  archiveTask(task.id) // local toggle
                  updateTask.mutate({
                    id: task.id,
                    updates: { archived: !task.archived },
                  })
                }}
              >
                {task.archived ? (
                  <ArchiveRestore strokeWidth={1.5} />
                ) : (
                  <Archive strokeWidth={1.5} />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{task.archived ? 'Restore item' : 'Archive item'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}