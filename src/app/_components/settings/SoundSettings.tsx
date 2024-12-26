"use client";

import ReactPlayer from "react-player";

const SoundSettings = () => {
  return (
    <ReactPlayer
      url="https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm"
      playing={true}
      controls={true}
      config={{
        youtube: { playerVars: { modestbranding: 1, showinfo: 0 } },
      }}
      width="0"
      height="0"
    />
  );
};

export default SoundSettings;
