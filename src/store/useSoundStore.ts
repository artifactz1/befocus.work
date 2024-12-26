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
