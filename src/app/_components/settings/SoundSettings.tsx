"use client";

import { CloudRain } from "lucide-react";
import { useState } from "react";
import ReactPlayer from "react-player";
import { Toggle } from "~/components/ui/toggle";

const SoundSettings = () => {
  const [playing, setPlaying] = useState(false); // Controls playback state
  const [volume, setVolume] = useState(0.8); // Controls volume, range: 0-1

  return (
    <main className="p-4">
      <div className="flex items-center space-x-4">
        <Toggle
          pressed={playing}
          onPressedChange={(pressed) => setPlaying(pressed)}
          className={`border border-2 ${playing ? "text-white" : ""}`}
        >
          <CloudRain
            className={`${playing ? "text-white" : "text-gray-600"}`}
            size={24}
          />
          {/* {playing ? "On" : "Off"} */}
        </Toggle>
      </div>
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">Volume</label>
        {/* <Slider
  defaultValue={[volume * 100]} // Convert 0-1 range to 0-100 for slider
  onValueChange={(value: number[]) => {
    if (value.length > 0) {
      setVolume(value[0] / 100); // Convert back to 0-1
    }
  }}
  max={100}
  step={1}
  className="w-full"
/> */}
      </div>
      <ReactPlayer
        url="https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm"
        playing={playing}
        volume={volume}
        config={{
          youtube: { playerVars: { modestbranding: 1, showinfo: 0 } },
        }}
        width="0"
        height="0"
      />
    </main>
  );
};

export default SoundSettings;
