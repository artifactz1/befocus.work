import { create } from 'zustand'

interface TimerState {
  sessions: number
  workDuration: number
  breakDuration: number
  currentSession: number
  isWorking: boolean
  timeLeft: number
  isRunning: boolean
  reset: () => void
  resetCurrentTime: () => void
  skipToNextSession: () => void
  skipToPrevSession: () => void
  toggleTimer: () => void
  decrementTime: () => void
  isAlarmOn: boolean
  updateSettings: (key: 'sessions' | 'workDuration' | 'breakDuration', value: number) => void
  isHydrated: boolean
  hydrateFromSettings: (settings: {
    sessions: number
    workDuration: number
    breakDuration: number
  }) => void
  resetAll: () => void
  setTimeLeft: (value: number) => void
  setIsRunning: (value: boolean) => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  sessions: 6,
  // workDuration: 25 * 60,
  workDuration: 25 * 60,
  // workDuration: 10,
  breakDuration: 5 * 60,
  // breakDuration: 5,
  currentSession: 1,
  isWorking: true,
  isAlarmOn: false,
  timeLeft: 25 * 60,
  // timeLeft: 10,
  isRunning: false,
  reset: () =>
    set({
      currentSession: 1,
      isWorking: true,
      timeLeft: get().workDuration,
      isRunning: false,
      isAlarmOn: false, // Resetting isAlarmOn to false
    }),
  resetCurrentTime: () =>
    set({
      isWorking: get().isWorking,
      currentSession: get().currentSession,
      timeLeft: get().isWorking ? get().workDuration : get().breakDuration,
      isRunning: false,
      isAlarmOn: false, // Resetting isAlarmOn to false
    }),
  skipToNextSession: () => {
    const { isWorking, breakDuration, workDuration, currentSession } = get()
    if (isWorking) {
      set({ isWorking: false, timeLeft: breakDuration })
    } else {
      set({
        isWorking: true,
        timeLeft: workDuration,
        currentSession: currentSession + 1,
      })
    }
    set({ isRunning: false })
  },
  skipToPrevSession: () => {
    const { isWorking, breakDuration, workDuration, currentSession } = get()

    if (!isWorking) {
      // Currently on break -> go back to work session of the same currentSession
      set({ isWorking: true, timeLeft: workDuration })
    } else {
      // Currently on work -> go back to break of previous session if possible
      if (currentSession !== 1) {


        const newSession = currentSession > 1 ? currentSession - 1 : 1
        set({
          isWorking: false,
          timeLeft: breakDuration,
          currentSession: newSession,
        })

      }
    }

    set({ isRunning: false })
  },

  toggleTimer: () => set(state => ({ isRunning: !state.isRunning })),

  decrementTime: () =>
    set(state => {
      if (state.timeLeft === 0) {
        state.isRunning = false
        state.timeLeft = 0
        if (state.isAlarmOn === false) {
          if (state.isWorking && state.currentSession < state.sessions) {
            return { isWorking: false, timeLeft: state.breakDuration }
          }
          if (!state.isWorking) {
            return {
              isWorking: true,
              currentSession: state.currentSession + 1,
              timeLeft: state.workDuration,
            }
          }
          return { isRunning: false, timeLeft: 0 }
        }
      }
      return { timeLeft: state.timeLeft - 1 }
    }),

  updateSettings: (key, value) =>
    set(state => ({
      ...state,
      [key]: value,
    })),
  isHydrated: false,
  hydrateFromSettings: (settings: {
    sessions: number
    workDuration: number
    breakDuration: number
  }) =>
    set({
      sessions: settings.sessions,
      workDuration: settings.workDuration,
      breakDuration: settings.breakDuration,
      timeLeft: settings.workDuration, // Reset timeLeft to match work duration
      currentSession: 1,
      isWorking: true,
      isRunning: false,
      isAlarmOn: false,
      isHydrated: true,
    }),
  resetAll: () =>
    set(state => ({
      currentSession: 1,
      isWorking: true,
      timeLeft: state.workDuration,
      isRunning: false,
      isAlarmOn: false,
    })),
  setTimeLeft: (value: number) => set({ timeLeft: value }),
  setIsRunning: (value: boolean) => set({ isRunning: value }),
}))

