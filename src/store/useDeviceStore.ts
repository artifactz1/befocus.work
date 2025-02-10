import { create } from "zustand";

interface DeviceState {
  isLandscape: boolean;
  checkOrientation: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  isLandscape: window.innerWidth > window.innerHeight, // Initial state
  checkOrientation: () => {
    set({ isLandscape: window.innerWidth > window.innerHeight });
  },
}));
