// Pure block run engine: an explicit block list and status on a wall-clock anchor.
// No React, no clock reads, no id generation: every time input is a `now` argument.

import {
  type BlockKind,
  type BlockOutcome,
  type BlockRecord,
  blockRecordSchema,
  MAX_ACTUAL_SECONDS,
  MAX_ADDED_SECONDS,
} from '@repo/types/blocks'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended'

export interface Block {
  id: string
  sessionId: string
  kind: BlockKind
  index: number
  plannedSeconds: number
  actualSeconds: number
  addedSeconds: number
  startedAt: number | null
  endedAt: number | null
  outcome: BlockOutcome | null
  /** Actual seconds of earlier finalised runs of this id (0 at seed). */
  carriedSeconds: number
  /** Start of the first run of this id; the record's startedAt. */
  firstStartedAt: number | null
}

export interface SeedBlock {
  id: string
  kind: BlockKind
  plannedSeconds: number
}

export interface Run {
  sessionId: string
  blocks: Block[]
  currentBlockId: string
  status: TimerStatus
  /** running: end moment; ended: the end moment; idle/paused: null. */
  endsAt: number | null
  /** idle/paused: ms left; running/ended: 0. */
  remainingMs: number
  /** Start of the current running segment. */
  segmentStartedAt: number | null
  /** Running ms of the current block so far (pauses excluded). */
  activeMs: number
  /** Session finished, SessionCompleteModal pending. */
  completed: boolean
}

export interface Step {
  run: Run
  records: BlockRecord[]
}

export type Fresh = () => { sessionId: string; seed: SeedBlock[] }

export const NUDGE_OFFSETS_MS = [30_000, 60_000] as const

export function buildSeed(
  s: { workDuration: number; breakDuration: number; sessions: number },
  newId: () => string,
): SeedBlock[] {
  const out: SeedBlock[] = []
  for (let i = 0; i < s.sessions; i++) {
    out.push({ id: newId(), kind: 'focus', plannedSeconds: s.workDuration })
    if (i < s.sessions - 1)
      out.push({ id: newId(), kind: 'break', plannedSeconds: s.breakDuration })
  }
  return out
}

const fromSeed = (s: SeedBlock, index: number, sessionId: string): Block => ({
  id: s.id,
  sessionId,
  kind: s.kind,
  index,
  plannedSeconds: s.plannedSeconds,
  actualSeconds: 0,
  addedSeconds: 0,
  startedAt: null,
  endedAt: null,
  outcome: null,
  carriedSeconds: 0,
  firstStartedAt: null,
})

export function createRun(sessionId: string, seed: SeedBlock[]): Run {
  const blocks = seed.map((s, i) => fromSeed(s, i, sessionId))
  return {
    sessionId,
    blocks,
    currentBlockId: blocks[0].id,
    status: 'idle',
    endsAt: null,
    remainingMs: blocks[0].plannedSeconds * 1000,
    segmentStartedAt: null,
    activeMs: 0,
    completed: false,
  }
}

const indexOfCurrent = (run: Run) => run.blocks.findIndex(b => b.id === run.currentBlockId)

export function currentBlock(run: Run): Block {
  return run.blocks[indexOfCurrent(run)]
}

export function nextBlock(run: Run): Block | null {
  return run.blocks[indexOfCurrent(run) + 1] ?? null
}

const withCurrent = (run: Run, block: Block): Block[] =>
  run.blocks.map(b => (b.id === block.id ? block : b))

export function timeLeftSeconds(run: Run, now: number): number {
  if (run.status === 'running' && run.endsAt !== null)
    return Math.max(0, Math.ceil((run.endsAt - now) / 1000))
  if (run.status === 'ended') return 0
  return Math.max(0, Math.ceil(run.remainingMs / 1000))
}

export function toRecord(block: Block): BlockRecord | null {
  const startedAt = block.firstStartedAt ?? block.startedAt
  if (startedAt === null || block.endedAt === null || block.outcome === null) return null
  const parsed = blockRecordSchema.safeParse({
    id: block.id,
    sessionId: block.sessionId,
    kind: block.kind,
    index: block.index,
    plannedSeconds: block.plannedSeconds,
    actualSeconds: block.actualSeconds,
    addedSeconds: block.addedSeconds,
    startedAt,
    endedAt: block.endedAt,
    outcome: block.outcome,
  })
  if (!parsed.success) {
    console.warn('Dropped invalid block record', parsed.error.issues)
    return null
  }
  return parsed.data
}

// Closes the current run of the block at `endedAt`; returns the block and the run's active ms.
function close(run: Run, outcome: BlockOutcome, endedAt: number) {
  const block = currentBlock(run)
  const open =
    run.status === 'running' && run.segmentStartedAt !== null
      ? Math.max(0, endedAt - run.segmentStartedAt)
      : 0
  const activeMs = run.activeMs + open
  const closed: Block = {
    ...block,
    actualSeconds: Math.min(MAX_ACTUAL_SECONDS, block.carriedSeconds + Math.round(activeMs / 1000)),
    endedAt,
    outcome,
  }
  return { block: closed, activeMs }
}

const isOpen = (run: Run) =>
  (run.status === 'running' || run.status === 'paused') && currentBlock(run).startedAt !== null

// Closes a started, unfinalised current block (skip / reset) and returns it in the list.
function finalise(run: Run, outcome: BlockOutcome, now: number): Step {
  if (!isOpen(run)) return { run, records: [] }
  const { block, activeMs } = close(run, outcome, now)
  const record = toRecord(block)
  return {
    run: { ...run, blocks: withCurrent(run, block), activeMs, segmentStartedAt: null },
    records: record ? [record] : [],
  }
}

export function start(run: Run, now: number): Run {
  if (run.status !== 'idle' && run.status !== 'paused') return run
  const block = currentBlock(run)
  return {
    ...run,
    blocks: withCurrent(run, { ...block, startedAt: block.startedAt ?? now }),
    status: 'running',
    endsAt: now + run.remainingMs,
    remainingMs: 0,
    segmentStartedAt: now,
  }
}

export function pause(run: Run, now: number): Run {
  if (run.status !== 'running' || run.endsAt === null || run.segmentStartedAt === null) return run
  if (now >= run.endsAt) return run // the next tick ends it
  return {
    ...run,
    status: 'paused',
    activeMs: run.activeMs + (now - run.segmentStartedAt),
    remainingMs: run.endsAt - now,
    endsAt: null,
    segmentStartedAt: null,
  }
}

export function tick(run: Run, now: number): Step {
  if (run.status !== 'running' || run.endsAt === null || now < run.endsAt) {
    return { run, records: [] }
  }
  const { block, activeMs } = close(run, 'finished', run.endsAt)
  const record = toRecord(block)
  return {
    run: {
      ...run,
      blocks: withCurrent(run, block),
      status: 'ended',
      remainingMs: 0,
      segmentStartedAt: null,
      activeMs,
    },
    records: record ? [record] : [],
  }
}

// An end that passed without a tick is applied first, so skip / reset never lose it.
function settle(run: Run, now: number): Step {
  return tick(run, now)
}

export function canAdjust(run: Run, minutes: number, now: number): boolean {
  if (!Number.isInteger(minutes) || minutes === 0) return false
  if (run.status !== 'running' && run.status !== 'ended') return false
  const seconds = minutes * 60
  if (seconds > 0) return currentBlock(run).addedSeconds + seconds <= MAX_ADDED_SECONDS
  if (run.status === 'ended') return false
  return -seconds < timeLeftSeconds(run, now)
}

export function adjust(run: Run, minutes: number, now: number): Run {
  if (!canAdjust(run, minutes, now)) return run
  const block = currentBlock(run)
  const grown = { ...block, addedSeconds: block.addedSeconds + minutes * 60 }
  if (run.status === 'ended') {
    return {
      ...run,
      blocks: withCurrent(run, { ...grown, endedAt: null, outcome: null }),
      status: 'running',
      endsAt: now + minutes * 60_000,
      segmentStartedAt: now,
    }
  }
  return {
    ...run,
    blocks: withCurrent(run, grown),
    endsAt: (run.endsAt as number) + minutes * 60_000,
  }
}

// Makes `target` the current block, idle, ready for a new run (carrying earlier runs' time).
function moveTo(run: Run, target: Block): Run {
  const done = target.outcome !== null
  const carriedSeconds = done ? target.actualSeconds : target.carriedSeconds
  const cleared: Block = {
    ...target,
    carriedSeconds,
    firstStartedAt: done ? (target.firstStartedAt ?? target.startedAt) : target.firstStartedAt,
    actualSeconds: carriedSeconds,
    addedSeconds: 0,
    startedAt: null,
    endedAt: null,
    outcome: null,
  }
  return {
    ...run,
    blocks: run.blocks.map(b => (b.id === cleared.id ? cleared : b)),
    currentBlockId: cleared.id,
    status: 'idle',
    endsAt: null,
    remainingMs: cleared.plannedSeconds * 1000,
    segmentStartedAt: null,
    activeMs: 0,
  }
}

function finish(fresh: Fresh): Run {
  const f = fresh()
  return { ...createRun(f.sessionId, f.seed), completed: true }
}

export function startNext(run: Run, now: number, fresh: Fresh): Step {
  if (run.status !== 'ended') return { run, records: [] }
  const next = nextBlock(run)
  if (!next) return { run: finish(fresh), records: [] }
  return { run: start(moveTo(run, next), now), records: [] }
}

export function skip(run: Run, dir: 1 | -1, now: number, fresh: Fresh): Step {
  const i = indexOfCurrent(run)
  if (dir === -1 && i === 0) {
    return { run: run.status === 'running' ? pause(run, now) : run, records: [] }
  }
  const settled = settle(run, now)
  const closed = finalise(settled.run, 'skipped', now)
  const records = [...settled.records, ...closed.records]
  const target = closed.run.blocks[i + dir]
  if (!target) return { run: finish(fresh), records }
  return { run: moveTo(closed.run, target), records }
}

export function resetBlock(run: Run, now: number): Step {
  const settled = settle(run, now)
  const closed = finalise(settled.run, 'reset', now)
  return {
    run: moveTo(closed.run, currentBlock(closed.run)),
    records: [...settled.records, ...closed.records],
  }
}

export function resetSession(run: Run, now: number, sessionId: string, seed: SeedBlock[]): Step {
  const settled = settle(run, now)
  const closed = finalise(settled.run, 'reset', now)
  return {
    run: createRun(sessionId, seed),
    records: [...settled.records, ...closed.records],
  }
}

const isLive = (run: Run) =>
  run.status !== 'idle' ||
  run.blocks.some(b => b.startedAt !== null || b.outcome !== null || b.carriedSeconds > 0)

export function seed(run: Run, input: { sessionId: string; blocks: SeedBlock[] }): Run | null {
  if (!isLive(run)) return createRun(input.sessionId, input.blocks)
  if (input.sessionId !== run.sessionId) return null
  const at = input.blocks.findIndex(b => b.id === run.currentBlockId)
  if (at === -1) return null
  const i = indexOfCurrent(run)
  const kept = run.blocks.slice(0, i + 1)
  const tail = input.blocks.slice(at + 1).map((s, k) => fromSeed(s, i + 1 + k, run.sessionId))
  return { ...run, blocks: [...kept, ...tail] }
}

export function legacy(run: Run, now: number, sessions: number) {
  const cur = currentBlock(run)
  const focus = run.blocks.filter(b => b.kind === 'focus')
  const currentSession = run.completed
    ? Math.max(sessions, focus.length) + 1
    : Math.max(1, focus.filter(b => b.index <= cur.index).length)
  return {
    timeLeft: timeLeftSeconds(run, now),
    isRunning: run.status === 'running',
    isWorking: cur.kind === 'focus',
    currentSession,
  }
}

// For pagehide: the record the open block would get now. Never changes the run.
export function pendingRecord(run: Run, now: number): BlockRecord | null {
  if (run.completed || !isOpen(run)) return null
  if (run.status === 'running' && run.endsAt !== null && now >= run.endsAt) {
    const { block } = close(run, 'finished', run.endsAt)
    const cap = block.plannedSeconds + block.addedSeconds
    const thisRun = Math.min(block.actualSeconds - block.carriedSeconds, cap)
    return toRecord({
      ...block,
      actualSeconds: Math.min(MAX_ACTUAL_SECONDS, block.carriedSeconds + thisRun),
    })
  }
  return toRecord(close(run, 'reset', now).block)
}

export function nudgeDelays(endedAt: number, now: number): number[] {
  return NUDGE_OFFSETS_MS.map(o => endedAt + o - now).filter(d => d > 0)
}

export function badgeText(addedSeconds: number): string | null {
  const m = Math.round(addedSeconds / 60)
  if (m === 0) return null
  return m > 0 ? `+${m}` : `−${-m}`
}

export function minutesLabel(n: number): string {
  return `${n} minute${n === 1 ? '' : 's'}`
}
