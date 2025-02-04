import { Minus, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
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
        <Label htmlFor="workDuration" className="text-md pb-3 font-bold">
          Rounds :
        </Label>
        <Counter value={value} />
        <div className="pb-3">(sessions)</div>
      </div>
      <div className="flex items-end space-x-2 pb-3">
        <Button
          onClick={decrement}
          variant="secondary"
          size="icon"
          // className="border-[0.25px] border-white"
        >
          <Minus height={12} width={12} />
        </Button>
        <Button onClick={increment} variant="secondary" size="icon">
          <Plus height={12} width={12} />
        </Button>
      </div>
    </div>
  );
};
