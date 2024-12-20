import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface SettingsProps {
  sessions: number;
  workDuration: number;
  breakDuration: number;
  onSettingsChange: (key: string, value: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  sessions,
  workDuration,
  breakDuration,
  onSettingsChange,
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <Label
          htmlFor="workDuration"
          className="mb-2 text-sm font-medium text-gray-600"
        >
          Work (min)
        </Label>
        <Input
          id="workDuration"
          type="number"
          min="1"
          value={workDuration}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSettingsChange("workDuration", parseInt(e.target.value, 10) || 0)
          }
          className="border-gray-300 focus:border-black focus:ring-0"
        />
      </div>

      <div className="flex flex-col">
        <Label
          htmlFor="breakDuration"
          className="mb-2 text-sm font-medium text-gray-600"
        >
          Break (min)
        </Label>
        <Input
          id="breakDuration"
          type="number"
          min="1"
          value={breakDuration}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSettingsChange("breakDuration", parseInt(e.target.value, 10) || 0)
          }
          className="border-gray-300 focus:border-black focus:ring-0"
        />
      </div>

      <div className="flex flex-col">
        <Label
          htmlFor="sessions"
          className="mb-2 text-sm font-medium text-gray-600"
        >
          Sessions
        </Label>
        <div className="flex flex-row">
          <Input
            id="sessions"
            type="number"
            min="1"
            value={sessions}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSettingsChange("sessions", parseInt(e.target.value, 10) || 0)
            }
            className="w-full border-gray-300 focus:border-black focus:ring-0"
          />
          {/* <Slider
            defaultValue={[5]}
            max={20}
            step={1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSettingsChange("sessions", parseInt(e.target.value, 10) || 0)
            }
            className="w-full border-gray-300 focus:border-black focus:ring-0"
          /> */}
        </div>
      </div>
    </div>
  );
};
