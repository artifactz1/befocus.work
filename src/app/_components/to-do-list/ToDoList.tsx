import { motion, stagger, useAnimate } from "framer-motion";
import { useEffect } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { useTodoStore } from "~/store/useToDoStore"; // Zustand store

export default function TodoList() {
  const { tasks, toggleTask } = useTodoStore();
  const [ref, animate] = useAnimate();

  function handleChange(id: number) {
    toggleTask(id);
  }

  useEffect(() => {
    if (tasks.length === 0) return; // Prevent animation when there are no tasks

    if (tasks.every((task) => task.completed)) {
      const random = Math.random();

      if (random < 1 / 3) {
        animate(
          ".peer",
          { scale: [1, 1.25, 1] },
          { duration: 0.35, delay: stagger(0.075) },
        );
      } else if (random < 2 / 3) {
        animate(
          ".peer",
          { x: [0, 2, -2, 0] },
          { duration: 0.4, delay: stagger(0.1) },
        );
      } else {
        animate(
          ".peer",
          { rotate: [0, 10, -10, 0] },
          { duration: 0.5, delay: stagger(0.1) },
        );
      }
    }
  }, [tasks, animate]); // Runs whenever `tasks` changes

  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="flex w-full max-w-sm flex-col rounded px-3 py-4">
        <div ref={ref} className="mt-4">
          {tasks.map((task) => (
            <div key={task.id} className="items-top flex space-x-2">
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                className="flex items-center"
                ref={ref}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleChange(task.id)}
                  className="peer mr-2"
                />
              </motion.div>
              <Label
                className={`group flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300 ${
                  task.completed
                    ? "text-gray-500 line-through"
                    : "font-semibold"
                }`}
              >
                {task.text}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
