"use client";

// app/components/SoundSettings.tsx
import { VolumeX } from "lucide-react";
import { Slider } from "~/components/ui/slider";
import { Toggle } from "~/components/ui/toggle";
import { useSoundsStore } from "~/store/useSoundStore";

const SoundSettings = ({ soundId }: { soundId: string }) => {
  const { sounds, toggleSound, setVolume } = useSoundsStore();
  const sound = sounds[soundId];

  if (!sound) return null;

  return (
    <div className="p flex space-x-2">
      <Toggle
        pressed={sound.playing}
        onPressedChange={() => toggleSound(soundId)} // Toggle sound globally
        // className={`${sound.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
        className={"border border-white"}
      >
        {/* <CloudRain
          className={`${
            sound.playing
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
          size={24}
        /> */}
        {/* <CloudRain
          className={`${
            sound.playing
            // ? "bg-gray-200 text-white"
            // : "bg-gray-200 text-gray-800"
          }`}
          size={24}
        /> */}
        {sound.playing ? soundId : <VolumeX/>}
      </Toggle>

      <Slider
        value={[sound.volume * 100]} // Default to the current volume (range 0-100)
        onValueChange={(value) => {
          const newVolume = value[0] ?? 80; // Default to 80 if value is undefined
          setVolume(soundId, newVolume / 100); // Set volume globally (range 0-1)
        }}
        max={100}
        step={1}
        className="w-full"
      />
    </div>
  );
};

export default SoundSettings;
