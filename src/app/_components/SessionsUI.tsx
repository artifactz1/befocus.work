import { useEffect } from "react";
import { cn } from "~/lib/utils";
import { useTimerStore } from "~/store/useTimerStore";

export default function SessionsUI() {
  const {
    sessions,
    currentSession,
    isWorking,
    timeLeft,
    workDuration,
    breakDuration,
  } = useTimerStore();

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

  const opacitySession = Math.round((1 - timeLeft / workDuration) * 100); // Clamp between 0 and 1
  const opacitySessionBrk = Math.round((1 - timeLeft / breakDuration) * 100); // Clamp between 0 and 1

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

  const opacityClass = getOpacityClass(opacitySession);
  const opacityClassBrk = getOpacityClass(opacitySessionBrk);

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
                    ? `${opacityClass}`
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
                    ? `${opacityClassBrk}`
                    : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

