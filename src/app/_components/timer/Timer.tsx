"use client";

import { useEffect } from "react";
import { useSoundsStore } from "~/store/useSoundsStore";
import { useTimerStore } from "~/store/useTimerStore";
import { formatTime } from "~/utils/formatTime";

export default function Timer() {
  const { toggleSound, addSound } = useSoundsStore();
  const { timeLeft, isRunning, decrementTime, toggleAlarm } = useTimerStore();

  useEffect(() => {
    // Add the sound directly using the URL
    const fileUrl = "/sounds/lofi-alarm-clock-243766.mp3";

    // Add the sound directly using the URL
    // useSoundsStore.getState().addSound("localSound", fileUrl, false);
    // addSound("localSound1", fileUrl, true);

    if (timeLeft === 0) {
      toggleAlarm();
      // toggleSound("localSound1");
    }
  }, [timeLeft, toggleSound, addSound, toggleAlarm]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        decrementTime();
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, decrementTime, timeLeft]);

  return (
    // <div className="flex h-[70vh] w-screen flex-col items-center justify-center">

    <div className="relative z-0 flex h-[70vh] items-center justify-center">
      <div className="absolute h-fit text-[25vw] font-bold">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
}
