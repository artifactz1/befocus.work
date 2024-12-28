// app/store/soundsStore.ts
import { create } from "zustand";

interface Sound {
  playing: boolean;
  volume: number;
  url: string; // URL for the sound
}

interface SoundsState {
  isDeleteMode: boolean;
  isAddMode: boolean;
  sounds: Record<string, Sound>; // Use Record instead of index signature
  toggleSound: (id: string) => void;
  toggleDeleteMode: () => void;
  toggleAddMode: () => void;
  setVolume: (id: string, volume: number) => void;
  addSound: (id: string, url: string, isCustom: boolean) => void;
  deleteSound: (id: string) => void;
}

export const useSoundsStore = create<SoundsState>((set) => ({
  sounds: {},
  isDeleteMode: false, // Initialize delete mode state
  isAddMode: false, // Initialize delete mode state
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
        [id]: { playing: false, volume: 0.5, url, isCustom: true },
      },
    })),
  deleteSound: (id) =>
    set((state) => {
      const newSounds = { ...state.sounds };
      delete newSounds[id];
      return { sounds: newSounds };
    }),
  toggleDeleteMode: () =>
    set((state) => ({
      ...state,
      isDeleteMode: !state.isDeleteMode,
    })),
  toggleAddMode: () =>
    set((state) => ({
      ...state,
      isAddMode: !state.isAddMode,
    })),
}));
