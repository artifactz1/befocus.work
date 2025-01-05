"use client";

import { Volume2 } from "lucide-react";
import { useEffect } from "react";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import GlobalPlayer from "../GlobalSoundsPlayer";
import AddSoundButton from "../sounds/AddSoundButton";
import SoundButton from "../sounds/SoundButton";
import ToggleAddMode from "../sounds/ToggleAddMode";
import ToggleDeleteModeButton from "../sounds/ToggleDeleteMode";

export default function SoundSettings() {
  const { sounds } = useSoundsStore();

  useEffect(() => {
    if (Object.keys(sounds).length <= 1) {
      useSoundsStore
        .getState()
        .addSound(
          "rain",
          "https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm",
          true,
        );
      useSoundsStore
        .getState()
        .addSound(
          "jazz",
          "https://www.youtube.com/watch?v=VwR3LBbL6Jk&ab_channel=SolaceCrossing",
          true,
        );
    }
  }, [sounds]);

  // useSoundsStore.getState().addSound('sound2', 'https://www.youtube.com/watch?v=VPFxZw5qUwE&ab_channel=CafeRelaxingMusic');
  return (
    <div className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
      <GlobalPlayer />
      <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
        <Volume2 />
        <div className="mb-2 mt-4 text-lg font-medium">befocus/sounds</div>
        <Separator className="my-4 bg-white" />
        <h3 className="text-center"> Alarm Sounds</h3>
        <div className="space-y-4">
          {Object.keys(sounds)
            .filter((soundId) => sounds[soundId]?.isCustom === false)
            .map((soundId) => (
              <SoundButton key={soundId} soundId={soundId} />
            ))}
        </div>
        <Separator className="my-4 bg-white" />
        <h3 className="text-center"> Ambient Sounds</h3>

        <div className="space-y-4">
          {Object.keys(sounds)
            .filter((soundId) => sounds[soundId]?.isCustom)
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
    </div>
  );
}
