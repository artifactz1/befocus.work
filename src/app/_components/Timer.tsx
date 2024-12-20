"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Settings } from "../_components/Settings";
import { DarkModeToggle } from "./DarkModeToggle";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function Timer() {
  const [sessions, setSessions] = useState(6);
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [currentSession, setCurrentSession] = useState(1);
  const [isWorking, setIsWorking] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setCurrentSession(1);
    setIsWorking(true);
    setTimeLeft(workDuration);
    setIsRunning(false);
  }, [workDuration]);

  const skipToNextSession = () => {
    if (isWorking) {
      setIsWorking(false);
      setTimeLeft(breakDuration);
    } else {
      setIsWorking(true);
      setTimeLeft(workDuration);
      setCurrentSession((prev) => Math.min(prev + 1, sessions)); // Increment session if moving to work
    }

    setIsRunning(false);
  };

  useEffect(() => {
    reset();
  }, [workDuration, breakDuration, sessions, reset]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            if (isWorking && currentSession < sessions) {
              setIsWorking(false);
              return breakDuration;
            } else if (!isWorking) {
              setIsWorking(true);
              setCurrentSession((prev) => prev + 1);
              return workDuration;
            } else {
              setIsRunning(false);
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    isWorking,
    currentSession,
    sessions,
    workDuration,
    breakDuration,
  ]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const handleSettingsChange = (key: string, value: number) => {
    switch (key) {
      case "sessions":
        setSessions(value);
        break;
      case "workDuration":
        setWorkDuration(value * 60);
        break;
      case "breakDuration":
        setBreakDuration(value * 60);
        break;
    }
  };

  return (
    <div className="container flex h-screen w-screen max-w-4xl flex-col items-center justify-center">
      {/* Focus/Break */}
      <div className="font-regular text-9xl">
        {isWorking ? "Focus" : "Break"}
      </div>

      {/* Time Left */}
      <div className="text-[36rem] font-bold">{formatTime(timeLeft)}</div>

      {/* Buttons */}
      <div className="-mt-20 flex justify-center space-x-4">
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

        <DarkModeToggle />
      </div>

      <div className="flex flex-col justify-between">
        <div>
          <h2 className="mb-4 text-2xl font-medium">Settings</h2>
          <Settings
            sessions={sessions}
            workDuration={workDuration / 60}
            breakDuration={breakDuration / 60}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>

      <div className="text-right">
        <p className="text-xl font-medium">Session</p>
        <p className="text-4xl font-light">
          {currentSession} / {sessions}
        </p>
      </div>
    </div>
  );
}
