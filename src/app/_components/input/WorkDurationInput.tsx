import { Label } from '~/components/ui/label';
import { Input } from "~/components/ui/input";

interface WorkDurationInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const WorkDurationInput: React.FC<WorkDurationInputProps> = ({
  value,
  onChange,
}) => (
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
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="border-gray-300 focus:border-black focus:ring-0"
    />
  </div>
);
