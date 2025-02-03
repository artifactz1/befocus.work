// "use client";

// import { AnimatePresence, motion } from "framer-motion";
// import { Archive, Plus } from "lucide-react";
// import { useState } from "react";
// import { seeds } from "~/utils/todos";

// const initialTodos = range(10).map((index) => ({
//   id: index,
//   text: seeds[index],
// }));
// type Todo = (typeof initialTodos)[number];

// export default function Email() {
//   const [id, setId] = useState(Math.max(...initialTodos.map((t) => t.id)) + 1);
//   const [duration, setDuration] = useState(0.3);
//   const [todos, setTodos] = useState(
//     range(10).map((index) => ({ id: index, text: seeds[index] })),
//   );
//   const [selectedTodos, setSelectedTodos] = useState<Todo[]>([]);

//   function addTodo() {
//     setTodos((todos) => [{ id, text: seeds[id] }, ...todos]);
//     setId((id) => id + 1);
//   }

//   function toggleTodo(todo: Todo) {
//     if (selectedTodos.includes(todo)) {
//       setSelectedTodos((todos) => todos.filter((t) => t !== todo));
//     } else {
//       setSelectedTodos((todos) => [todo, ...todos]);
//     }
//   }

//   function archiveSelectedTodos() {
//     setTodos((todos) => todos.filter((t) => !selectedTodos.includes(t)));
//     setSelectedTodos([]);
//   }

//   return (
//     // <div className="flex h-full flex-col items-center justify-center overscroll-y-contain px-6 py-8 text-gray-200">
//     <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-gray-200">
//       <div className="absolute right-0 top-0 hidden space-x-4 px-4 py-2 text-sm text-gray-500 sm:block">
//         <button
//           className={`${duration === 3 ? "text-white" : "hover:text-gray-300"}`}
//           onClick={() => setDuration(3)}
//         >
//           0.1x
//         </button>
//         <button
//           className={`${
//             duration === 0.3 ? "text-white" : "hover:text-gray-300"
//           }`}
//           onClick={() => setDuration(0.3)}
//         >
//           1x
//         </button>
//       </div>

//       <div className="relative flex h-full w-full max-w-md flex-1 flex-col rounded border border-gray-500 bg-gray-600 shadow-xl">
//         <div className="border-b border-gray-500/80 px-5">
//           <div className="flex justify-between py-2 text-right">
//             <button
//               onClick={addTodo}
//               className="-mx-2 flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-300 active:text-gray-200"
//             >
//               <Plus className="h-6 w-6" />
//             </button>
//             <button
//               onClick={archiveSelectedTodos}
//               className={` ${
//                 selectedTodos.length === 0
//                   ? "pointer-events-none opacity-50"
//                   : ""
//               } -mx-2 flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-300 active:text-gray-200`}
//             >
//               <Archive className="h-5 w-5" />
//               Archive
//             </button>
//           </div>
//         </div>

//         <div className="relative z-20 overflow-y-scroll">
//           <div className="m-3">
//             <AnimatePresence initial={false}>
//               {todos.map((todo) => (
//                 <motion.div
//                   initial={{ height: 0 }}
//                   animate={{ height: "auto" }}
//                   exit={{
//                     height: 0,
//                     y:
//                       -53 * countSelectedTodosAfter(todos, selectedTodos, todo),
//                     zIndex: groupSelectedTodos(todos, selectedTodos)
//                       .reverse()
//                       .findIndex((group) => group.includes(todo)),
//                   }}
//                   transition={{ ease: [0.32, 0.72, 0, 1], duration }}
//                   key={todo.id}
//                   className="relative z-[1000] flex flex-col justify-end bg-gray-600"
//                 >
//                   <div>
//                     <button
//                       onClick={() => toggleTodo(todo)}
//                       className={`${
//                         selectedTodos.includes(todo)
//                           ? "bg-blue-500"
//                           : "hover:bg-gray-500/50"
//                       } ${
//                         countSelectedTodosAfter(todos, selectedTodos, todo) ===
//                         0
//                           ? "rounded-b border-transparent"
//                           : "border-white/10"
//                       } ${
//                         countSelectedTodosBefore(todos, selectedTodos, todo) ===
//                         0
//                           ? "rounded-t"
//                           : ""
//                       } block w-full cursor-pointer truncate border-b-[1px] px-4 py-4 text-left md:px-8`}
//                       style={{ WebkitTapHighlightColor: "transparent" }}
//                     >
//                       <p className="truncate text-sm text-white">{todo.text}</p>
//                     </button>
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>

//           <div className="pointer-events-none absolute inset-0 z-[1000] border-[12px] border-gray-600"></div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function countSelectedTodosAfter(
//   todos: Todo[],
//   selectedTodos: Todo[],
//   todo: Todo,
// ) {
//   const startIndex = todos.indexOf(todo);

//   if (startIndex === -1 || !selectedTodos.includes(todo)) {
//     return 0;
//   }

//   let consecutiveCount = 0;

//   for (let i = startIndex + 1; i < todos.length; i++) {
//     if (selectedTodos.includes(todos[i])) {
//       consecutiveCount++;
//     } else {
//       break;
//     }
//   }

//   return consecutiveCount;
// }

// function countSelectedTodosBefore(
//   todos: Todo[],
//   selectedTodos: Todo[],
//   todo: Todo,
// ) {
//   const endIndex = todos.indexOf(todo);

//   if (endIndex === -1 || !selectedTodos.includes(todo)) {
//     return 0;
//   }

//   let consecutiveCount = 0;

//   for (let i = endIndex - 1; i >= 0; i--) {
//     if (selectedTodos.includes(todos[i])) {
//       consecutiveCount++;
//     } else {
//       break;
//     }
//   }

//   return consecutiveCount;
// }

// function groupSelectedTodos(todos: Todo[], selectedTodos: Todo[]) {
//   const todoGroups = [];
//   let currentGroup = [];

//   for (let i = 0; i < todos.length; i++) {
//     const todo = todos[i];

//     if (selectedTodos.includes(todo)) {
//       currentGroup.push(todo);
//     } else if (currentGroup.length > 0) {
//       // If we encounter a non-selected message and there is an active group,
//       // push the current group to the result and reset it.
//       todoGroups.push(currentGroup);
//       currentGroup = [];
//     }
//   }

//   // Check if there's a group remaining after the loop.
//   if (currentGroup.length > 0) {
//     todoGroups.push(currentGroup);
//   }

//   return todoGroups;
// }

// function range(number: number) {
//   return Array.apply(null, Array(number)).map(function (_, i) {
//     return i + 1;
//   });
// }

import { stagger, useAnimate } from "framer-motion";
import { useState } from "react";
// import { ListBulletIcon } from "@heroicons/react/20/solid";

export default function ToDoList() {
  const [items, setItems] = useState([
    { id: "1", text: "One", checked: true },
    { id: "2", text: "Two", checked: true },
    { id: "3", text: "Three", checked: true },
    { id: "4", text: "Four", checked: false },
    { id: "5", text: "Five", checked: true },
    { id: "6", text: "Six", checked: true },
    { id: "7", text: "Seven", checked: true },
  ]);

  /*
    🟢 This hook gives us an `animate()` function that's scoped to a
    specific element and its children. The `animate()` function
    is perfect for imperatively kicking off animations, for example
    in response to an event – exactly what we're doing in this demo.
  */
  const [ref, animate] = useAnimate();

  function handleChange(id: string) {
    const newItems = items.map((item) => ({
      ...item,
      checked: item.id === id ? !item.checked : item.checked,
    }));

    setItems(newItems);

    // 🟢 If every item has been checked...
    if (newItems.every((item) => item.checked)) {
      const lastCompletedItem = items.findIndex((item) => !item.checked);
      const random = Math.random();

      if (random < 1 / 3) {
        /*
          🟢 ...animate each input in the list. The animation uses an array
          of keyframes to scale each input from 100% to 125% then back to 100%
          in sequence. The `delay` option is used along with the `stagger`
          helper to stagger the individual animimations. Stagger accepts
          a `from` option to use as a starting point, which we set to
          the index of the last completed item.
        */
        animate(
          "input",
          { scale: [1, 1.25, 1] },
          {
            duration: 0.35,
            delay: stagger(0.075, { from: lastCompletedItem }),
          }
        );
      } else if (random < 2 / 3) {
        /*
          🟢 The first animation is a "bounce" effect. This second one is
          a "shimmy" effect, achieved by keyframing the `x` prop.
        */
        animate(
          "input",
          { x: [0, 2, -2, 0] },
          {
            duration: 0.4,
            delay: stagger(0.1, { from: lastCompletedItem }),
          }
        );
      } else {
        /*
          🟢 This final effect is a "shake", achieved by keyframing the `rotate` prop.
          One of the three effects are randomly selected each time the list is completed.
        */
        animate(
          "input",
          { rotate: [0, 10, -10, 0] },
          {
            duration: 0.5,
            delay: stagger(0.1, { from: lastCompletedItem }),
          }
        );
      }
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="flex w-full max-w-sm flex-col rounded bg-gray-100 px-3 py-4 shadow-xl">
      

        {/*
           🟢 Attach the ref from `useAnimate()` to scope the animate() function to this subtree.
        */}
        <div ref={ref} className="mt-4">
          {items.map((item) => (
            <label
              key={item.id}
              className={`group flex w-full cursor-pointer select-none items-center rounded p-2 text-sm font-medium transition-colors duration-300 checked:text-gray-300 hover:bg-gray-200 ${
                item.checked
                  ? "text-gray-400 line-through"
                  : "text-gray-800"
              }`}
            >
              <input
                onChange={() => handleChange(item.id)}
                checked={item.checked}
                type="checkbox"
                className="mr-4 h-4 w-4 rounded-sm border-2 border-gray-300 text-sky-600 transition-colors duration-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-sky-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 group-active:border-sky-600 group-active:checked:text-sky-600/25"
              />
              {item.text}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}