"use client";

import SettingsPanel from "./SettingsPanel";
import TimerControls from "./TimerControls";
import TimerDisplay from "./TimerDisplay";
import { useTimer } from "./hooks/useTimer";

export default function Timer() {
  const {
    currentSession,
    isWorking,
    timeLeft,
    isRunning,
    toggleTimer,
    reset,
    skipToNextSession,
  } = useTimer(6, 25 * 60, 5 * 60);

  const [settings, setSettings] = useState({
    sessions: 6,
    workDuration: 25 * 60, // in seconds
    breakDuration: 5 * 60, // in seconds
  });

  // Update settings when changed in the SettingsPanel
  const handleSettingsChange = (newSettings: {
    sessions: number;
    workDuration: number;
    breakDuration: number;
  }) => {
    setSettings(newSettings);
  };

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center">
      <TimerDisplay isWorking={isWorking} timeLeft={timeLeft} />
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
