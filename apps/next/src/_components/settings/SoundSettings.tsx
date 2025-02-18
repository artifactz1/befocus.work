"use client";

import { Volume2 } from "lucide-react";
import AddSoundButton from "../sounds/AddSoundButton";
import AlarmSoundsButton from "../sounds/AlarmSoundsButton";
import AmbientSoundsButton from "../sounds/AmbientSoundsButton";
import BgMusicSoundsButton from "../sounds/BgMusicSoundsButton";
import ToggleAddMode from "../sounds/ToggleAddMode";
import ToggleDeleteModeButton from "../sounds/ToggleDeleteMode";

export default function SoundSettings() {
  return (
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
  );
}
