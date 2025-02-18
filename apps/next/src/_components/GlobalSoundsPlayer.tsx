"use client";
// app/components/GlobalPlayer.tsx
import ReactPlayer from "react-player";
import { useSoundsStore } from "../store/useSoundsStore";

const GlobalPlayer = () => {
  const { sounds } = useSoundsStore();
  const soundKeys = Object.keys(sounds);

  return (
    <>
      {soundKeys
        .filter((key) => sounds[key]?.soundType !== "alarm")
        .map((key) => {
          const sound = sounds[key];

          // Check if sound exists before rendering the ReactPlayer
          if (!sound) return null;

          return (
            <ReactPlayer
              key={key}
              url={sound.url}
              playing={sound.playing}
              volume={sound.volume}
              controls={false} // Don't show controls as it's controlled globally
              width="0"
              height="0"
            />
          );
        })}
    </>
  );
};

export default GlobalPlayer;

// "use client";
// // app/components/GlobalPlayer.tsx
// import ReactPlayer from "react-player";
// import { useSoundsStore } from "~/store/useSoundsStore";

// interface GlobalPlayerProps {
//   type?: string | string[]; // Accept a single string or an array of strings
// }

// const GlobalPlayer: React.FC<GlobalPlayerProps> = ({ type }) => {
//   const { sounds } = useSoundsStore();
//   const soundKeys = Object.keys(sounds);

//   return (
//     <>
//       {soundKeys
//         .filter((key) => {
//           const sound = sounds[key];

//           // Filter by type if a type is provided
//           if (!sound) return false;
//           if (!type) return true; // If no type is provided, include all

//           const soundTypes = Array.isArray(type) ? type : [type];
//           return soundTypes.includes(sound.soundType);
//         })
//         .map((key) => {
//           const sound = sounds[key];

//           // Check if sound exists before rendering the ReactPlayer
//           if (!sound) return null;

//           return (
//             <ReactPlayer
//               key={key}
//               url={sound.url}
//               playing={sound.playing}
//               volume={sound.volume}
//               controls={false} // Don't show controls as it's controlled globally
//               width="0"
//               height="0"
//             />
//           );
//         })}
//     </>
//   );
// };

// export default GlobalPlayer;
