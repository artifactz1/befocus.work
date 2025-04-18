"use client";

import { Button } from "@repo/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/popover";
import { Separator } from "@repo/ui/separator";
import { Timer } from "lucide-react";

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
} from "@repo/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useTimerStore } from "~/store/useTimerStore";
import MenuButton from '../MenuButtons';
import { BreakDurationInput } from "../input/BreakDurationInput";
import { SessionsInput } from "../input/SessionsInput";
import { WorkDurationInput } from "../input/WorkDurationInput";

export const SessionSettings: React.FC = () => {
  const { sessions, workDuration, breakDuration, reset, updateSettings } =
    useTimerStore();

  const [workTime, setWorkTime] = useState(workDuration);
  const [breakTime, setBreakTime] = useState(breakDuration);
  const [session, setSession] = useState(sessions);

  function handleSave() {
    // if logged in saveon the backend
    // no matter what save on the client
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <MenuButton>
          <Timer />
        </MenuButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="h-full w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:-mr-[110px] sm:w-[392px] md:-mr-[138px] lg:ml-0 lg:mr-0"
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
