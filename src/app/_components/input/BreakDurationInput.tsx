import { Minus, Plus } from "lucide-react";
import { Label } from "~/components/ui/label";
import Counter from "./Counter";
import { Button } from '~/components/ui/button';

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
    <div className="flex justify-between">
      <div className="flex items-end">
        <Label htmlFor="workDuration" className="text-md pb-2 font-bold">
          Break Duration :
        </Label>
        <Counter value={value} type={"settings"} />
        <div className="pb-2">(min)</div>
      </div>
      <div className="flex items-end space-x-2 pb-2">
        <Button onClick={decrement} variant="secondary" size="icon">
          <Minus height={12} width={12} />
        </Button>
        <Button onClick={increment} variant="secondary" size="icon">
          <Plus height={12} width={12} />
        </Button>
      </div>
    </div>
  );
};
