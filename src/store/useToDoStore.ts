import { create } from "zustand";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoStore {
  addMode: boolean;
  toggleAdd: () => void;
  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: number) => void;
  removeTask: (id: number) => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  addMode: false,
  toggleAdd: () =>
    set((state) => ({
      addMode: !state.addMode,
    })),
  tasks: [
    { id: 1, text: "Buy groceries", completed: true },
    { id: 2, text: "Finish project", completed: false },
    { id: 3, text: "Go for a run", completed: false },
  ],
  addTask: (text) =>
    set((state) => ({
      tasks: [{ id: Date.now(), text, completed: false }, ...state.tasks],
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
}));
