"use client";

import { useState } from "react";
import ReactPlayer from "react-player";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function AlarmSoundsButton() {
  const {
    sounds,
    alarmId,
    setAlarmId,
    setVolume,
    alarmVolume,
    setAlarmVolume,
    toggleSound,
  } = useSoundsStore();

  const sound = sounds[alarmId];

  const [playedOnce, setPlayedOnce] = useState(false); // Track if the video has played once

  const handleEnded = () => {
    setPlayedOnce(true); // Mark as played once
  };

  if (!sound) return null;

  // const handleSelectChange = (value: string) => {
  //   if (value) {
  //     setAlarmId(value); // Safely update alarmId
  //     toggleSound(value);
  //   } else {
  //     console.warn("Invalid value selected:", value);
  //   }
  // };

  const handleSelectChange = (value: string) => {
    if (value && value !== alarmId) {
      // Only update if the value is different
      setAlarmId(value); // Update alarmId
      toggleSound(value); // Trigger sound toggle
    } else if (value === alarmId) {
      console.log("Same alarm selected, no action taken.");
    } else {
      console.warn("Invalid value selected:", value);
    }
  };

  return (
    <div>
      {!playedOnce && (
        <ReactPlayer
          url={sound.url} // Replace with your media URL
          playing={sound.playing} // Start playing the video
          volume={sound.volume}
          controls={false}
          // onEnded={handleEnded} // Triggered when video ends
          width="0"
          height="0"
        />
      )}

      <Separator className="my-4 bg-white" />
      <h3 className="text-center">Alarm Sound</h3>
      <div className="flex-row space-y-4">
        <Select
          value={alarmId} // Ensure value is a string
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder="Select an alarm" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.keys(sounds)
                .filter((soundId) => sounds[soundId]?.soundType === "alarm") // Only alarm sounds
                .map((soundId) => (
                  <SelectItem key={soundId} value={soundId}>
                    {soundId}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="space-y-2">
          <label className="block text-center text-sm">Volume</label>
          <Slider
            value={[sound.volume * 100]} // Default to the current volume (range 0-100)
            onValueChange={(value) => {
              const newVolume = value[0] ?? 80; // Default to 80 if value is undefined
              setVolume(alarmId, newVolume / 100); // Set volume globally (range 0-1)
            }}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
