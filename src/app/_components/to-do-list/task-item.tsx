import { motion } from "framer-motion";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { useTodoStore } from "~/store/useToDoStore";

interface TaskItemProps {
  task: {
    id: number;
    text: string;
    completed: boolean;
    editMode: boolean;
  };
  handleChange: (id: number) => void;
}

export default function TaskItem({ task, handleChange }: TaskItemProps) {
  const { editTask, toggleEditMode } = useTodoStore();

  return (
    <div className="items-top flex space-x-2 border-b-2 py-2">
      <motion.div
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        className="flex items-center"
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => handleChange(task.id)}
          className="peer mr-2"
        />
      </motion.div>
      <motion.div
        animate={{ x: task.completed ? [5, 5, 0] : 0 }}
        transition={{ type: "spring", stiffness: 50, duration: 5 }}
        className={`group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-1000 ${
          task.completed ? "text-stone-500" : "font-semibold"
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
              className={`absolute left-0 top-1/2 h-[2px] transition-all duration-500 ${
                task.completed ? "w-full bg-stone-500" : "w-0 bg-white"
              }`}
              style={{ transform: "translateY(-50%)" }}
            ></span>
          </span>

          // <motion.span
          //   className="relative inline-block"
          //   initial={{ color: "white" }}
          //   animate={{ color: task.completed ? "#78716c" : "white" }}
          //   transition={{ delay: 1, duration: 1 }} // Delayed transition to match the line animation
          // >
          //   {task.text}
          //   <motion.span
          //     className="absolute left-0 top-1/2 h-[2px]"
          //     style={{ transform: "translateY(-50%)" }}
          //     initial={{ width: "0%", backgroundColor: "white" }}
          //     animate={{
          //       width: task.completed ? "100%" : "0%",
          //       backgroundColor: task.completed ? "#78716c" : "white",
          //     }}
          //     transition={{ duration: 1, ease: "easeInOut" }} // Smooth transition
          //   />
          // </motion.span>
        )}
      </motion.div>
    </div>
  );
}
