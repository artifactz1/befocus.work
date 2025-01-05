"use client";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "~/components/ui/select";
// import { Separator } from "~/components/ui/separator";
// import { useSoundsStore } from "~/store/useSoundsStore";

// export default function AlarmSoundsButton() {
//   const { sounds, alarmId, setAlarmId } = useSoundsStore();

//   return (
//     <div>
//       <Separator className="my-4 bg-white" />
//       <h3 className="text-center">Alarm</h3>
//       <div className="flex-row space-y-2">
//         <Select
//           value={alarmId} // Bind the selected alarm to the current state
//           onValueChange={(value) => setAlarmId(value)} // Update the alarmId on selection
//         >
//           <SelectTrigger className="w-full">
//             <SelectValue placeholder="Select an alarm" />
//           </SelectTrigger>
//           <SelectContent>
//             {Object.keys(sounds)
//               .filter((soundId) => !sounds[soundId]?.isCustom) // Only include non-custom sounds
//               .map((soundId) => (
//                 <SelectItem key={soundId} value={soundId}>
//                   {soundId}
//                 </SelectItem>
//               ))}
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   );
// }

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "~/components/ui/select";
// import { Separator } from "~/components/ui/separator";
// import { useSoundsStore } from "~/store/useSoundsStore";

// export default function AlarmSoundsButton() {
//   const { sounds, alarmId, setAlarmId } = useSoundsStore();

//   // Ensure `alarmId` has a fallback value
//   const currentAlarm = alarmId || "default";

//   return (
//     <div>
//       <Separator className="my-4 bg-white" />
//       <h3 className="text-center">Alarm</h3>
//       <div className="flex-row space-y-2">
//         <Select
//           value={currentAlarm} // Bind the selected alarm to the current state
//           onValueChange={(value) => {
//             if (value) {
//               setAlarmId(value); // Ensure `setAlarmId` only receives valid values
//             } else {
//               console.warn("Invalid alarm selected:", value);
//             }
//           }}
//         >
//           <SelectTrigger className="w-full">
//             <SelectValue placeholder="Select an alarm" />
//           </SelectTrigger>
//           <SelectContent>
//             {Object.keys(sounds)
//               .filter((soundId) => !sounds[soundId]?.isCustom) // Only include non-custom sounds
//               .map((soundId) => (
//                 <SelectItem key={soundId} value={soundId}>
//                   {soundId}
//                 </SelectItem>
//               ))}
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   );
// }

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function AlarmSoundsButton() {
  const { sounds, alarmId, setAlarmId } = useSoundsStore();

  // Provide a default value for alarmId if it's undefined or null
  const currentAlarm = alarmId || "";

  console.log("alarmId:", alarmId);
  console.log("sounds:", sounds);

  return (
    <div>
      <Separator className="my-4 bg-white" />
      <h3 className="text-center">Alarm</h3>
      <div className="flex-row space-y-2">
        <Select
          value={currentAlarm} // Ensure value is a string
          onValueChange={(value) => {
            if (value) {
              setAlarmId(value); // Safely update alarmId
            } else {
              console.warn("Invalid value selected:", value);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an alarm" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.keys(sounds)
                .filter((soundId) => !sounds[soundId]?.isCustom) // Only non-custom sounds
                .map((soundId) => (
                  <SelectItem key={soundId} value={soundId}>
                    {soundId}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
