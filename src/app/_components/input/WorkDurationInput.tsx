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
    <div className="flex items-center">
      <Label htmlFor="workDuration" className="text-md font-bold">
        Work Duration:
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
