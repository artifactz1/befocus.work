"use client";

import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import SoundButton from "./SoundButton";

export default function AmbientSoundsButton() {
  const { sounds } = useSoundsStore();

  return (
    <main>
      <Separator className="my-4 bg-white" />
      <h3 className="text-left font-semibold mb-3"> Ambient Sounds</h3>
      <div className="space-y-4">
        {Object.keys(sounds)
          .filter((soundId) => sounds[soundId]?.soundType === "ambient")
          .map((soundId) => (
            <SoundButton key={soundId} soundId={soundId} />
          ))}
      </div>
    </main>
  );
}
