"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSoundsStore } from "~/store/useSoundsStore";
import { useTimerStore } from "~/store/useTimerStore";
import TimerUI from "./TimeUI";
import useIsLandscape from '../useIsMobileLandscape';

export default function Timer() {
  const { sounds, alarmId } = useSoundsStore();
  const { timeLeft, isRunning, decrementTime } = useTimerStore();

  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  const isLandscape = useIsLandscape();


  // Initialize the ref with `null` for SSR compatibility
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create the audio element only on the client side
      audioRef.current = new Audio("sounds/alarm1.mp3");
    }
  }, []);

  useEffect(() => {
    const selectedAlarm = sounds[alarmId];
    if (selectedAlarm && audioRef.current) {
      audioRef.current.src = selectedAlarm.url;
      audioRef.current.load(); // Reload the audio element with the new source
      audioRef.current.volume = selectedAlarm.volume;
    }
  }, [alarmId, sounds]);

  const playAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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

  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    setMinutes(mins);
    setSeconds(secs);
  }, [timeLeft]);

  const [widthSize, setWidthSize] = useState("25vw");
  const [textSize, setTextSize] = useState("text-[25vw]");

  useEffect(() => {
    const handleResize = () => {
      setWidthSize(window.innerWidth < 640 ? "50vw" : "25vw");
      setTextSize(window.innerWidth < 640 ? "text-[50vw]" : "text-[25vw]");
    };

    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative z-0 flex h-[70vh] items-center justify-center">
      <div className="absolute hidden h-[70vh] items-center justify-center font-bold sm:flex">
        <TimerUI value={minutes} fontSize={isLandscape ? "30vh" : widthSize} />
        <p
          className={`flex h-full items-center ${isLandscape ? "text-[30vh]" : textSize}`}
        >
          :
        </p>
        <TimerUI value={seconds} fontSize={isLandscape ? "30vh" : widthSize} />
      </div>
      <div className="absolute flex-row items-center text-[25vw] font-bold sm:hidden">
        <TimerUI value={minutes} fontSize={widthSize} />
        <TimerUI value={seconds} fontSize={widthSize} />
      </div>
    </div>
  );
}
