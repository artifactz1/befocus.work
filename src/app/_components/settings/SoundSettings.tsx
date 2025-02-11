"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useSoundsStore } from "~/store/useSoundsStore";
import AddSoundButton from "../sounds/AddSoundButton";
import AlarmSoundsButton from "../sounds/AlarmSoundsButton";
import AmbientSoundsButton from "../sounds/AmbientSoundsButton";
import BgMusicSoundsButton from "../sounds/BgMusicSoundsButton";
import ToggleAddMode from "../sounds/ToggleAddMode";
import ToggleDeleteModeButton from "../sounds/ToggleDeleteMode";

export default function SoundSettings() {
  const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false);
  const { setSoundSettingsOpen } = useSoundsStore();

  useEffect(() => {
    setSoundSettingsOpen(isSoundOpen);
  }, [isSoundOpen, setSoundSettingsOpen]);
  return (
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
      <PopoverContent
        align="center"
        className="max-h-[500px] w-[90vw] gap-3 overflow-y-hidden rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 hover:overflow-y-auto sm:ml-[82px] sm:w-[392px] md:mx-10 lg:mx-0"
      >
        <div className="flex w-full select-none flex-col justify-end rounded-md no-underline outline-none">
          <Volume2 />
          <div className="mb-2 mt-4 text-lg font-bold">befocus/sounds</div>
          <AlarmSoundsButton />
          <AmbientSoundsButton />
          <BgMusicSoundsButton />
          <AddSoundButton />
          <div className="mt-4 flex w-full items-center justify-center space-x-2">
            <ToggleAddMode />
            <ToggleDeleteModeButton />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
