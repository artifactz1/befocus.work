import SessionsDisplay from "./SessionsDisplay";

type TimerDisplayProps = {
  isWorking: boolean;
  timeLeft: number;
  currentSession: number;
  sessions: number;
};

export default function TimerDisplay({
  isWorking,
  timeLeft,
  currentSession,
  sessions,
}: TimerDisplayProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main>
      <div className="flex w-full items-center justify-between text-5xl 2xl:text-6xl">
        <div>{isWorking ? "Focus" : "Break"}</div>
        <SessionsDisplay currentSessions={currentSession} sessions={sessions} />
      </div>

      <div className="text-[28rem] font-bold">{formatTime(timeLeft)}</div>
    </main>
  );
}
