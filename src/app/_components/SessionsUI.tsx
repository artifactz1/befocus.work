// import { cn } from "~/lib/utils";
// import { useTimerStore } from "~/store/useTimerStore";

// export default function SessionsUI() {
//   const { sessions, currentSession } = useTimerStore();
//   const activeColor = "bg-pink-500";
//   const totalSessions = sessions * 2;

//   return (
//     <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 p-6">
//       <div className="text-2xl">
//         {currentSession} / {sessions}
//       </div>
//       <div>
//         <div className="flex">
//           {Array.from({ length: totalSessions })
//             .filter((_, index) => index % 2 === 0)
//             .map((_, index) => (
//               <div
//                 key={`work-${index}`}
//                 className={cn(
//                   "h-[24px] w-[24px] rounded-lg border-2 border-white/80 transition-all duration-300",
//                   index < currentSession ? activeColor : "bg-transparent",
//                 )}
//                 role="progressbar"
//                 aria-valuenow={currentSession}
//                 aria-valuemin={1}
//                 aria-valuemax={totalSessions}
//               />
//             ))}
//         </div>
//       </div>
//     </main>
//   );
// }

import { useEffect } from "react";
import { cn } from "~/lib/utils";
import { useTimerStore } from "~/store/useTimerStore";

export default function SessionsUI() {
  const { sessions, currentSession, isWorking } = useTimerStore();

  useEffect(() => {
    // Sync with localStorage or set default mode
    const darkModeFromLocalStorage =
      localStorage.getItem("darkMode") === "true";

    if (darkModeFromLocalStorage) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-3 p-6">
      <p className="text-2xl font-semibold">
        {currentSession} / {sessions}
      </p>
      <div className="space-y-1">
        {/* Work Sessions */}
        <div className="flex space-x-1">
          {Array.from({ length: sessions }).map((_, index) => (
            <div
              key={`work-${index}`}
              className={cn(
                "h-10 w-10 rounded-lg border-2 transition-all duration-300",
                "border-gray-300 dark:border-white/80", // Light mode: black, Dark mode: white
                index <= currentSession - 1 // Completed work sessions
                  ? isWorking && currentSession - 1 === index
                    ? "bg-pink-500"
                    : "bg-green-500"
                  : "", // No color if not completed
              )}
            />
          ))}
        </div>
        {/* Break Sessions */}
        <div className="flex space-x-1">
          {Array.from({ length: sessions }).map((_, index) => (
            <div
              key={`break-${index}`}
              className={cn(
                "h-10 w-10 rounded-lg border-2 transition-all duration-300",
                "border-gray-300 dark:border-white/80", // Light mode: black, Dark mode: white
                index < currentSession - 1 // Completed break sessions
                  ? "bg-green-500"
                  : !isWorking && currentSession - 1 === index // Current break session
                    ? "bg-pink-500"
                    : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
