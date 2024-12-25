"use client";

import { useState } from "react";

import { useTimer } from "./hooks/useTimer";
import SettingsPanel from "./SettingsPanel";
import TimerControls from "./TimerControls";
import TimerDisplay from "./TimerDisplay";

type Settings = {
  sessions: number;
  workDuration: number; // in seconds
  breakDuration: number; // in seconds
};

export default function Timer() {
  const {
    currentSession,
    sessions,
    isWorking,
    timeLeft,
    isRunning,
    toggleTimer,
    reset,
    skipToNextSession,
  } = useTimer(6, 25 * 60, 5 * 60);

  // // Explicitly type the settings state
  const [settings, setSettings] = useState<Settings>({
    sessions: 6,
    workDuration: 25 * 60, // in seconds
    breakDuration: 5 * 60, // in seconds
  });

  const handleSettingsChange = (key: keyof Settings, value: number) => {
    console.log("Updating", key, "to", value);
    setSettings((prevSettings) => ({
      ...prevSettings,
      [key]:
        key === "workDuration" || key === "breakDuration" ? value * 60 : value,
    }));
  };

  // const [sessions, setSessions] = useState(6);
  // const [workDuration, setWorkDuration] = useState(25 * 60);
  // const [breakDuration, setBreakDuration] = useState(5 * 60);

  // const handleSettingsChange = (key: string, value: number) => {
  //   switch (key) {
  //     case "sessions":
  //       setSessions(value);
  //       break;
  //     case "workDuration":
  //       setWorkDuration(value * 60);
  //       break;
  //     case "breakDuration":
  //       setBreakDuration(value * 60);
  //       break;
  //   }
  // };

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center">
      <TimerDisplay
        isWorking={isWorking}
        timeLeft={timeLeft}
        currentSession={currentSession}
        sessions={sessions}
      />
      <TimerControls
        isRunning={isRunning}
        toggleTimer={toggleTimer}
        reset={reset}
        skipToNextSession={skipToNextSession}
      />

      {/* Settings panel */}
      <SettingsPanel
        sessions={settings.sessions}
        workDuration={settings.workDuration}
        breakDuration={settings.breakDuration}
        handleSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
