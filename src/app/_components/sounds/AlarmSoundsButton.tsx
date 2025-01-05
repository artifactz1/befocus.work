import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function AlarmSoundsButton() {
  const { sounds, alarmId, setAlarmId } = useSoundsStore();
  
  return (
    <div>
      <Separator className="my-4 bg-white" />
      <h3 className="text-center">Alarm</h3>
      <div className="flex-row space-y-2">
        <Select
          value={alarmId} // Bind the selected alarm to the current state
          onValueChange={(value) => setAlarmId(value)} // Update the alarmId on selection
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an alarm" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(sounds)
              .filter((soundId) => !sounds[soundId]?.isCustom) // Only include non-custom sounds
              .map((soundId) => (
                <SelectItem key={soundId} value={soundId}>
                  {soundId}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
