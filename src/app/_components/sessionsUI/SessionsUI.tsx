import { cn } from "~/lib/utils";
import { useTimerStore } from "~/store/useTimerStore";

export default function SessionsUI() {
  const { sessions, currentSession } = useTimerStore();
  const activeColor = "bg-pink-500";
  const totalSessions = sessions * 2;

  return (
    <main className="mx-auto w-full max-w-md space-y-6 p-6">
      <div className="text-2xl">
        {currentSession} / {sessions}
      </div>
      <div>
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: totalSessions }).map((_, index) => (
            <div
              key={`work-${index}`}
              className={cn(
                "aspect-square rounded-lg border-2 border-white/80 transition-all duration-300",
                index < currentSession ? activeColor : "bg-transparent",
              )}
              role="progressbar"
              aria-valuenow={currentSession}
              aria-valuemin={1}
              aria-valuemax={totalSessions}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
