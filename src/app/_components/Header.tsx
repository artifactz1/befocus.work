// "use client";

// import { useTimerStore } from "~/store/useTimerStore";
// import SessionsUI from "./SessionsUI";

// function Timer() {
//   const { isWorking, isRunning } = useTimerStore();

//   return (
//     <div className="flex h-[15vh] w-full items-center justify-between px-[5vw] pt-6">
//       <div className="font-regular text-9xl">
//         <SessionsUI />
//       </div>
//       <div className="flex flex-col items-center justify-center text-right">
//         <p className="text-5xl font-bold transition-transform duration-1000 ease-in-out">
//           {isRunning ? (isWorking ? "Focus" : "Break") : "BeFocused"}
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Timer;

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTimerStore } from "~/store/useTimerStore";
import SessionsUI from "./SessionsUI";

function Timer() {
  const { isWorking, isRunning, workDuration, timeLeft } = useTimerStore();
  const text = isRunning
    ? isWorking
      ? "Focus"
      : "Break"
    : workDuration === timeLeft
      ? "BeFocused"
      : isWorking ? "Paused" : "Break";

  return (
    <div className="flex h-[15vh] w-full items-center justify-between px-[5vw] pt-6">
      <div>
        <SessionsUI />
      </div>
      <div className="flex flex-col items-center justify-center text-right">
        <AnimatePresence mode="wait">
          <motion.p
            key={text} // Forces re-render when text changes
            // initial={{ opacity: 0, y: 0 }} // Starts faded out and moves up
            animate={{ opacity: 1, y: 0 }} // Fades in and moves into place
            exit={{ opacity: 0, y: 0 }} // Moves up slightly when fading out
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-7xl font-bold"
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Timer;
