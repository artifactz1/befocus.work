"use client";

// app/components/SoundSettings.tsx
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Toggle } from "~/components/ui/toggle";
import { useSoundsStore } from "~/store/useSoundsStore";

const SoundSettings = ({ soundId }: { soundId: string }) => {
  const { sounds, toggleSound, setVolume, isDeleteMode, deleteSound } =
    useSoundsStore();
  const sound = sounds[soundId];

  if (!sound) return null;

  const handleDelete = () => {
    deleteSound(soundId);
  };

  return (
    <main>
      {isDeleteMode ? (
        <div className="flex-row space-y-2">
          <label className="p-1">{soundId}</label>
          <div className="flex space-x-2">
            <Toggle
              pressed={sound.playing}
              onPressedChange={() => toggleSound(soundId)} // Toggle sound globally
              // className={`${sound.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
              className={"border border-white"}
            >
              {sound.playing ? <Volume2 /> : <VolumeX />}
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
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          {/* <label className="p-1">{soundId}</label> */}
          <Button onClick={handleDelete}>Delete {soundId}</Button>
        </div>
      )}
    </main>
  );
};

export default SoundSettings;
