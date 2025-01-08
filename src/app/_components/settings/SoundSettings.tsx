"use client";

import { Volume2 } from "lucide-react";
// import { useEffect } from "react";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import AddSoundButton from "../sounds/AddSoundButton";
import AlarmSoundsButton from "../sounds/AlarmSoundsButton";
import SoundButton from "../sounds/SoundButton";
import ToggleAddMode from "../sounds/ToggleAddMode";
import ToggleDeleteModeButton from "../sounds/ToggleDeleteMode";

export default function SoundSettings() {
  const { sounds } = useSoundsStore();

  return (
    <div className="flex h-full w-full select-none flex-col justify-end rounded-md no-underline outline-none">
      <Volume2 />
      <div className="mb-2 mt-4 text-lg font-medium">befocus/sounds</div>
      <AlarmSoundsButton />
      <Separator className="my-4 bg-white" />
      <h3 className="text-center"> Ambient Sounds</h3>

      <div className="space-y-4">
        {Object.keys(sounds)
          .filter((soundId) => sounds[soundId]?.soundType === "ambient")
          .map((soundId) => (
            <SoundButton key={soundId} soundId={soundId} />
          ))}

        {Object.keys(sounds)
          .filter((soundId) => sounds[soundId]?.soundType === "bgMusic")
          .map((soundId) => (
            <SoundButton key={soundId} soundId={soundId} />
          ))}
      </div>
      <AddSoundButton />
      <div className="mt-4 flex w-full items-center justify-center space-x-5 px-4 py-2">
        <ToggleAddMode />
        <ToggleDeleteModeButton />
      </div>
    </div>
  );
}
