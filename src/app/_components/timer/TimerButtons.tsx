"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTimerStore } from "~/store/useTimerStore";

export default function TimerButtons() {
  const { isRunning, resetCurrentTime, skipToNextSession, toggleTimer } =
    useTimerStore();

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // 'sm' breakpoint is 640px
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buttonVariant = isSmallScreen ? "ghost" : "outline";



  return (
    <div className="flex items-center justify-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleTimer}
              variant={buttonVariant}
              // size={window.length < 640 ? "sm" : "lg"}
              size={"lg"}
              className="lg:h-12 lg:w-32"
            >
              {isRunning ? (
                <Pause className="h-6 w-6" strokeWidth={3} />
              ) : (
                <Play className="h-6 w-6" strokeWidth={3} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-bold">
            {isRunning ? "Pause" : "Play"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={resetCurrentTime}
              variant={buttonVariant}
              size={"lg"}
              className="lg:h-12 lg:w-32"
            >
              <RotateCcw className="h-6 w-6" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-bold">Reset Time</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={skipToNextSession}
              variant={buttonVariant}
              size={"lg"}
              className="lg:h-12 lg:w-32"
            >
              <SkipForward className="h-6 w-6" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-bold">Skip To Next</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
