import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DarkModeToggle } from "../DarkModeToggle";

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
      <Button
        onClick={toggleTimer}
        // variant="outline"
        size="lg"
        className="h-12 w-32"
      >
        {isRunning ? <Pause /> : <Play />}
      </Button>
      <Button
        onClick={reset}
        // variant="outline"
        size="lg"
        className="h-12 w-32"
      >
        <RotateCcw />
      </Button>
      <Button
        onClick={skipToNextSession}
        // variant="outline"
        size="lg"
        className="h-12 w-32"
      >
        <SkipForward />
      </Button>
      <DarkModeToggle />
    </div>
  );
}
