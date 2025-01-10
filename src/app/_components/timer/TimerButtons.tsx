"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTimerStore } from "~/store/useTimerStore";
import { DarkModeToggle } from "../DarkModeToggle";

export default function TimerButtons() {
  const { isRunning, reset, skipToNextSession, toggleTimer } = useTimerStore();

  return (
    <div className="flex items-center justify-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleTimer}
              variant="outline"
              size="lg"
              className="h-12 w-32"
            >
              {isRunning ? (
                <Pause className="h-6 w-6" strokeWidth={3} />
              ) : (
                <Play className="h-6 w-6" strokeWidth={3} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isRunning ? "Pause" : "Play"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={reset}
              variant="outline"
              size="lg"
              className="h-12 w-32"
            >
              <RotateCcw className="h-6 w-6" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset Time</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={skipToNextSession}
              variant="outline"
              size="lg"
              className="h-12 w-32"
            >
              <SkipForward className="h-6 w-6" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Skip To Next</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DarkModeToggle />
    </div>
  );
}
