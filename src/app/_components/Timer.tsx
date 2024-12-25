"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useTimerStore } from "~/store/useTimerStore";
import { formatTime } from "~/utils/formatTime";

export default function Timer() {
  const {
    sessions,
    workDuration,
    breakDuration,
    currentSession,
    isWorking,
    timeLeft,
    isRunning,
    reset,
    skipToNextSession,
    toggleTimer,
    decrementTime,
    updateSettings,
  } = useTimerStore();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        decrementTime();
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, decrementTime]);

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex w-full items-center justify-between">
        <div className="font-regular text-9xl">
          {isWorking ? "Focus" : "Break"}
        </div>
        <div className="flex flex-col items-center justify-center text-right">
          <p className="text-xl font-medium">Session</p>
          <p className="text-4xl font-light">
            {currentSession} / {sessions}
          </p>
        </div>
      </div>
      <div className="-my-20 text-[36rem] font-bold">
        {formatTime(timeLeft)}
      </div>
      <div className="-mt-20 flex items-center justify-center space-x-4 opacity-0 transition-opacity duration-500 hover:opacity-100">
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
        <Button
          onClick={reset}
          variant="outline"
          size="lg"
          className="h-12 w-32"
        >
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
      </div>
    </div>
  );
}
