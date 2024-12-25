import { create } from "zustand";

interface TimerState {
  sessions: number;
  workDuration: number;
  breakDuration: number;
  currentSession: number;
  isWorking: boolean;
  timeLeft: number;
  isRunning: boolean;
  reset: () => void;
  skipToNextSession: () => void;
  toggleTimer: () => void;
  decrementTime: () => void;
  updateSettings: (
    key: "sessions" | "workDuration" | "breakDuration",
    value: number,
  ) => void;
}

// export const useTimerStore = create<TimerState>((set) => ({
//   sessions: 4,
//   workDuration: 25,
//   breakDuration: 5,
//   updateTimer: (key, value) =>
//     set((state) => ({
//       ...state,
//       [key]: value,
//     })),
// }));

export const useTimerStore = create<TimerState>((set, get) => ({
  sessions: 6,
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  currentSession: 1,
  isWorking: true,
  timeLeft: 25 * 60,
  isRunning: false,
  reset: () =>
    set({
      currentSession: 1,
      isWorking: true,
      timeLeft: get().workDuration,
      isRunning: false,
    }),
  skipToNextSession: () => {
    const { isWorking, breakDuration, workDuration, sessions, currentSession } =
      get();
    if (isWorking) {
      set({ isWorking: false, timeLeft: breakDuration });
    } else {
      set({
        isWorking: true,
        timeLeft: workDuration,
        currentSession: Math.min(currentSession + 1, sessions),
      });
    }
    set({ isRunning: false });
  },
  toggleTimer: () => set((state) => ({ isRunning: !state.isRunning })),
  decrementTime: () =>
    set((state) => {
      if (state.timeLeft === 0) {
        if (state.isWorking && state.currentSession < state.sessions) {
          return { isWorking: false, timeLeft: state.breakDuration };
        } else if (!state.isWorking) {
          return {
            isWorking: true,
            currentSession: state.currentSession + 1,
            timeLeft: state.workDuration,
          };
        } else {
          return { isRunning: false, timeLeft: 0 };
        }
      }
      return { timeLeft: state.timeLeft - 1 };
    }),
  // updateSettings: (key, value) => {
  //   set((state) => {
  //     const newState = { ...state };
  //     if (key === 'workDuration' || key === 'breakDuration') {
  //       newState[key] = value * 60;
  //     } else {
  //       newState[key] = value;
  //     }
  //     return newState;
  //   });
  // },
  updateSettings: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
    })),
}));
