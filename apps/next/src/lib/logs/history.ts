// Pure history grouping for the Log list: no React, no storage, no clock (callers pass `now`).
import type { BlockKind, BlockOutcome, BlockRecord } from '@repo/types/blocks'
import type { BlockLog, History, HistoryLink, SessionNote } from '@repo/types/logs'
import { buildSummary, type Format } from './summary'

export type HistorySession = {
  sessionId: string
  records: BlockRecord[]
  logs: BlockLog[]
  links: HistoryLink[]
  note: SessionNote | null
}

export type SessionDigest = {
  sessionId: string
  status: 'finished' | 'stopped'
  start: number
  end: number
  /** Local clock time of the end, e.g. '10:44'. */
  endClock: string
  focusSeconds: number
  tasksDone: number
  tasksTotal: number
  firstLog: string | null
  /** Mini strip cells in block order. */
  cells: { kind: BlockKind; outcome: BlockOutcome; seconds: number }[]
}

export type DayGroup = { label: string; sessions: SessionDigest[] }

/** One entry per session id, in order of first appearance. */
export function splitSessions(history: History): HistorySession[] {
  const bySession = new Map<string, BlockRecord[]>()
  for (const r of history.records) {
    const list = bySession.get(r.sessionId)
    if (list) list.push(r)
    else bySession.set(r.sessionId, [r])
  }
  return [...bySession].map(([sessionId, records]) => {
    const ids = new Set(records.map(r => r.id))
    return {
      sessionId,
      records,
      logs: history.logs.filter(l => l.sessionId === sessionId),
      links: history.links.filter(l => ids.has(l.blockId)),
      note: history.notes.find(n => n.sessionId === sessionId) ?? null,
    }
  })
}

export function sessionDigest(session: HistorySession, fmt: Format): SessionDigest {
  const s = buildSummary({ ...session, tasks: [], live: false })
  const order = new Map(session.records.map(r => [r.id, r.index]))
  const logs = [...session.logs].sort(
    (a, b) => (order.get(a.blockId) ?? 0) - (order.get(b.blockId) ?? 0),
  )
  const firstLog =
    logs
      .flatMap(l => l.text.split('\n'))
      .map(line => line.trim())
      .find(Boolean) ?? null
  return {
    sessionId: s.sessionId,
    status: s.status,
    start: s.start,
    end: s.end,
    endClock: fmt.clock(s.end),
    focusSeconds: s.focusSeconds,
    tasksDone: s.stats.tasksDone,
    tasksTotal: s.stats.tasksTotal,
    firstLog,
    cells: s.blocks.map(b => ({
      kind: b.kind,
      outcome: b.outcome,
      seconds: Math.max(b.plannedSeconds, b.actualSeconds),
    })),
  }
}

/** Days newest first, sessions newest first; a session belongs to the local day it ended on. */
export function groupSessions(digests: SessionDigest[], now: number, fmt: Format): DayGroup[] {
  const dayKey = (ms: number) => fmt.stamp(ms).slice(0, 10)
  const dayNumber = (key: string) => Date.parse(`${key}T00:00:00Z`) / 86_400_000
  const today = dayNumber(dayKey(now))
  const groups = new Map<string, DayGroup>()
  for (const d of [...digests].sort((a, b) => b.end - a.end)) {
    const key = dayKey(d.end)
    const label =
      today - dayNumber(key) === 0
        ? 'Today'
        : today - dayNumber(key) === 1
          ? 'Yesterday'
          : fmt.day(d.end, now)
    const group = groups.get(key) ?? { label, sessions: [] }
    group.sessions.push(d)
    groups.set(key, group)
  }
  return [...groups].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([, g]) => g)
}
