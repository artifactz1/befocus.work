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

import { cn } from "~/lib/utils";
import { useTimerStore } from "~/store/useTimerStore";

export default function SessionsUI() {
  const { sessions, currentSession, isWorking } = useTimerStore();
  const activeColor = "bg-pink-500"; // Current session
  const completedColor = "bg-green-500"; // Completed sessions

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 p-6">
      <div className="text-2xl">
        {currentSession} / {sessions}
      </div>
      <div>
        {/* Work Sessions */}
        <div className="flex">
          {Array.from({ length: sessions }).map((_, index) => (
            <div
              key={`work-${index}`}
              className={cn(
                "h-[24px] w-[24px] rounded-lg border-2 border-white/80 transition-all duration-300",
                index <= currentSession - 1 // Completed work sessions
                  ? isWorking && currentSession - 1 === index
                    ? activeColor
                    : completedColor
                  : "", // No color if it's not a completed session
              )}
              role="progressbar"
              aria-valuenow={currentSession}
              aria-valuemin={1}
              aria-valuemax={sessions}
            />
          ))}
        </div>
        {/* Break Sessions */}
        <div className="flex">
          {Array.from({ length: sessions }).map((_, index) => (
            <div
              key={`break-${index}`}
              className={cn(
                "h-[24px] w-[24px] rounded-lg border-2 border-white/80 transition-all duration-300",
                // index <= Math.floor((currentSession - 1) / 2) &&
                index < currentSession - 1 // Completed break sessions
                  ? completedColor
                  : !isWorking && currentSession - 1 === index // Current break session
                    ? activeColor
                    : "bg-transparent",
              )}
              role="progressbar"
              aria-valuenow={currentSession}
              aria-valuemin={1}
              aria-valuemax={sessions}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
