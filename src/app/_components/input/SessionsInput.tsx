import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface SessionsInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const SessionsInput: React.FC<SessionsInputProps> = ({
  value,
  onChange,
}) => (
  <div className="flex flex-col">
    <Label htmlFor="sessions" className="mb-2 text-sm font-semibold">
      Rounds
    </Label>
    <Input
      id="sessions"
      type="number"
      min="1"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="border-gray-300 focus:border-black focus:ring-0"
    />
  </div>
);
