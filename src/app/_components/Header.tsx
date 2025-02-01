"use client";

import { useTimerStore } from "~/store/useTimerStore";
import SessionsUI from "./SessionsUI";

function Timer() {
  const { isWorking, isRunning } = useTimerStore();

  return (
    <div className="flex h-[15vh] w-full items-center justify-between px-[5vw] pt-6">
      <div className="font-regular text-9xl">
        <SessionsUI />
      </div>
      <div className="flex flex-col items-center justify-center text-right">
        <p className="text-5xl font-bold transition-transform duration-1000 ease-in-out">
          {isRunning ? (isWorking ? "Focus" : "Break") : "BeFocused"}
        </p>
      </div>
    </div>
  );
}

export default Timer;
