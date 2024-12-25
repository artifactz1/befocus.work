"use client";

import { useTimerStore } from "~/store/useTimerStore";
import { BreakDurationInput } from "./BreakDurationInput";
import { SessionsInput } from "./SessionsInput";
import { WorkDurationInput } from "./WorkDurationInput";

export const SessionSettings: React.FC = () => {
  const { sessions, workDuration, breakDuration, reset, updateSettings } =
    useTimerStore();

  return (
    <div className="flex flex-col space-y-4">
      <WorkDurationInput
        value={workDuration / 60 }
        onChange={(value) => updateSettings("workDuration", value)}
      />
      <BreakDurationInput
        value={breakDuration / 60}
        onChange={(value) => updateSettings("breakDuration", value)}
      />
      <SessionsInput
        value={sessions}
        onChange={(value) => updateSettings("sessions", value)}
      />
      <button
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={reset}
      >
        Save
      </button>
    </div>
  );
};
