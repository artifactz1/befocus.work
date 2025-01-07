"use client";

import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function AlarmSoundsButton() {
  const { sounds, alarmId, setAlarmId } = useSoundsStore();
  const [audio] = useState(new Audio()); // Create an audio element
  const audioRef = useRef(audio); // Use a ref to persist the audio element across renders

  // Provide a default value for alarmId if it's undefined or null
  const currentAlarm = alarmId || "alarm1";

    const [volume, setVolumeState] = useState(0.5); // Default volume to 0.5


  // Play the selected sound when the alarmId changes
  useEffect(() => {
    const selectedSound = sounds[alarmId];
    if (selectedSound && audioRef.current) {
      audioRef.current.src = selectedSound.url; // Update the audio source
      audioRef.current.load(); // Reload audio element with the new source
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [alarmId, sounds]); // Re-run effect whenever alarmId or sounds change

  const handleSelectChange = (value: string) => {
    if (value) {
      setAlarmId(value); // Safely update alarmId
    } else {
      console.warn("Invalid value selected:", value);
    }
  };

  return (
    <div>
      <Separator className="my-4 bg-white" />
      <h3 className="text-center">Alarm Sound</h3>
      <div className="flex-row space-y-2">
        <Select
          value={currentAlarm} // Ensure value is a string
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder="Select an alarm" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.keys(sounds)
                .filter((soundId) => !sounds[soundId]?.isCustom) // Only non-custom sounds
                .map((soundId) => (
                  <SelectItem key={soundId} value={soundId}>
                    {soundId}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

