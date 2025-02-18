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

import SessionMobileCount from "./SessionMobileCount";
import SessionsUI from "./SessionsUI";
import SessionTitleDisplay from "./SessionTitleDisplay";

function Timer() {
  return (
    <div className="flex w-screen flex-col-reverse px-10 pt-10 sm:mt-0 sm:h-[15vh] sm:w-full sm:flex-row sm:items-center sm:justify-between sm:px-[5vw]">
      <SessionsUI />
      <div className="mb-4 flex items-end justify-between sm:mb-1">
        <SessionTitleDisplay />
        <SessionMobileCount />
      </div>
    </div>
  );
}

export default Timer;
