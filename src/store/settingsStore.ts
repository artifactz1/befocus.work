import { create } from "zustand";

interface SettingsState {
  sessions: number;
  workDuration: number;
  breakDuration: number;
  timer: number;
  isTimerRunning: boolean;
  setSessions: (sessions: number) => void;
  setWorkDuration: (duration: number) => void;
  setBreakDuration: (duration: number) => void;
  startTimer: (duration: number) => void;
  stopTimer: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sessions: 1,
  workDuration: 25,
  breakDuration: 5,
  timer: 0,
  isTimerRunning: false,
  setSessions: (sessions) => set({ sessions }),
  setWorkDuration: (duration) => set({ workDuration: duration }),
  setBreakDuration: (duration) => set({ breakDuration: duration }),
  startTimer: (duration) => set({ timer: duration, isTimerRunning: true }),
  stopTimer: () => set({ isTimerRunning: false }),
}));
