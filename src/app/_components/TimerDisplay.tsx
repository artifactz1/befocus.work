"use client";

import React, { useEffect } from "react";
import { useSettingsStore } from "../../store/settingsStore";

export const TimerDisplay: React.FC = () => {
  const { timer, isTimerRunning, startTimer, stopTimer, workDuration } =
    useSettingsStore();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning) {
      interval = setInterval(() => {
        useSettingsStore.setState((state) => ({
          timer: Math.max(state.timer - 1, 0),
        }));

        if (timer === 0) stopTimer();
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold">Timer</h2>
      <p className="text-lg">{timer}s</p>
      <button
        className="mt-4 rounded bg-black px-4 py-2 text-white"
        onClick={() =>
          isTimerRunning ? stopTimer() : startTimer(workDuration * 60)
        }
      >
        {isTimerRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
};
