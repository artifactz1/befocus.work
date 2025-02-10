import { create } from "zustand";

interface DeviceState {
  isLandscape: boolean;
  checkOrientation: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  isLandscape:
    typeof window !== "undefined" &&
    window.innerWidth > window.innerHeight &&
    window.innerWidth <= 1024, // Only evaluate on the client side
  checkOrientation: () => {
    if (typeof window !== "undefined") {
      set({
        isLandscape:
          window.innerWidth > window.innerHeight && window.innerWidth <= 1024, // Only mobile landscape check
      });
    }
  },
}));
