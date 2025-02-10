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
      : isWorking
        ? "Paused"
        : "Break";
  const { sessions, currentSession } = useTimerStore();

  // const [heightSize, setHeightSize] = useState("");

  // useEffect(() => {
  //   const handleResize = () => {
  //     setHeightSize(window.innerWidth < 640 ? "25vh" : "15vh");
  //   };

  //   handleResize(); // Set initial size
  //   window.addEventListener("resize", handleResize);

  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  return (
    <div className="flex w-screen flex-col-reverse px-10 pt-10 sm:h-[15vh] sm:w-full sm:flex-row sm:items-center sm:justify-between sm:px-[5vw] sm:pt-10">
      <SessionsUI />
      <div className="mb-4 flex items-end justify-between sm:mb-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={text} // Forces re-render when text changes
            // initial={{ opacity: 0, y: 0 }} // Starts faded out and moves up
            animate={{ opacity: 1, y: 0 }} // Fades in and moves into place
            exit={{ opacity: 0, y: 0 }} // Moves up slightly when fading out
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="xs:text-5xl text-right text-4xl font-bold sm:text-7xl"
          >
            {text}
          </motion.p>
        </AnimatePresence>
        <div className="block sm:hidden">
          <p className="xs:text-3xl mr-1 text-2xl font-extrabold">
            {currentSession} / {sessions}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Timer;
