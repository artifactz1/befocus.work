import { Label } from "~/components/ui/label";
import Counter from "./Counter";

interface BreakDurationInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const BreakDurationInput: React.FC<BreakDurationInputProps> = ({
  value,
  onChange,
}) => {
  const increment = () => {
    console.log("Before increment:", value);
    onChange(value * 60 + 300);
    console.log("After increment:", value);
  };

  const decrement = () => {
    if (value > 5) {
      onChange(value * 60 - 300);
    } else {
      onChange(300);
    }
  };

  return (
    <div className="flex items-center">
      <Label htmlFor="breakDuration" className="text-md font-bold">
        Break Duration:
      </Label>
      <Counter value={value} />
      <div>(min)</div>
      <div className="flex items-center opacity-0 hover:opacity-100">
        <button
          onClick={decrement}
          className="rounded border bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
        >
          -
        </button>
        <button
          onClick={increment}
          className="rounded border bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
        >
          +
        </button>
      </div>
    </div>
  );
};
