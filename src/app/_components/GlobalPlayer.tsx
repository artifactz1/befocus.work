// Example usage of ReactPlayer in a parent component, such as MenuSettings.tsx
import ReactPlayer from "react-player";
import { useSoundStore } from "~/store/useSoundStore"; // Adjust the import path as needed

const GlobalPlayer = () => {
  const { playing, volume } = useSoundStore();

  return (
    <ReactPlayer
      url="https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm"
      playing={playing}
      volume={volume}
      config={{
        youtube: { playerVars: { modestbranding: 1, showinfo: 0 } },
      }}
      width="0"
      height="0"
    />
  );
};

export default GlobalPlayer;
