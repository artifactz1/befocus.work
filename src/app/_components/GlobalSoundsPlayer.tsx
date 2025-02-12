"use client";
// app/components/GlobalPlayer.tsx
import ReactPlayer from "react-player";
import { useSoundsStore } from "~/store/useSoundsStore";

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
              // light={true}
              url={sound.url}
              playing={sound.playing}
              volume={sound.volume}
              controls={false} // Don't show controls as it's controlled globally
              // muted={!sound.playing}
              muted={false}
              width="0"
              height="0"
              onReady={() => console.log("Ready")}
            />
          );
        })}
    </>
  );
};

export default GlobalPlayer;
