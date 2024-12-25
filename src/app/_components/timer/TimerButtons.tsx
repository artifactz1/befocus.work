"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTimerStore } from "~/store/useTimerStore";
import { DarkModeToggle } from "../DarkModeToggle";

export default function TimerButtons() {
  const { isRunning, reset, skipToNextSession, toggleTimer } = useTimerStore();

  return (
    // <div className="-mt-20 flex items-center justify-center space-x-4 opacity-0 transition-opacity duration-500 hover:opacity-100">
    <div className="flex items-center justify-center space-x-1">
      <Button
        onClick={toggleTimer}
        variant="outline"
        size="lg"
        className="h-12 w-32"
      >
        {isRunning ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6" />
        )}
      </Button>
      <Button onClick={reset} variant="outline" size="lg" className="h-12 w-32">
        <RotateCcw className="h-6 w-6" />
      </Button>
      <Button
        onClick={skipToNextSession}
        variant="outline"
        size="lg"
        className="h-12 w-32"
      >
        <SkipForward className="h-6 w-6" />
      </Button>
      <DarkModeToggle />
    </div>
  );
}
