"use client";

import { NotebookPen, Plus, Timer, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import { useTodoStore } from "~/store/useToDoStore";
import { DarkModeToggle } from "../DarkModeToggle";
import ToDoList from "../to-do-list/ToDoList";
import { SessionSettings } from "./SessionSettings";
import SoundSettings from "./SoundSettings";

export default function MenuSettings() {
  const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false);
  const { setSoundSettingsOpen } = useSoundsStore();
  const { toggleAdd } = useTodoStore();

  useEffect(() => {
    setSoundSettingsOpen(isSoundOpen);
  }, [isSoundOpen, setSoundSettingsOpen]);

  return (
    <div className="flex items-center justify-center space-x-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="lg" className="lg:h-12 lg:w-32">
            <NotebookPen />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-screen min-h-[500px] w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:w-[500px] lg:w-[392px]"
        >
          <ToDoList />
          <Button
            onClick={() => toggleAdd()}
            className="absolute bottom-6 right-6"
          >
            <Plus />
          </Button>
        </PopoverContent>
      </Popover>
      <Popover open={isSoundOpen} onOpenChange={setIsSoundOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="lg:h-12 lg:w-32"
            onClick={() => setIsSoundOpen(!isSoundOpen)}
          >
            <Volume2 />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-[500px] w-[90vw] gap-3 overflow-y-hidden rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 hover:overflow-y-auto sm:w-[500px] lg:w-[392px]">
          <SoundSettings />
        </PopoverContent>
      </Popover>
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
    </div>
  );
}
