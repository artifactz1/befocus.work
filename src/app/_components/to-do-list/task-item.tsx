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
          className="mr-2 peer"
        />
      </motion.div>
      <Label
        className={`group flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300 ${
          task.completed ? "text-gray-500 line-through" : "font-semibold"
        }`}
      >
        {task.text}
      </Label>
    </div>
  );
}
