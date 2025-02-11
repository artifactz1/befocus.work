import { NotebookPen, Plus } from 'lucide-react';
import React from 'react'
import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import TaskList from './task-list';
import { useTodoStore } from '~/store/useToDoStore';

export default function ToDoList() {

  const {toggleAdd } = useTodoStore();
  return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="lg" className="lg:h-12 lg:w-32">
              <NotebookPen />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="min-h-[50vh] w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 lg:min-h-[500px] lg:w-[392px]"
          >
            <TaskList />
            <Button
              onClick={() => toggleAdd()}
              className="absolute bottom-6 right-6"
            >
              <Plus />
            </Button>
          </PopoverContent>
        </Popover>

  )
}
