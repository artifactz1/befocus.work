"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSoundsStore } from "~/store/useSoundsStore";
import { useTimerStore } from "~/store/useTimerStore";
import { formatTime } from "~/utils/formatTime";

export default function Timer() {
  const { sounds, alarmId } = useSoundsStore();
  const { timeLeft, isRunning, decrementTime } = useTimerStore();
  const audioRef = useRef(new Audio("/sounds/alarm1.mp3"));

  useEffect(() => {
    const selectedAlarm = sounds[alarmId];
    if (selectedAlarm) {
      if (audioRef.current) {
        audioRef.current.src = selectedAlarm.url;
        audioRef.current.load(); // Reload the audio element with the new source
        audioRef.current.volume = selectedAlarm.volume 
      } else {
        audioRef.current = new Audio(selectedAlarm.url);
      }
    }
  }, [alarmId, sounds]);

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
    if (timeLeft === 0) {
      playAlarm();
    } else {
      stopAlarm();
    }
  }, [timeLeft, playAlarm, stopAlarm]);

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

    <div className="relative z-0 flex h-[70vh] items-center justify-center">
      <div className="absolute h-fit text-[25vw] font-bold">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
}
