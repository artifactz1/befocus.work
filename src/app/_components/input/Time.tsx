"use client";

import { useTimerStore } from "~/store/useTimerStore";
import { BreakDurationInput } from "./BreakDurationInput";
import { SessionsInput } from "./SessionsInput";
import { WorkDurationInput } from "./WorkDurationInput";

export const Time: React.FC = () => {
  const { sessions, workDuration, breakDuration, updateTimer } =
    useTimerStore();

  return (
    <div className="flex flex-col space-y-4">
      <WorkDurationInput
        value={workDuration}
        onChange={(value) => updateTimer("workDuration", value)}
      />
      <BreakDurationInput
        value={breakDuration}
        onChange={(value) => updateTimer("breakDuration", value)}
      />
      <SessionsInput
        value={sessions}
        onChange={(value) => updateTimer("sessions", value)}
      />
    </div>
  );
};
