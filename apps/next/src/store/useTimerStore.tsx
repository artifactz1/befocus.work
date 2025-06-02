// import { create } from 'zustand'

// interface TimerState {
//   sessions: number
//   workDuration: number
//   breakDuration: number
//   currentSession: number
//   isWorking: boolean
//   timeLeft: number
//   isRunning: boolean
//   reset: () => void
//   resetCurrentTime: () => void
//   skipToNextSession: () => void
//   toggleTimer: () => void
//   decrementTime: () => void
//   isAlarmOn: boolean
//   updateSettings: (key: 'sessions' | 'workDuration' | 'breakDuration', value: number) => void
//   isHydrated: boolean
//   hydrateFromSettings: (settings: {
//     sessions: number
//     workDuration: number
//     breakDuration: number
//   }) => void
//   resetAll: () => void
//   setTimeLeft: (value: number) => void
//   setIsRunning: (value: boolean) => void
// }

// export const useTimerStore = create<TimerState>((set, get) => ({
//   sessions: 6,
//   // workDuration: 25 * 60,
//   workDuration: 25 * 60,
//   // workDuration: 10,
//   breakDuration: 5 * 60,
//   // breakDuration: 5,
//   currentSession: 1,
//   isWorking: true,
//   isAlarmOn: false,
//   timeLeft: 25 * 60,
//   // timeLeft: 10,
//   isRunning: false,
//   reset: () =>
//     set({
//       currentSession: 1,
//       isWorking: true,
//       timeLeft: get().workDuration,
//       isRunning: false,
//       isAlarmOn: false, // Resetting isAlarmOn to false
//     }),
//   resetCurrentTime: () =>
//     set({
//       isWorking: get().isWorking,
//       currentSession: get().currentSession,
//       timeLeft: get().isWorking ? get().workDuration : get().breakDuration,
//       isRunning: false,
//       isAlarmOn: false, // Resetting isAlarmOn to false
//     }),
//   skipToNextSession: () => {
//     const { isWorking, breakDuration, workDuration, currentSession } = get()
//     if (isWorking) {
//       set({ isWorking: false, timeLeft: breakDuration })
//     } else {
//       set({
//         isWorking: true,
//         timeLeft: workDuration,
//         currentSession: currentSession + 1,
//       })
//     }
//     set({ isRunning: false })
//   },
//   toggleTimer: () => set(state => ({ isRunning: !state.isRunning })),

//   decrementTime: () =>
//     set(state => {
//       if (state.timeLeft === 0) {
//         state.isRunning = false
//         state.timeLeft = 0
//         if (state.isAlarmOn === false) {
//           if (state.isWorking && state.currentSession < state.sessions) {
//             return { isWorking: false, timeLeft: state.breakDuration }
//           }
//           if (!state.isWorking) {
//             return {
//               isWorking: true,
//               currentSession: state.currentSession + 1,
//               timeLeft: state.workDuration,
//             }
//           }
//           return { isRunning: false, timeLeft: 0 }
//         }
//       }
//       return { timeLeft: state.timeLeft - 1 }
//     }),

//   updateSettings: (key, value) =>
//     set(state => ({
//       ...state,
//       [key]: value,
//     })),
//   isHydrated: false,
//   hydrateFromSettings: (settings: {
//     sessions: number
//     workDuration: number
//     breakDuration: number
//   }) =>
//     set({
//       sessions: settings.sessions,
//       workDuration: settings.workDuration,
//       breakDuration: settings.breakDuration,
//       timeLeft: settings.workDuration, // Reset timeLeft to match work duration
//       currentSession: 1,
//       isWorking: true,
//       isRunning: false,
//       isAlarmOn: false,
//       isHydrated: true,
//     }),
//   resetAll: () =>
//     set(state => ({
//       currentSession: 1,
//       isWorking: true,
//       timeLeft: state.workDuration,
//       isRunning: false,
//       isAlarmOn: false,
//     })),
//   setTimeLeft: (value: number) => set({ timeLeft: value }),
//   setIsRunning: (value: boolean) => set({ isRunning: value }),
// }))

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
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  currentSession: 1,
  isWorking: true,
  isAlarmOn: false,
  timeLeft: 25 * 60,
  isRunning: false,

  reset: () =>
    set({
      currentSession: 1,
      isWorking: true,
      timeLeft: get().workDuration,
      isRunning: false,
      isAlarmOn: false,
    }),

  resetCurrentTime: () =>
    set({
      isWorking: get().isWorking,
      currentSession: get().currentSession,
      timeLeft: get().isWorking ? get().workDuration : get().breakDuration,
      isRunning: false,
      isAlarmOn: false,
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

  // FIXED: Only reset timeLeft if no active timer session exists
  hydrateFromSettings: (settings: {
    sessions: number
    workDuration: number
    breakDuration: number
  }) => {
    const currentState = get()

    // Check if there's an active timer session (either running or paused with time remaining)
    const hasActiveSession = currentState.timeLeft > 0 && currentState.timeLeft < currentState.workDuration

    set({
      sessions: settings.sessions,
      workDuration: settings.workDuration,
      breakDuration: settings.breakDuration,
      // Only reset timeLeft if there's no active session
      timeLeft: hasActiveSession ? currentState.timeLeft : settings.workDuration,
      // Preserve current session state if active
      currentSession: hasActiveSession ? currentState.currentSession : 1,
      isWorking: hasActiveSession ? currentState.isWorking : true,
      isRunning: hasActiveSession ? currentState.isRunning : false,
      isAlarmOn: false,
      isHydrated: true,
    })
  },

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