"use client";

import { useTimerStore } from "~/store/useTimerStore";

function Timer() {
  const { sessions, currentSession, isWorking } = useTimerStore();

  return (
    <div className="flex h-[15vh] w-full items-center justify-between px-[5vw]">
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
  );
}

export default Timer;
