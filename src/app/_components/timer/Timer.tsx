"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSoundsStore } from "~/store/useSoundsStore";
import { useTimerStore } from "~/store/useTimerStore";
import { formatTime } from "~/utils/formatTime";

export default function Timer() {
  const { toggleSound, addSound } = useSoundsStore();
  const { timeLeft, isRunning, decrementTime } = useTimerStore();
  const audioRef = useRef(new Audio("/sounds/lofi-alarm-clock.mp3"));

  const playAlarm = useCallback(() => {
    const audio = audioRef.current;
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  }, []);

  const stopAlarm = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    // Add the sound directly using the URL
    // const fileUrl = "/sounds/lofi-alarm-clock-243766.mp3";

    // Add the sound directly using the URL
    // useSoundsStore.getState().addSound("ALARM-1", fileUrl, false);
    // addSound("localSound1", fileUrl, true);

    if (timeLeft === 0) {
      playAlarm();
    } else {
      stopAlarm();
    }
  }, [timeLeft, toggleSound, addSound, playAlarm, stopAlarm]);

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
