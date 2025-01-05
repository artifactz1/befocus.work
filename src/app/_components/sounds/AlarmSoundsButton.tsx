import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

interface Alarm {
  name: string;
  filePath: string;
}

const alarmList: Alarm[] = [
  { name: "alarm1", filePath: "/public/sounds/alarm1.mp3" },
  { name: "alarm2", filePath: "/public/sounds/alarm2.mp3" },
  { name: "alarm3", filePath: "/public/sounds/alarm3.mp3" },
  { name: "alarm4", filePath: "/public/sounds/alarm4.mp3" },
  { name: "alarm5", filePath: "/public/sounds/alarm1.mp3" },
];

export default function AlarmSoundsButton() {
  return (
    <div>
      <Separator className="my-4 bg-white" />
      <h3 className="text-center"> Alarm</h3>
      <div className="flex-row space-y-2">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {/* <SelectLabel>Fruits</SelectLabel> */}
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {/* <Toggle
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
            /> */}
    </div>
  );
}
