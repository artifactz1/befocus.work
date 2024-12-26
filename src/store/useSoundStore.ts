// // src/store/soundStore.ts

// import { create } from "zustand";

// interface SoundState {
//   sounds: Record<string, { playing: boolean; volume: number; url: string }>;
//   toggleSound: (id: string) => void;
//   setVolume: (id: string, volume: number) => void;
//   setUrl: (id: string, url: string) => void;
// }

// export const useSoundStore = create<SoundState>((set) => ({
//   sounds: {},
//   toggleSound: (id) =>
//     set((state) => {
//       const currentSound = state.sounds[id];
//       return {
//         sounds: {
//           ...state.sounds,
//           [id]: {
//             playing: !currentSound?.playing, // Toggle sound state
//             volume: currentSound?.volume ?? 1, // Keep the previous volume
//             url: currentSound?.url ?? "", // Keep the previous URL
//           },
//         },
//       };
//     }),
//   setVolume: (id, volume) =>
//     set((state) => ({
//       sounds: {
//         ...state.sounds,
//         [id]: {
//           playing: state.sounds[id]?.playing ?? false, // Keep playing state intact
//           volume,
//           url: state.sounds[id]?.url ?? "", // Keep the previous URL
//         },
//       },
//     })),
//   setUrl: (id, url) =>
//     set((state) => ({
//       sounds: {
//         ...state.sounds,
//         [id]: {
//           playing: state.sounds[id]?.playing ?? false, // Keep playing state intact
//           volume: state.sounds[id]?.volume ?? 1, // Keep the previous volume
//           url,
//         },
//       },
//     })),
// }));

// app/store/soundsStore.ts
import { create } from "zustand";

interface Sound {
  playing: boolean;
  volume: number;
  url: string; // URL for the sound
}

interface SoundsState {
  sounds: Record<string, Sound>; // Use Record instead of index signature
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  addSound: (id: string, url: string) => void;
}

export const useSoundsStore = create<SoundsState>((set) => ({
  sounds: {},
  toggleSound: (id) =>
    set((state) => {
      const sound = state.sounds[id];
      if (sound) {
        sound.playing = !sound.playing;
      }
      return { sounds: { ...state.sounds } };
    }),
  setVolume: (id, volume) =>
    set((state) => {
      const sound = state.sounds[id];
      if (sound) {
        sound.volume = volume;
      }
      return { sounds: { ...state.sounds } };
    }),
  addSound: (id, url) =>
    set((state) => ({
      sounds: {
        ...state.sounds,
        [id]: { playing: false, volume: 0.5, url },
      },
    })),
}));
