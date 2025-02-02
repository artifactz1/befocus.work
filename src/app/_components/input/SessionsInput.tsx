import { Minus, Plus } from "lucide-react";
import { Label } from "~/components/ui/label";
import Counter from "./Counter";

interface SessionsInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const SessionsInput: React.FC<SessionsInputProps> = ({
  value,
  onChange,
}) => {
  const increment = () => {
    console.log("Before increment:", value);
    onChange(value + 1);
    console.log("After increment:", value);
  };

  const decrement = () => {
    if (value > 1) {
      onChange(value - 1);
    } else {
      onChange(1);
    }
  };

  return (
    <div className="flex justify-between">
      <div className="flex items-end">
        <Label htmlFor="workDuration" className="text-md pb-2 font-bold">
          Rounds :
        </Label>
        <Counter value={value} />
        <div className="pb-2">(sessions)</div>
      </div>

      <div className="flex items-end space-x-2 pb-2">
        <button
          onClick={decrement}
          className="rounded border bg-gray-200 p-1 px-3 py-1 text-sm hover:bg-gray-300"
        >
          <Minus height={12} width={12} />
        </button>
        <button
          onClick={increment}
          className="rounded border bg-gray-200 p-1 px-3 py-1 text-sm hover:bg-gray-300"
        >
          <Plus height={12} width={12} />
        </button>
      </div>
    </div>
  );
};
