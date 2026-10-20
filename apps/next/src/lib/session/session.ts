// Pure session rules: limits, the start-card rule, stepping maths, copy and guest switch storage.
// Units: focus/break in minutes, rounds as a count. No React or DOM here.

import { z } from 'zod'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'

export type LimitKind = 'focus' | 'break' | 'rounds'

export const LIMITS: Record<LimitKind, { min: number; max: number; step: number }> = {
  focus: { min: 5, max: 90, step: 5 },
  break: { min: 5, max: 30, step: 5 },
  rounds: { min: 1, max: 12, step: 1 },
}

export type TimerSnapshot = {
  isRunning: boolean
  isWorking: boolean
  currentSession: number
  sessions: number
  timeLeft: number
  workDuration: number
}

export const isFresh = (s: TimerSnapshot) =>
  !s.isRunning && s.isWorking && s.currentSession === 1 && s.timeLeft === s.workDuration

// At the natural end of the last round timeLeft is 0 while isRunning stays true.
export const isFinished = (s: TimerSnapshot) => s.currentSession === s.sessions && s.timeLeft === 0

export const startAction = (
  s: TimerSnapshot & { askBeforeStart: boolean },
): 'open' | 'restart' | 'toggle' => {
  if (s.askBeforeStart && (isFresh(s) || isFinished(s))) return 'open'
  if (isFinished(s)) return 'restart'
  return 'toggle'
}

const clamp = (v: number, kind: LimitKind) =>
  Math.min(LIMITS[kind].max, Math.max(LIMITS[kind].min, v))

export const clampToLimit = (v: number, kind: LimitKind) => clamp(Math.round(v), kind)

export const stepValue = (v: number, kind: LimitKind, dir: 1 | -1, steps = 1) => {
  const { min, step } = LIMITS[kind]
  const rel = (v - min) / step
  let next = v
  let left = steps
  if (!Number.isInteger(rel)) {
    // Off-grid: snap to the next grid point in the pressed direction (counts as one step).
    next = min + (dir === 1 ? Math.ceil(rel) : Math.floor(rel)) * step
    left -= 1
  }
  return clamp(next + dir * step * left, kind)
}

export const rangeText = (kind: LimitKind) => {
  const { min, max } = LIMITS[kind]
  return `${min}-${max} ${kind === 'rounds' ? 'rounds' : 'min'}`
}

export const unitText = (kind: LimitKind, v: number) =>
  kind === 'rounds' ? (v === 1 ? 'round' : 'rounds') : 'min'

export const limitText = (kind: LimitKind, v: number) => {
  const { min, max } = LIMITS[kind]
  const unit = kind === 'rounds' ? ` ${unitText(kind, v)}` : ' min'
  if (v <= min) return `Minimum ${v}${unit}`
  if (v >= max) return `Maximum ${v}${unit}`
  return null
}

export const valueText = (kind: LimitKind, v: number) =>
  kind === 'rounds' ? `${v} ${unitText(kind, v)}` : `${v} minutes`

export const totalMinutes = (focus: number, brk: number, rounds: number) =>
  rounds * focus + (rounds - 1) * brk

export const formatTotal = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export const endsAt = (nowMs: number, totalMin: number) => nowMs + totalMin * 60000

export const ASK_KEY = 'befocus.askBeforeStart'

const askSchema = z.union([z.literal(0), z.literal(1)])

// Strict read: only 0 is off. Missing, bad or throwing storage reads as on.
export const readAskBeforeStart = (
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
) => readStored(ASK_KEY, askSchema, storage) !== 0

export const writeAskBeforeStart = (
  v: boolean,
  storage: Pick<Storage, 'setItem'> | undefined = defaultStorage(),
) => {
  writeStored(ASK_KEY, v ? 1 : 0, storage)
}
