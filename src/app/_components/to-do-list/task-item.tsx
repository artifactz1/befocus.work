import { Separator } from "@radix-ui/react-separator";
import { motion } from "framer-motion";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

interface TaskItemProps {
  task: {
    id: number;
    text: string;
    completed: boolean;
  };
  handleChange: (id: number) => void;
}

export default function TaskItem({ task, handleChange }: TaskItemProps) {
  return (
    <div className="items-top flex space-x-2">
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
      {/* <Label
        className={`group flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300 ${
          task.completed ? "text-gray-500 line-through" : "font-semibold"
        }`}
      >
        {task.text}
      </Label> */}
      <Label
  className={`group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300 ${
    task.completed ? "text-gray-500" : "font-semibold"
  }`}
>
  {/* Text wrapper for dynamic width */}
  <span className="relative inline-block">
    {task.text}
    {/* Strikethrough line grows to text width */}
    <span
      className={`absolute left-0 top-1/2 h-[2px] bg-gray-500 transition-all duration-500 ${
        task.completed ? "w-full" : "w-0"
      }`}
      style={{ transform: "translateY(-50%)" }}
    ></span>
  </span>
</Label>

      
      

      <Separator />
    </div>
  );
}
