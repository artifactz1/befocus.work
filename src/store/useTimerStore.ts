import { create } from "zustand";

interface TimerState {
  sessions: number;
  workDuration: number;
  breakDuration: number;
  updateTimer: (
    key: "sessions" | "workDuration" | "breakDuration",
    value: number,
  ) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  sessions: 4,
  workDuration: 25,
  breakDuration: 5,
  updateTimer: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
    })),
}));
