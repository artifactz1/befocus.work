
import { Button } from '@repo/ui/button';
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { motion } from "framer-motion";
import { Archive, ArchiveRestore } from "lucide-react";

import { useTodoStore } from "~/store/useToDoStore";

interface TaskItemProps {
  task: {
    id: number;
    text: string;
    completed: boolean;
    editMode: boolean;
    archived: boolean;
  };
  handleChange: (id: number) => void;
}

export default function TaskItem({ task, handleChange }: TaskItemProps) {
  const { editTask, toggleEditMode, archiveTask } = useTodoStore();

  return (
    <div className="items-bottom flex space-x-2 border-b-2 py-2">
      <motion.div
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        className="flex items-center"
      >
        {task.archived ? (
          <Button onClick={() => archiveTask(task.id)}>
            {task.archived ? (
              <ArchiveRestore strokeWidth={1.5} />
            ) : (
              <Archive strokeWidth={1.5} />
            )}
          </Button>
        ) : (
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => handleChange(task.id)}
            className="peer mr-2"
          />
        )}
      </motion.div>
      <motion.div
        animate={{ x: task.completed ? [5, 5, 0] : 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-1000 ${task.completed ? "text-stone-500" : "font-semibold"
          }`}
        onClick={() => toggleEditMode(task.id)}
      >
        {task.editMode ? (
          <Input
            type="text"
            value={task.text}
            autoFocus
            onChange={(e) => editTask(task.id, e.target.value)}
            onBlur={() => toggleEditMode(task.id)}
            onKeyDown={(e) => e.key === "Enter" && toggleEditMode(task.id)}
            // className="w-full rounded border p-2 text-sm font-medium"
            className="rounded-0 border-input-0 h-fit border-0 px-0 py-0 focus-visible:ring-0"
          />
        ) : (
          <span className="relative inline-block">
            {task.text}
            <span
              className={`absolute left-0 top-1/2 h-[2px] transition-all duration-500 ${task.completed ? "w-full bg-stone-500" : "w-0 bg-white"
                }`}
              style={{ transform: "translateY(-50%)" }}
            />
          </span>
        )}
      </motion.div>

      <div className="flex items-center opacity-0 transition-opacity hover:opacity-100">
        <Button onClick={() => archiveTask(task.id)}>
          {!task.archived && <Archive strokeWidth={1.5} />}
        </Button>
      </div>
    </div>
  );
}
