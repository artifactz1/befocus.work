import { create } from "zustand";

interface DeviceState {
  isLandscape: boolean;
  checkOrientation: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  isLandscape: false,
  checkOrientation: () => {
    set({ isLandscape: window.innerWidth > window.innerHeight && window.innerWidth < 1024 });
  },
}));
