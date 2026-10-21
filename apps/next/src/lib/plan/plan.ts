// Pure plan rules: seed, add, remove, nudge, derived clock times, copy. No React or DOM here.
import { PLAN_LIMITS, type PlanBlock } from '@repo/types/plan'

type NewId = () => string
const defaultId: NewId = () => crypto.randomUUID()

const focusCount = (blocks: PlanBlock[]) => blocks.filter(b => b.kind === 'focus').length

export function seedFromSettings(
  s: { sessions: number; workMinutes: number; breakMinutes: number },
  newId: NewId = defaultId,
): PlanBlock[] {
  const out: PlanBlock[] = []
  for (let i = 0; i < s.sessions; i++) {
    if (i > 0) out.push({ id: newId(), kind: 'break', minutes: s.breakMinutes })
    out.push({ id: newId(), kind: 'focus', minutes: s.workMinutes })
  }
  return out
}

export function addFocusBlock(
  blocks: PlanBlock[],
  s: { workMinutes: number; breakMinutes: number },
  newId: NewId = defaultId,
): PlanBlock[] {
  if (focusCount(blocks) >= PLAN_LIMITS.maxFocus) return blocks
  return [
    ...blocks,
    { id: newId(), kind: 'break', minutes: s.breakMinutes },
    { id: newId(), kind: 'focus', minutes: s.workMinutes },
  ]
}

/** Removes a focus block with its neighbouring break (before it, or after it for the first). */
export function removeBlock(
  blocks: PlanBlock[],
  id: string,
): { blocks: PlanBlock[]; removedIndex: number } {
  const idx = blocks.findIndex(b => b.id === id)
  if (idx < 0 || blocks[idx]?.kind !== 'focus' || focusCount(blocks) <= 1) {
    return { blocks, removedIndex: -1 }
  }
  const from = idx === 0 ? 0 : idx - 1
  return { blocks: [...blocks.slice(0, from), ...blocks.slice(from + 2)], removedIndex: idx }
}

export function nudgeBlock(blocks: PlanBlock[], id: string, delta: number): PlanBlock[] {
  return blocks.map(b =>
    b.id === id
      ? {
          ...b,
          minutes: Math.min(
            PLAN_LIMITS.maxMinutes,
            Math.max(PLAN_LIMITS.minMinutes, b.minutes + Math.sign(delta) * PLAN_LIMITS.step),
          ),
        }
      : b,
  )
}

export type TimedBlock = {
  id: string
  kind: 'focus' | 'break'
  plannedSeconds: number
  addedSeconds: number
  startedAt: number | null
  endedAt: number | null
  leftSeconds: number | null
}

/**
 * Planning: block 1 starts at the anchor and each block starts where the previous one ends.
 * Live: done blocks keep their real times, the current block ends at now + time left, and blocks
 * ahead chain from that projected end.
 */
export function deriveBlockTimes(
  blocks: TimedBlock[],
  anchor: number,
  now: number,
): { id: string; start: number; end: number }[] {
  let cursor = anchor
  return blocks.map(b => {
    let start = cursor
    let end = start + (b.plannedSeconds + b.addedSeconds) * 1000
    if (b.startedAt !== null && b.endedAt !== null) {
      start = b.startedAt
      end = b.endedAt
    } else if (b.startedAt !== null && b.leftSeconds !== null) {
      start = b.startedAt
      end = now + b.leftSeconds * 1000
    }
    cursor = end
    return { id: b.id, start, end }
  })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
export const formatClock = (ms: number) => clock.format(ms)
export const formatRange = (start: number, end: number) =>
  `${formatClock(start)} - ${formatClock(end)}`

export function planSummary(blocks: PlanBlock[]): string {
  const n = focusCount(blocks)
  const total = blocks.reduce((sum, b) => sum + b.minutes, 0)
  return `${n} ${n === 1 ? 'block' : 'blocks'} · ${formatDuration(total)}`
}
