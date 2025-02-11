"use client";

import { Timer } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { DarkModeToggle } from "../DarkModeToggle";
import ToDoList from "../to-do-list/ToDoList";
import { SessionSettings } from "./SessionSettings";
import SoundSettings from "./SoundSettings";

export default function MenuSettings() {
  return (
    <main className="hidden sm:flex sm:items-center sm:justify-center sm:space-x-1">
      <ToDoList />
      <SoundSettings />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="lg" className="lg:h-12 lg:w-32">
            <Timer />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="h-full w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:w-[500px] lg:w-[392px]"
        >
          <div className="flex h-full w-full select-none flex-col justify-end">
            <div className="mb-2 mt-4 text-lg font-bold">
              befocus/sessions-settings
            </div>
            <Separator className="my-4 bg-white" />
            <SessionSettings />
          </div>
        </PopoverContent>
      </Popover>
      <DarkModeToggle />
    </main>
  );
}
