// Pure plan rules: seed, add, remove, nudge, derived clock times, copy. No React or DOM here.
import { PLAN_LIMITS, type PlanBlock, type TaskLink, type TaskPlan } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'

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

/** Plans a task in one block (or in none), unplanning it everywhere else. Other tasks are untouched. */
export function planTask(links: TaskLink[], taskId: string, blockId: string | null): TaskLink[] {
  const next = links.map(l =>
    l.taskId === taskId && l.blockId !== blockId && l.planned ? { ...l, planned: false } : l,
  )
  if (blockId === null) return next
  const existing = next.findIndex(l => l.taskId === taskId && l.blockId === blockId)
  if (existing >= 0) return next.map((l, i) => (i === existing ? { ...l, planned: true } : l))
  return [
    ...next,
    {
      blockId,
      taskId,
      planned: true,
      worked: false,
      completed: false,
      workedAt: null,
      completedAt: null,
    },
  ]
}

/** 1-based number of the focus block a task is planned in, or null. */
export function plannedBlockNumber(
  blocks: PlanBlock[],
  links: TaskLink[],
  taskId: string,
): number | null {
  const link = links.find(l => l.taskId === taskId && l.planned)
  if (!link) return null
  const focus = blocks.filter(b => b.kind === 'focus')
  const i = focus.findIndex(b => b.id === link.blockId)
  return i < 0 ? null : i + 1
}

/** The timer store's seed input for a plan, in order. */
export const toSeed = (plan: { blocks: PlanBlock[] }) =>
  plan.blocks.map(b => ({ id: b.id, kind: b.kind, plannedSeconds: b.minutes * 60 }))

/**
 * What to do when the timer store's session id differs from the plan's. Reads only the plan and
 * its links, never the store's state after the swap, so a mid-block reset still closes.
 */
export function reconcilePlan(
  plan: Pick<TaskPlan, 'sessionId' | 'wentLive'>,
  links: Pick<TaskLink, 'worked' | 'completed'>[],
  store: { sessionId: string },
): 'keep' | 'adopt' | 'close' {
  if (plan.sessionId === store.sessionId) return 'keep'
  return plan.wentLive || links.some(l => l.worked || l.completed) ? 'close' : 'adopt'
}

/** Session settings changed before the start: same ids where positions survive, new ids on growth. */
export function reseedFromSettings(
  blocks: PlanBlock[],
  s: { sessions: number; workMinutes: number; breakMinutes: number },
  newId: NewId = defaultId,
): PlanBlock[] {
  const ids = blocks.map(b => b.id)
  return seedFromSettings(s, () => ids.shift() ?? newId())
}

export type LiveBlock = {
  id: string
  kind: 'focus' | 'break'
  focusNumber: number | null
  state: 'done' | 'current' | 'ahead'
  plannedSeconds: number
  addedSeconds: number
  actualSeconds: number
  elapsedSeconds: number
  paused: boolean
  start: number
  end: number
  taskIds: string[]
}

export type SessionView = {
  state: 'planning' | 'live'
  blocks: LiveBlock[]
  current: LiveBlock | null
  currentIndex: number
  summary: {
    focusCount: number
    totalMinutes: number
    focusElapsedSeconds: number
    addedTotal: number
    doneTasks: number
    plannedTasks: number
    endsAt: number
  }
}

type StoreBlock = {
  id: string
  plannedSeconds: number
  actualSeconds: number
  addedSeconds: number
  startedAt: number | null
  endedAt: number | null
}

/** The single description of the session for the column, the progress slot and the now line. */
export function buildSessionView(input: {
  plan: TaskPlan
  storeBlocks: StoreBlock[]
  currentBlockId: string
  paused: boolean
  timeLeft: number
  links: TaskLink[]
  tasks: Pick<Task, 'id' | 'completed' | 'archived'>[]
  now: number
}): SessionView {
  const { plan, storeBlocks, links, now } = input
  const byId = new Map(storeBlocks.map(b => [b.id, b]))
  const currentIndex = plan.blocks.findIndex(b => b.id === input.currentBlockId)
  const live = currentIndex >= 0 && (plan.wentLive || storeBlocks.some(b => b.startedAt !== null))
  const stateOf = (i: number): LiveBlock['state'] =>
    !live || i > currentIndex ? 'ahead' : i === currentIndex ? 'current' : 'done'

  const openTasks = new Set(input.tasks.filter(t => !t.archived).map(t => t.id))
  const planIds = new Set(plan.blocks.map(b => b.id))
  const planned = links.filter(l => l.planned && planIds.has(l.blockId) && openTasks.has(l.taskId))

  const timed = plan.blocks.map((b, i): TimedBlock => {
    const st = stateOf(i)
    const sb = st === 'ahead' ? undefined : byId.get(b.id)
    return {
      id: b.id,
      kind: b.kind,
      plannedSeconds: sb?.plannedSeconds ?? b.minutes * 60,
      addedSeconds: sb?.addedSeconds ?? 0,
      startedAt: sb?.startedAt ?? null,
      endedAt: sb?.endedAt ?? null,
      leftSeconds: st === 'current' ? input.timeLeft : null,
    }
  })
  const times = deriveBlockTimes(timed, now, now)

  let focusNumber = 0
  const blocks = plan.blocks.map((b, i): LiveBlock => {
    const st = stateOf(i)
    const t = timed[i] as TimedBlock
    const sb = byId.get(b.id)
    const span = t.plannedSeconds + t.addedSeconds
    const elapsed =
      st === 'current'
        ? Math.max(0, span - input.timeLeft)
        : st === 'done'
          ? (sb?.actualSeconds ?? 0)
          : 0
    const ids = new Set(planned.filter(l => l.blockId === b.id).map(l => l.taskId))
    if (st === 'done') {
      for (const l of links) {
        if (l.blockId === b.id && (l.worked || l.completed) && openTasks.has(l.taskId)) {
          ids.add(l.taskId)
        }
      }
    }
    if (b.kind === 'focus') focusNumber += 1
    const time = times[i] as { start: number; end: number }
    return {
      id: b.id,
      kind: b.kind,
      focusNumber: b.kind === 'focus' ? focusNumber : null,
      state: st,
      plannedSeconds: t.plannedSeconds,
      addedSeconds: t.addedSeconds,
      actualSeconds: sb?.actualSeconds ?? 0,
      elapsedSeconds: elapsed,
      paused: st === 'current' && input.paused,
      start: time.start,
      end: time.end,
      taskIds: [...ids],
    }
  })

  const done = new Set(input.tasks.filter(t => t.completed).map(t => t.id))
  const plannedTaskIds = new Set(planned.map(l => l.taskId))
  return {
    state: live ? 'live' : 'planning',
    blocks,
    current: live ? (blocks[currentIndex] ?? null) : null,
    currentIndex: live ? currentIndex : -1,
    summary: {
      focusCount: blocks.filter(b => b.kind === 'focus').length,
      totalMinutes: plan.blocks.reduce((sum, b) => sum + b.minutes, 0),
      focusElapsedSeconds: blocks
        .filter(b => b.kind === 'focus')
        .reduce((sum, b) => sum + b.elapsedSeconds, 0),
      addedTotal: blocks.reduce((sum, b) => sum + b.addedSeconds, 0),
      doneTasks: [...plannedTaskIds].filter(id => done.has(id)).length,
      plannedTasks: plannedTaskIds.size,
      endsAt: blocks[blocks.length - 1]?.end ?? now,
    },
  }
}
