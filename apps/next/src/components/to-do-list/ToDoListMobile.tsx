'use client'
import { Button } from '@repo/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/drawer'
import { Separator } from '@repo/ui/separator'
import { Toggle } from '@repo/ui/toggle'
import { NotebookPen, Plus } from 'lucide-react'
import { useTodoStore } from '~/store/useToDoStore'
import TaskList from '../to-do-list/TaskList'

export default function ToDoListMobile() {
  const { toggleAdd } = useTodoStore()

  return (
    <main className='block sm:hidden'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant='outline' size='lg' className='lg:h-12 lg:w-32'>
            <NotebookPen />
          </Button>
        </DrawerTrigger>
        <DrawerContent className='px-2'>
          <DrawerHeader>
            <DrawerTitle className='mx-1'>
              <NotebookPen />
              <div className='mb-2 mt-4 text-left text-lg font-bold'>befocus/todolist</div>
              <Separator className='mt-4 bg-white' />
            </DrawerTitle>
          </DrawerHeader>

          <div className='px-5 '>
            <TaskList />
          </div>

          <DrawerFooter className="flex justify-start pl-4 pb-4">
            {/* <Button onClick={() => toggleAdd()} className='absolute bottom-6 right-6'>
              <Plus />
            </Button> */}
            <Toggle onClick={() => toggleAdd()} className='flex items-center w-fit '>
              <Plus />
              <p>New Reminder</p>
            </Toggle>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  )
}
