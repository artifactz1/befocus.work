
import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/popover";
import { useTodoStore } from "~/store/useToDoStore";
import TaskList from "../to-do-list/TaskList";

export default function ToDoList() {
  const { toggleAdd } = useTodoStore();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="lg" className="lg:h-12 lg:w-32">
          <NotebookPen />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-h-[50vh] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:-ml-7 sm:min-h-[392px] sm:w-[392px] md:ml-0"
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
  );
}
