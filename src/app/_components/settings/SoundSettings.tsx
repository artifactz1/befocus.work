"use client";

// import { CloudRain } from "lucide-react";
// import { useState } from "react";
// import ReactPlayer from "react-player";
// import { Toggle } from "~/components/ui/toggle";

// const SoundSettings = () => {
//   const [playing, setPlaying] = useState(false); // Controls playback state
//   const [volume, setVolume] = useState(0.8); // Controls volume, range: 0-1

//   return (
//     <main className="p-4">
//       <div className="flex items-center space-x-4">
//         <Toggle
//           pressed={playing}
//           onPressedChange={(pressed) => setPlaying(pressed)}
//           className={`border border-2 ${playing ? "text-white" : ""}`}
//         >
//           <CloudRain
//             className={`${playing ? "text-white" : "text-gray-600"}`}
//             size={24}
//           />
//           {/* {playing ? "On" : "Off"} */}
//         </Toggle>
//       </div>
//       <div className="mt-4">
//         {/* <label className="mb-2 block text-sm font-medium">Volume</label> */}
//         {/* <Slider
//   defaultValue={[volume * 100]} // Convert 0-1 range to 0-100 for slider
//   onValueChange={(value: number[]) => {
//     if (value.length > 0) {
//       setVolume(value[0] / 100); // Convert back to 0-1
//     }
//   }}
//   max={100}
//   step={1}
//   className="w-full"
// /> */}
//       </div>
//       <ReactPlayer
//         url="https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm"
//         playing={playing}
//         volume={volume}
//         config={{
//           youtube: { playerVars: { modestbranding: 1, showinfo: 0 } },
//         }}
//         width="0"
//         height="0"
//       />
//     </main>
//   );
// };

// export default SoundSettings;

// import { useState } from 'react';
// import { Toggle } from "~/components/ui/toggle";
// import { Slider } from "~/components/ui/slider";
// import { useSoundsStore } from '~/store/useSoundStore';
// import { CloudRain } from 'lucide-react';

// const SoundSettings = ({ soundId }: { soundId: string }) => {
//   const { sounds, toggleSound, setVolume } = useSoundsStore();
//   const sound = sounds[soundId];

//   return (
//     <main className="p-4">
//       <div className="flex items-center space-x-4">
//         <CloudRain className="text-blue-500" size={24} />
//         <span>Toggle Sound</span>
//         <Toggle
//           pressed={sound?.playing ?? false}
//           onPressedChange={() => toggleSound(soundId)} // Toggle sound globally
//           className={`${sound?.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
//         >
//           <CloudRain
//             className={`${
//               sound?.playing ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
//             }`}
//             size={24}
//           />
//         </Toggle>
//       </div>

//       <div className="mt-4">
//         <label className="mb-2 block text-sm font-medium">Volume</label>
//         <Slider
//           value={[sound?.volume ?? 0.8 * 100]} // Default to 80 if no volume is set
//           onValueChange={(value) => {
//             const newVolume = value[0] ?? 80; // Ensure value[0] is defined
//             setVolume(soundId, newVolume / 100); // Set volume globally
//           }}
//           max={100}
//           step={1}
//           className="w-full"
//         />
//       </div>
//     </main>
//   );
// };

// export default SoundSettings;

// app/components/SoundSettings.tsx
// import { useSoundsStore } from '~/store/useSoundStore';
// import { Toggle } from '~/components/ui/toggle';
// import { Slider } from '~/components/ui/slider';
// import { CloudRain } from 'lucide-react';

// const SoundSettings = ({ soundId }: { soundId: string }) => {
//   const { sounds, toggleSound, setVolume } = useSoundsStore();
//   const sound = sounds[soundId];

//   return (
//     <main className="p-4">
//       <div className="flex items-center space-x-4">
//         <CloudRain className="text-blue-500" size={24} />
//         <span>Toggle Sound</span>
//         <Toggle
//           pressed={sound?.playing ?? false}
//           onPressedChange={() => toggleSound(soundId)} // Toggle sound globally
//           className={`${sound?.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
//         >
//           <CloudRain
//             className={`${
//               sound?.playing ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
//             }`}
//             size={24}
//           />
//         </Toggle>
//       </div>

//       <div className="mt-4">
//         <label className="mb-2 block text-sm font-medium">Volume</label>
//         <Slider
//           value={[sound?.volume ?? 0.8 * 100]} // Default to 80 if no volume is set
//           onValueChange={(value) => {
//             const newVolume = value[0] ?? 80; // Ensure value[0] is defined
//             setVolume(soundId, newVolume / 100); // Set volume globally
//           }}
//           max={100}
//           step={1}
//           className="w-full"
//         />
//       </div>
//     </main>
//   );
// };

// export default SoundSettings;

// app/components/SoundSettings.tsx
import { CloudRain } from "lucide-react";
import { Slider } from "~/components/ui/slider";
import { Toggle } from "~/components/ui/toggle";
import { useSoundsStore } from "~/store/useSoundStore";

const SoundSettings = ({ soundId }: { soundId: string }) => {
  const { sounds, toggleSound, setVolume } = useSoundsStore();
  const sound = sounds[soundId];

  if (!sound) return null;

  return (
    <div className="p flex space-x-2">
      <Toggle
        pressed={sound.playing}
        onPressedChange={() => toggleSound(soundId)} // Toggle sound globally
        // className={`${sound.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
        className={"border border-white"}
      >
        {/* <CloudRain
          className={`${
            sound.playing
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
          size={24}
        /> */}
        <CloudRain
          className={`${
            sound.playing
            // ? "bg-gray-200 text-white"
            // : "bg-gray-200 text-gray-800"
          }`}
          size={24}
        />
      </Toggle>

      <Slider
        value={[sound.volume * 100]} // Default to the current volume (range 0-100)
        onValueChange={(value) => {
          const newVolume = value[0] ?? 80; // Default to 80 if value is undefined
          setVolume(soundId, newVolume / 100); // Set volume globally (range 0-1)
        }}
        max={100}
        step={1}
        className="w-full"
      />
    </div>
  );
};

export default SoundSettings;
