
// import { Input } from "~/components/ui/input";
// import { Label } from "~/components/ui/label";
// import Counter from "./Counter";

// interface BreakDurationInputProps {
//   value: number;
//   onChange: (value: number) => void;
// }

// export const WorkDurationInput: React.FC<BreakDurationInputProps> = ({
//   value,
//   onChange,
// }) => (
//   <div className="flex flex-col">
//     <Label htmlFor="workDuration" className="mb-2 text-sm font-semibold">
//       Work Duration (min)
//     </Label>
//     <Input
//       id="workDuration"
//       type="number"
//       min="1"
//       value={value}
//       onChange={(e) => onChange(parseInt(e.target.value, 10) * 60 || 5)}
//       className="border-gray-300 focus:border-black focus:ring-0"
//     />
//     <Counter value={value} />
//   </div>
// );

import { Minus, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import Counter from "./Counter";

interface WorkDurationInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const WorkDurationInput: React.FC<WorkDurationInputProps> = ({
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
        <Label htmlFor="workDuration" className="text-md pb-3 font-bold">
          Work Duration :
        </Label>
        <Counter value={value} />
        <div className="pb-3">(min)</div>
      </div>

      <div className="flex items-end space-x-2 pb-3">
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
