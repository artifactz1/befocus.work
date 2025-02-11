"use client";

import { Timer } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";

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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="lg" className="lg:h-12 lg:w-32">
          <Timer />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="h-full w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:ml-[179px] sm:w-[392px] lg:translate-x-0"
      >
        <div className="flex h-full w-full select-none flex-col justify-end">
          <div className="mb-2 mt-4 text-lg font-bold">
            befocus/sessions-settings
          </div>
          <Separator className="my-4 bg-white" />

          <div className="flex flex-col space-y-6">
            <WorkDurationInput
              value={workTime / 60}
              onChange={(value) => setWorkTime(value)}
            />
            <BreakDurationInput
              value={breakTime / 60}
              onChange={(value) => setBreakTime(value)}
            />
            <SessionsInput
              value={session}
              onChange={(value) => setSession(value)}
            />
            <div className="flex w-full justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>Save</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your current session! Make sure to change your sessions
                      settings before starting.
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
        </div>
      </PopoverContent>
    </Popover>
  );
};
