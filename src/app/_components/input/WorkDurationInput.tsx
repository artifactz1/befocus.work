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
        <Label htmlFor="workDuration" className="text-md pb-2 font-bold">
          Work Duration :
        </Label>
        <Counter value={value} />
        <div className="pb-2">(min)</div>
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
