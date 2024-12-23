type TimerDisplayProps = {
  isWorking: boolean;
  timeLeft: number;
};

export default function TimerDisplay({ isWorking, timeLeft }: TimerDisplayProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="text-9xl">{isWorking ? "Focus" : "Break"}</div>
      <div className="text-[36rem] font-bold">{formatTime(timeLeft)}</div>
    </div>
  );
}
