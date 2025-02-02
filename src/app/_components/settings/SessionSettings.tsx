"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useTimerStore } from "~/store/useTimerStore";
import { BreakDurationInput } from "../input/BreakDurationInput";
import { SessionsInput } from "../input/SessionsInput";
import { WorkDurationInput } from "../input/WorkDurationInput";

export const SessionSettings: React.FC = () => {
  const { sessions, workDuration, breakDuration, reset, updateSettings } =
    useTimerStore();

  const [workTime, setWorkTime] = useState(workDuration);
  const [breakTime, setBreakTime] = useState(breakDuration);
  const [session, setSession] = useState(sessions);

  return (
    <div className="flex flex-col space-y-4">
      <WorkDurationInput
        value={workTime / 60}
        onChange={(value) => setWorkTime(value)}
      />
      <BreakDurationInput
        value={breakTime / 60}
        onChange={(value) => setBreakTime(value)}
      />
      <SessionsInput value={session} onChange={(value) => setSession(value)} />
      <div className="flex w-full justify-end">
        <Button
          className="rounded px-4 py-2"
          onClick={() => {
            updateSettings("workDuration", workTime);
            updateSettings("breakDuration", breakTime);
            updateSettings("sessions", session);
            reset(); // Call reset
            toast("Session Settings has been saved", {
              description: "Sunday, December 03, 2023 at 9:00 AM",
              // Uncomment if you want the "Undo" action
              // action: {
              //   label: "Undo",
              //   onClick: () => reset(),
              // },
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
