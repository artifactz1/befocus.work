"use client";

import { Button } from "~/components/ui/button";
import { useTimerStore } from "~/store/useTimerStore";
import { BreakDurationInput } from "../input/BreakDurationInput";
import { SessionsInput } from "../input/SessionsInput";
import { WorkDurationInput } from "../input/WorkDurationInput";

export const SessionSettings: React.FC = () => {
  const { sessions, workDuration, breakDuration, reset, updateSettings } =
    useTimerStore();

  return (
    <div className="flex flex-col space-y-4">
      <WorkDurationInput
        value={workDuration / 60}
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
      <div className="flex w-full justify-end">
        <Button className="rounded px-4 py-2" onClick={reset}>
          Save
        </Button>
      </div>
    </div>
  );
};
