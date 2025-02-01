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

// import { useEffect } from "react";
// import { cn } from "~/lib/utils";
// import { useTimerStore } from "~/store/useTimerStore";

// export default function SessionsUI() {
//   const { sessions, currentSession, isWorking, timeLeft, workDuration } = useTimerStore();

//   useEffect(() => {
//     // Sync with localStorage or set default mode
//     const darkModeFromLocalStorage =
//       localStorage.getItem("darkMode") === "true";

//     if (darkModeFromLocalStorage) {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
//   }, []);

//   const opacitySession = Math.min(Math.max(timeLeft / workDuration, 0), 1); // Clamp between 0 and 1

//   return (
//     <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-3 p-6">
//       <p className="text-2xl font-semibold">
//         {currentSession} / {sessions}
//       </p>
//       <div className="space-y-1">
//         {/* Work Sessions */}
//         <div className="flex space-x-1">
//           {Array.from({ length: sessions }).map((_, index) => (
//             <div
//               key={`work-${index}`}
//               className={cn(
//                 "h-10 w-10 rounded-lg border-2 transition-all duration-300",
//                 "border-gray-300 dark:border-white/80", // Light mode: black, Dark mode: white
//                 index <= currentSession - 1 // Completed work sessions
//                   ? isWorking && currentSession - 1 === index
//                     ? "bg-pink-500 opacity-[$opacitySession]"
//                     : "bg-green-500"
//                   : "", // No color if not completed
//               )}
//             />
//           ))}
//         </div>
//         {/* Break Sessions */}
//         <div className="flex space-x-1">
//           {Array.from({ length: sessions }).map((_, index) => (
//             <div
//               key={`break-${index}`}
//               className={cn(
//                 "h-10 w-10 rounded-lg border-2 transition-all duration-300",
//                 "border-gray-300 dark:border-white/80", // Light mode: black, Dark mode: white
//                 index < currentSession - 1 // Completed break sessions
//                   ? "bg-green-500"
//                   : !isWorking && currentSession - 1 === index // Current break session
//                     ? "bg-pink-500"
//                     : "bg-transparent",
//               )}
//             />
//           ))}
//         </div>
//       </div>
//     </main>
//   );
// }

import { useEffect } from "react";
import { cn } from "~/lib/utils";
import { useTimerStore } from "~/store/useTimerStore";

export default function SessionsUI() {
  const { sessions, currentSession, isWorking, timeLeft, workDuration } =
    useTimerStore();

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

  // Calculate the opacity based on timeLeft and workDuration
  // const opacitySession = 1 - timeLeft / workDuration; // Clamp between 0 and 1
  const opacitySession = Math.round((1 - timeLeft / workDuration) * 100); // Clamp between 0 and 1

  // Map opacitySession to Tailwind opacity classes
  const getOpacityClass = (opacity: number) => {
    if (opacity <= 0) return "";
    if (opacity <= 10) return "bg-pink-500/10 ";
    if (opacity <= 20) return "bg-pink-500/20 ";
    if (opacity <= 30) return "bg-pink-500/30 ";
    if (opacity <= 40) return "bg-pink-500/40 ";
    if (opacity <= 50) return "bg-pink-500/50 ";
    if (opacity <= 60) return "bg-pink-500/60 ";
    if (opacity <= 70) return "bg-pink-500/70 ";
    if (opacity <= 80) return "bg-pink-500/80 ";
    if (opacity <= 90) return "bg-pink-500/90 ";
    return "bg-pink-500 ";
  };

  // const getOpacityClass = (opacity: number) => {
  //   if (opacity <= 0) return "bg-pink-500/0"; // Fully transparent
  //   return `bg-pink-500/${opacity}`; // Use Tailwind's opacity syntax
  // };

  console.log(opacitySession);

  // const opacitySession = Math.round((1 - timeLeft / workDuration) * 100); // Clamp between 0 and 1

  // Map opacitySession to Tailwind opacity classes
  // const getOpacityClass = (opacity: number) => {
  //   // if (opacity <= 0) return "bg-pink-500/0"; // Fully transparent
  //   const opacityPercentage = Math.round(opacity * 100); // Convert to percentage (0-100)
  //   return `bg-pink-500/[${opacityPercentage}%]`; // Use arbitrary value syntax
  // };

  const opacityClass = getOpacityClass(opacitySession);

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
                    ? // ? `bg-pink-500 ${opacityClass}`
                      `${opacityClass}`
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
                    ? `${opacityClass}`
                    : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
