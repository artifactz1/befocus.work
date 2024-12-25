import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface DurationInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  id: string;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  label,
  id,
}) => {
  // Sanitize and handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseInt(e.target.value, 10);
    onChange(isNaN(parsedValue) ? 0 : Math.max(parsedValue, 1)); // Ensure minimum value of 1
  };

  // Remove leading zeros on blur
  const handleBlur = () => {
    onChange(Math.max(value, 1)); // Ensure valid value
  };

  return (
    <div className="flex flex-col">
      <Label htmlFor={id} className="mb-2 text-sm font-medium text-gray-600">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className="border-gray-300 focus:border-black focus:ring-0"
      />
    </div>
  );
};
