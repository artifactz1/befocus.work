'use client'

import type { Settings } from '@repo/api/db/schemas'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useStore } from 'zustand/react'
import { createStore } from 'zustand/vanilla'

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
  resetAll: () => void
  setTimeLeft: (value: number) => void
  setIsRunning: (value: boolean) => void
}

function createTimerStore(
  initial: { sessions: number; workDuration: number; breakDuration: number } | null,
) {
  const sessions = initial?.sessions ?? 6
  const workDuration = initial?.workDuration ?? 25 * 60
  const breakDuration = initial?.breakDuration ?? 5 * 60

  return createStore<TimerState>()((set, get) => ({
    sessions,
    workDuration,
    breakDuration,
    currentSession: 1,
    isWorking: true,
    isAlarmOn: false,
    timeLeft: workDuration,
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
}

type TimerStoreApi = ReturnType<typeof createTimerStore>

const TimerStoreContext = createContext<TimerStoreApi | undefined>(undefined)

function identity(state: TimerState): TimerState {
  return state
}

export function TimerStoreProvider({
  initialSettings,
  children,
}: {
  initialSettings: Pick<Settings, 'workDuration' | 'breakDuration' | 'numberOfSessions'> | null
  children: ReactNode
}) {
  const [store] = useState(() =>
    createTimerStore(
      initialSettings
        ? {
            sessions: initialSettings.numberOfSessions,
            workDuration: initialSettings.workDuration,
            breakDuration: initialSettings.breakDuration,
          }
        : null,
    ),
  )

  return <TimerStoreContext.Provider value={store}>{children}</TimerStoreContext.Provider>
}

export function useTimerStore(): TimerState
export function useTimerStore<T>(selector: (state: TimerState) => T): T
export function useTimerStore<T = TimerState>(selector?: (state: TimerState) => T): T {
  const store = useContext(TimerStoreContext)
  if (!store) {
    throw new Error('useTimerStore must be used within a TimerStoreProvider')
  }
  return useStore(store, selector ?? (identity as unknown as (state: TimerState) => T))
}
