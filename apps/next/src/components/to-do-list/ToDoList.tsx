import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Toggle } from '@repo/ui/toggle'
import { NotebookPen, Plus } from 'lucide-react'
import { useTodoStore } from '~/store/useToDoStore'
import MenuButton from '../helper/MenuButtons'
import TaskList from '../to-do-list/TaskList'

export default function ToDoList() {
  const { toggleAdd } = useTodoStore()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <MenuButton>
          <NotebookPen />
        </MenuButton>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='min-h-[50vh] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:-ml-7 sm:min-h-[392px] sm:w-[392px] md:ml-0'
      >
        <TaskList />
        <div className="mt-10">
          <Toggle onClick={() => toggleAdd()} className='-ml-1 pt-1 pr-2 pl-1'>
            <Plus />
            <p>
              New Reminder
            </p>
          </Toggle>

        </div>

      </PopoverContent>
    </Popover>
  )
}
