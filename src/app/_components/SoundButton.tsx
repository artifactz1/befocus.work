"use client";
// src/components/SoundButton.tsx
import { useState } from "react";
import ReactPlayer from "react-player";
import { useSoundsStore } from "~/store/useSoundStore";

interface SoundButtonProps {
  soundId: string;
  url: string;
}

const SoundButton = ({ soundId, url }: SoundButtonProps) => {
  const { sounds, toggleSound, setVolume } = useSoundsStore();
  const [localVolume, setLocalVolume] = useState(
    sounds[soundId]?.volume ?? 0.8,
  );

  return (
    <div className="flex items-center space-x-4">
      <button onClick={() => toggleSound(soundId)}>
        {sounds[soundId]?.playing ? "Pause" : "Play"} Sound
      </button>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={localVolume * 100}
          onChange={(e) => {
            const newVolume = parseInt(e.target.value) / 100;
            setLocalVolume(newVolume);
            setVolume(soundId, newVolume);
          }}
          className="w-full"
        />
      </div>

      <ReactPlayer
        url={url}
        playing={sounds[soundId]?.playing}
        volume={sounds[soundId]?.volume}
        width="0"
        height="0"
      />
    </div>
  );
};

export default SoundButton;
