import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface BreakDurationInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const BreakDurationInput: React.FC<BreakDurationInputProps> = ({
  value,
  onChange,
}) => (
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
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) * 60 || 0)}
      className="border-gray-300 focus:border-black focus:ring-0"
    />
  </div>
);
