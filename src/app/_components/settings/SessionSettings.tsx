"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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
    <div className="flex flex-col space-y-6">
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Save</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                current session! Make sure to change your sessions settings
                before starting.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
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
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
