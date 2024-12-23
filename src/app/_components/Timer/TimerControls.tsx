import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "~/components/ui/button";

type TimerControlsProps = {
  isRunning: boolean;
  toggleTimer: () => void;
  reset: () => void;
  skipToNextSession: () => void;
};

export default function TimerControls({
  isRunning,
  toggleTimer,
  reset,
  skipToNextSession,
}: TimerControlsProps) {
  return (
    <div className="flex space-x-4">
      <Button onClick={toggleTimer}>{isRunning ? <Pause /> : <Play />}</Button>
      <Button onClick={reset}>
        <RotateCcw />
      </Button>
      <Button onClick={skipToNextSession}>
        <SkipForward />
      </Button>
    </div>
  );
}
