'use client'

import type { Settings } from '@repo/api/db/schemas'
import type { BlockRecord } from '@repo/types/blocks'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useStore } from 'zustand/react'
import { createStore } from 'zustand/vanilla'
import { api } from '~/lib/api.client'
import { useSession } from '~/lib/auth.client'
import { appendGuestRecords, createRecordQueue, queueKey } from '~/lib/blocks/block-records'
import {
  adjust,
  buildSeed,
  canAdjust,
  createRun,
  legacy,
  pause,
  pendingRecord,
  type Run,
  resetBlock,
  resetSession,
  type SeedBlock,
  type Step,
  seed,
  skip,
  start,
  startNext,
  tick,
  timeLeftSeconds,
} from '~/lib/blocks/blocks'
import { finishedRecords } from '~/lib/logs/summary'
import { startAction } from '~/lib/session/session'

interface TimerState extends Run {
  sessions: number
  workDuration: number
  breakDuration: number
  // Derived from the run (see legacy() in lib/blocks/blocks)
  currentSession: number
  isWorking: boolean
  timeLeft: number
  isRunning: boolean
  tick: (now: number) => void
  reset: () => void
  resetCurrentTime: () => void
  skipToNextSession: () => void
  skipToPrevSession: () => void
  adjust: (minutes: number) => boolean
  startNext: () => void
  seedBlocks: (input: { sessionId: string; blocks: SeedBlock[] }) => boolean
  updateSettings: (key: 'sessions' | 'workDuration' | 'breakDuration', value: number) => void
  resetAll: () => void
  askBeforeStart: boolean
  card: 'start' | 'edit' | null
  requestStart: () => void
  openCard: (mode: 'start' | 'edit') => void
  closeCard: () => void
  applySettings: (
    values: {
      workDuration: number
      breakDuration: number
      sessions: number
      askBeforeStart: boolean
    },
    opts: { run: boolean },
  ) => void
  setAskBeforeStart: (value: boolean) => void
  /** Snapshot of the session that just ended; kept until resetAll (not persisted). */
  finished: { sessionId: string; records: BlockRecord[] } | null
}

const newId = () => crypto.randomUUID()

const runOf = (s: TimerState): Run => ({
  sessionId: s.sessionId,
  blocks: s.blocks,
  currentBlockId: s.currentBlockId,
  status: s.status,
  endsAt: s.endsAt,
  remainingMs: s.remainingMs,
  segmentStartedAt: s.segmentStartedAt,
  activeMs: s.activeMs,
  completed: s.completed,
})

function createTimerStore(
  initial: {
    sessions: number
    workDuration: number
    breakDuration: number
    askBeforeStart: boolean
  } | null,
  onRecords: (records: BlockRecord[]) => void,
) {
  const sessions = initial?.sessions ?? 6
  const workDuration = initial?.workDuration ?? 25 * 60
  const breakDuration = initial?.breakDuration ?? 5 * 60
  const run0 = createRun(newId(), buildSeed({ workDuration, breakDuration, sessions }, newId))

  return createStore<TimerState>()((set, get) => {
    // One set per transition: run fields, derived legacy fields, then the records sink.
    const commit = (next: Run | Step, extra: Partial<TimerState> = {}, now = Date.now()) => {
      const step = 'run' in next ? next : { run: next, records: [] }
      const sess = extra.sessions ?? get().sessions
      const before = get()
      const finished =
        step.run.completed && !before.completed
          ? { sessionId: before.sessionId, records: finishedRecords(before.blocks, step.records) }
          : undefined
      set({
        ...step.run,
        ...legacy(step.run, now, sess),
        ...(finished ? { finished } : {}),
        ...extra,
      })
      if (step.records.length > 0) onRecords(step.records)
    }
    const fresh = () => {
      const { workDuration: w, breakDuration: b, sessions: n } = get()
      return {
        sessionId: newId(),
        seed: buildSeed({ workDuration: w, breakDuration: b, sessions: n }, newId),
      }
    }
    const resetWith = (
      s: { workDuration: number; breakDuration: number; sessions: number },
      now: number,
      extra: Partial<TimerState> = {},
      run = false,
    ) => {
      const step = resetSession(runOf(get()), now, newId(), buildSeed(s, newId))
      commit(run ? { ...step, run: start(step.run, now) } : step, extra, now)
    }

    return {
      ...run0,
      ...legacy(run0, Date.now(), sessions),
      sessions,
      workDuration,
      breakDuration,
      askBeforeStart: initial?.askBeforeStart ?? true,
      finished: null,
      card: null,
      tick: now => {
        const state = get()
        const run = runOf(state)
        const step = tick(run, now)
        // The worker ticks every 250 ms: only touch the store when something visible changed.
        if (step.run === run && timeLeftSeconds(run, now) === state.timeLeft) return
        commit(step, {}, now)
      },
      requestStart: () => {
        const state = get()
        if (state.status === 'ended' || state.completed) return
        const now = Date.now()
        const action = startAction({ ...state })
        if (action === 'open') set({ card: 'start' })
        else if (action === 'restart') resetWith(state, now, {}, true)
        else if (state.status === 'running') commit(pause(runOf(state), now), {}, now)
        else commit(start(runOf(state), now), {}, now)
      },
      openCard: mode => set({ card: mode }),
      closeCard: () => set({ card: null }),
      applySettings: (values, opts) =>
        resetWith(
          values,
          Date.now(),
          {
            workDuration: values.workDuration,
            breakDuration: values.breakDuration,
            sessions: values.sessions,
            askBeforeStart: values.askBeforeStart,
            card: null,
          },
          opts.run,
        ),
      setAskBeforeStart: value => set({ askBeforeStart: value }),
      reset: () => resetWith(get(), Date.now()),
      resetCurrentTime: () => {
        const now = Date.now()
        commit(resetBlock(runOf(get()), now), {}, now)
      },
      skipToNextSession: () => {
        const now = Date.now()
        commit(skip(runOf(get()), 1, now, fresh), {}, now)
      },
      skipToPrevSession: () => {
        const now = Date.now()
        commit(skip(runOf(get()), -1, now, fresh), {}, now)
      },
      adjust: minutes => {
        const now = Date.now()
        const run = runOf(get())
        if (!canAdjust(run, minutes, now)) return false
        commit(adjust(run, minutes, now), {}, now)
        return true
      },
      startNext: () => {
        const now = Date.now()
        commit(startNext(runOf(get()), now, fresh), {}, now)
      },
      seedBlocks: input => {
        // a finished run stays put until the summary is left (resetAll)
        if (get().completed) return false
        const next = seed(runOf(get()), input)
        if (!next) return false
        commit(next)
        return true
      },
      updateSettings: (key, value) => set({ [key]: value } as Pick<TimerState, typeof key>),
      resetAll: () => {
        const state = get()
        if (state.completed) commit({ ...runOf(state), completed: false }, { finished: null })
        else resetWith(state, Date.now())
      },
    }
  })
}

type TimerStoreApi = ReturnType<typeof createTimerStore>

const TimerStoreContext = createContext<TimerStoreApi | undefined>(undefined)

function identity(state: TimerState): TimerState {
  return state
}

export function TimerStoreProvider({
  initialSettings,
  mode,
  children,
}: {
  initialSettings: Pick<
    Settings,
    'workDuration' | 'breakDuration' | 'numberOfSessions' | 'askBeforeStart'
  > | null
  mode: 'account' | 'guest'
  children: ReactNode
}) {
  // Swappable so the store is never recreated. Guest: localStorage. Account: buffer in memory
  // until the session user id is known, then the per-user queue (effect below).
  const buffer = useRef<BlockRecord[]>([])
  const bufferSink = useCallback((records: BlockRecord[]) => {
    buffer.current.push(...records)
  }, [])
  const sinkRef = useRef<(records: BlockRecord[]) => void>(
    mode === 'guest'
      ? records => {
          appendGuestRecords(records)
        }
      : bufferSink,
  )
  // Always called (hook rules); only read in account mode. Failed writes are silent by design.
  const userId = useSession().data?.user.id
  const [store] = useState(() =>
    createTimerStore(
      initialSettings
        ? {
            sessions: initialSettings.numberOfSessions,
            workDuration: initialSettings.workDuration,
            breakDuration: initialSettings.breakDuration,
            askBeforeStart: initialSettings.askBeforeStart,
          }
        : null,
      records => sinkRef.current?.(records),
    ),
  )

  useEffect(() => {
    if (mode !== 'account' || !userId) return
    const queue = createRecordQueue({
      key: queueKey(userId),
      send: async records => {
        // Widened: the route types omit 400, which the framework can still return.
        const status: number = (await api.user.blocks.$put({ json: { records } })).status
        if (status === 200) return 'ok'
        if (status === 400 || status === 413 || status === 422) return 'drop'
        return 'retry'
      },
    })
    if (buffer.current.length > 0) queue.push(buffer.current.splice(0))
    void queue.flush()
    sinkRef.current = records => queue.push(records)
    const onOnline = () => void queue.flush()
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('online', onOnline)
      sinkRef.current = bufferSink
    }
  }, [mode, userId, bufferSink])

  // Closing or reloading mid-block: keep the started block as a record. The sink writes to
  // localStorage synchronously. State is untouched so a bfcache restore resumes the block and
  // its later record replaces this one under the same id.
  useEffect(() => {
    const onPageHide = () => {
      const record = pendingRecord(runOf(store.getState()), Date.now())
      if (record) sinkRef.current?.([record])
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [store])

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

// Escape hatch for effects (e.g. keyboard listeners) that must read fresh
// actions without re-binding on every state change.
export function useTimerStoreApi(): TimerStoreApi {
  const store = useContext(TimerStoreContext)
  if (!store) {
    throw new Error('useTimerStoreApi must be used within a TimerStoreProvider')
  }
  return store
}
