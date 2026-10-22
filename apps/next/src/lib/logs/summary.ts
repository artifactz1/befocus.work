// Pure end-of-session summary model: no React, no storage, no clock (callers pass `now`).
import type { BlockKind, BlockOutcome, BlockRecord } from '@repo/types/blocks'
import type { BlockLog, HistoryLink, SessionNote, TaskFate } from '@repo/types/logs'
import type { TaskLink } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { mergeRecords } from '~/lib/blocks/block-records'
import { type Block, toRecord } from '~/lib/blocks/blocks'

/** Records of every ended block of the run; step records win by id; sorted by index. */
export function finishedRecords(prevBlocks: Block[], stepRecords: BlockRecord[]): BlockRecord[] {
  const ended = prevBlocks.map(toRecord).filter((r): r is BlockRecord => r !== null)
  return mergeRecords(ended, stepRecords, Number.POSITIVE_INFINITY).sort(
    (a, b) => a.index - b.index,
  )
}

export function toHistoryLinks(links: TaskLink[], tasks: Task[]): HistoryLink[] {
  const text = new Map(tasks.map(t => [t.id, t.text]))
  return links.flatMap(l => {
    const t = text.get(l.taskId)
    if (t === undefined) return []
    return [
      {
        blockId: l.blockId,
        taskId: l.taskId,
        text: t,
        planned: l.planned,
        worked: l.worked,
        completed: l.completed,
        completedAt: l.completedAt,
      },
    ]
  })
}

export type SummaryInput = {
  sessionId: string
  records: BlockRecord[]
  links: HistoryLink[]
  logs: BlockLog[]
  note: SessionNote | null
  tasks: Task[]
  live: boolean
}

export type SummaryBlock = {
  id: string
  kind: BlockKind
  focusNumber: number | null
  start: number
  end: number
  plannedSeconds: number
  actualSeconds: number
  addedSeconds: number
  outcome: BlockOutcome
  tasks: { taskId: string; text: string; completed: boolean }[]
  log: BlockLog | null
  cut: 'short' | 'skipped' | null
}

export type Summary = {
  sessionId: string
  status: 'finished' | 'stopped'
  start: number
  end: number
  focusSeconds: number
  stats: {
    blocksDone: number
    blocksTotal: number
    skipped: number
    addedSeconds: number
    tasksDone: number
    tasksTotal: number
    breaksCut: number
  }
  blocks: SummaryBlock[]
  done: { taskId: string; text: string }[]
  extraDone: string[]
  notDone: { taskId: string; text: string; fate: TaskFate }[]
  later: { taskId: string; text: string; laterAt: string | null }[]
  nextTime: string
}

const touched = (l: HistoryLink) => l.planned || l.worked || l.completed

/** Next session for a task on the last focus block, Later otherwise. */
export function defaultFate(taskId: string, links: HistoryLink[], lastFocusId: string): TaskFate {
  return links.some(
    l => l.taskId === taskId && l.blockId === lastFocusId && (l.planned || l.worked),
  )
    ? 'next'
    : 'later'
}

export function buildSummary(input: SummaryInput): Summary {
  const { note, tasks, live } = input
  const records = [...input.records].sort((a, b) => a.index - b.index)
  const order = new Map(records.map((r, i) => [r.id, i]))
  // Only links on this session's blocks, in block order (stable within a block).
  const links = input.links
    .filter(l => order.has(l.blockId))
    .sort((a, b) => (order.get(a.blockId) ?? 0) - (order.get(b.blockId) ?? 0))
  const focus = records.filter(r => r.kind === 'focus')
  const lastFocusId = focus[focus.length - 1]?.id ?? ''

  const doneIds = new Set(links.filter(l => l.completed).map(l => l.taskId))
  const done = [...doneIds].map(taskId => ({
    taskId,
    text: links.find(l => l.taskId === taskId)?.text ?? '',
  }))
  const carried = new Map((note?.carried ?? []).map(c => [c.taskId, c.fate]))
  const notDoneIds = [
    ...new Set(links.filter(l => touched(l) && !doneIds.has(l.taskId)).map(l => l.taskId)),
  ]
  const notDone = notDoneIds.map(taskId => ({
    taskId,
    text: links.find(l => l.taskId === taskId)?.text ?? '',
    fate: carried.get(taskId) ?? defaultFate(taskId, links, lastFocusId),
  }))
  const later = live
    ? tasks
        .filter(
          t =>
            t.later &&
            !t.archived &&
            !t.completed &&
            !doneIds.has(t.id) &&
            !notDoneIds.includes(t.id),
        )
        .map(t => ({ taskId: t.id, text: t.text, laterAt: t.laterAt ?? null }))
        .sort((a, b) => (b.laterAt ?? '').localeCompare(a.laterAt ?? ''))
    : []

  let focusNumber = 0
  const blocks: SummaryBlock[] = records.map(r => ({
    id: r.id,
    kind: r.kind,
    focusNumber: r.kind === 'focus' ? ++focusNumber : null,
    start: r.startedAt,
    end: r.endedAt,
    plannedSeconds: r.plannedSeconds,
    actualSeconds: r.actualSeconds,
    addedSeconds: r.addedSeconds,
    outcome: r.outcome,
    tasks: links
      .filter(l => l.blockId === r.id && touched(l))
      .map(l => ({ taskId: l.taskId, text: l.text, completed: l.completed })),
    log: input.logs.find(l => l.blockId === r.id) ?? null,
    cut:
      r.kind === 'break' && r.outcome === 'skipped'
        ? r.actualSeconds >= 60
          ? 'short'
          : 'skipped'
        : null,
  }))

  return {
    sessionId: input.sessionId,
    status: note ? 'finished' : 'stopped',
    start: records.length ? Math.min(...records.map(r => r.startedAt)) : 0,
    end: records.length ? Math.max(...records.map(r => r.endedAt)) : 0,
    focusSeconds: focus.reduce((n, r) => n + r.actualSeconds, 0),
    stats: {
      blocksDone: focus.filter(r => r.outcome === 'finished').length,
      blocksTotal: focus.length,
      skipped: focus.filter(r => r.outcome === 'skipped').length,
      addedSeconds: focus.reduce((n, r) => n + r.addedSeconds, 0),
      tasksDone: done.length,
      tasksTotal: done.length + notDone.length,
      breaksCut: blocks.filter(b => b.cut).length,
    },
    blocks,
    done,
    extraDone: note?.extraDone ?? [],
    notDone,
    later,
    nextTime: note?.nextTime ?? '',
  }
}

export type FateOp = 'plan-next' | 'set-later' | 'clear-later' | 'unplan' | 'archive' | 'restore'

const UNDO: Record<TaskFate, FateOp> = { next: 'unplan', later: 'clear-later', drop: 'restore' }
const APPLY: Record<TaskFate, FateOp> = { next: 'plan-next', later: 'set-later', drop: 'archive' }

/** Store operations to move a task from its previous fate (or none) to a new one. */
export function fateOps(from: TaskFate | null, to: TaskFate): FateOp[] {
  if (from === to) return []
  return from ? [UNDO[from], APPLY[to]] : [APPLY[to]]
}

export function makeFormat(locale?: string, timeZone?: string) {
  const dtf = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone, ...o })
  const clockF = dtf({ hour: '2-digit', minute: '2-digit' })
  const dayF = dtf({ weekday: 'short', day: 'numeric', month: 'short' })
  const dayYearF = dtf({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const weekdayF = dtf({ weekday: 'short' })
  const dateF = dtf({ day: 'numeric', month: 'short' })
  // Locale-independent digits for file names and day arithmetic.
  const partsF = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = (ms: number) =>
    Object.fromEntries(partsF.formatToParts(ms).map(p => [p.type, p.value])) as Record<
      string,
      string
    >
  const dayNumber = (ms: number) => {
    const p = parts(ms)
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / 86_400_000
  }
  const plain = (s: string) => s.replace(',', '')

  return {
    clock: (ms: number) => clockF.format(ms),
    range: (a: number, b: number) => `${clockF.format(a)} - ${clockF.format(b)}`,
    day: (ms: number, now: number) =>
      plain((parts(ms).year === parts(now).year ? dayF : dayYearF).format(ms)),
    dayWithYear: (ms: number) => plain(dayYearF.format(ms)),
    since(iso: string, now: number) {
      const ms = Date.parse(iso)
      const days = dayNumber(now) - dayNumber(ms)
      if (days <= 0) return 'today'
      if (days === 1) return 'yesterday'
      return `since ${days < 7 ? weekdayF.format(ms) : dateF.format(ms)}`
    },
    compact(seconds: number) {
      const m = Math.round(seconds / 60)
      const h = Math.floor(m / 60)
      return [h && `${h}h`, (m % 60 || !h) && `${m % 60}m`].filter(Boolean).join(' ')
    },
    added: (seconds: number) => `+${Math.round(seconds / 60)} min`,
    /** 'YYYY-MM-DD-HHMM' of the local time, digits only. */
    stamp(ms: number) {
      const p = parts(ms)
      return `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}`
    },
  }
}

export type Format = ReturnType<typeof makeFormat>
