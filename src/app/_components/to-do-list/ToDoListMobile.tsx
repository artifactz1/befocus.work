"use client";
import { NotebookPen, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Separator } from "~/components/ui/separator";
import TaskList from './task-list';
import { useTodoStore } from '~/store/useToDoStore';

export default function ToDoListMobile() {

  const {toggleAdd } = useTodoStore();

  return (
    <main className="block sm:hidden">
      <Drawer>
        <DrawerTrigger>
          <NotebookPen />
        </DrawerTrigger>
        <DrawerContent className="p-">
          <DrawerHeader>
            <DrawerTitle className="mx-1">
              <NotebookPen />
              <div className="mb-2 mt-4 text-left text-lg font-bold">
                befocus/todolist
              </div>
              <Separator className="mt-4 bg-white" />
            </DrawerTitle>
            {/* <DrawerDescription>This action cannot be undone.</DrawerDescription> */}
          </DrawerHeader>
          
          <div>
            <TaskList/>
          </div>

          <DrawerFooter>
            <Button
              onClick={() => toggleAdd()}
              className="absolute bottom-6 right-6"
            >
              <Plus />
            </Button>

            {/* <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose> */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
