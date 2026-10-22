// Pure "What to improve" rules and chart data: no React, no network, no clock (callers pass `now`).
// Sentences interpolate computed numbers, block numbers and clock times only, never user text.
import type { HistorySession } from './history'
import { buildSummary, type Format, type Summary, type SummaryBlock } from './summary'

const DAY_MS = 86_400_000
const WINDOW_MS = 14 * DAY_MS
const MIN_OCCURRENCES = 3
const MAX_OBSERVATIONS = 3

export type Bar = { value: number; status: 'happened' | 'not' | 'none' }
export type Observation = {
  id: 'added' | 'skipped' | 'cut' | 'carried' | 'deep'
  text: string
  bars: Bar[]
  label: string
  /** matching / looked at, used for ordering. */
  strength: number
}

type Looked = { session: HistorySession; summary: Summary }

/** Finished sessions that ended in the last 14 days, oldest first. */
function looked(sessions: HistorySession[], now: number): Looked[] {
  return sessions
    .map(session => ({ session, summary: buildSummary({ ...session, tasks: [], live: false }) }))
    .filter(l => l.summary.status === 'finished' && l.summary.end >= now - WINDOW_MS)
    .sort((a, b) => a.summary.end - b.summary.end)
}

export function improveState(sessions: HistorySession[], now: number) {
  const finished = looked(sessions, now).length
  return { finished, ready: finished >= MIN_OCCURRENCES }
}

const ratio = (used: number, planned: number) =>
  planned > 0 ? Math.min(1, Math.max(0.2, used / planned)) : 0.2
const bar = (value: number, hit: boolean): Bar => ({
  value,
  status: hit ? 'happened' : 'not',
})
/** Last 10 occurrences, padded on the left with 'none' bars up to 6. */
function bars(occurrences: Bar[]): Bar[] {
  const last = occurrences.slice(-10)
  return [
    ...Array.from(
      { length: Math.max(0, 6 - last.length) },
      (): Bar => ({ value: 0.2, status: 'none' }),
    ),
    ...last,
  ]
}
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const focusOf = (s: Summary) => s.blocks.filter(b => b.kind === 'focus')

function added(ls: Looked[]): Observation | null {
  const hits = ls.filter(l => l.summary.stats.addedSeconds > 0)
  if (hits.length < MIN_OCCURRENCES) return null
  const perBlock = new Map<number, number[]>() // focus number -> added seconds per session (>0)
  const planned = new Map<number, number[]>()
  for (const { summary } of ls)
    for (const b of focusOf(summary)) {
      const n = b.focusNumber ?? 0
      planned.set(n, [...(planned.get(n) ?? []), b.plannedSeconds])
      if (b.addedSeconds > 0) perBlock.set(n, [...(perBlock.get(n) ?? []), b.addedSeconds])
    }
  // Most added time wins; ties keep the lowest block number (Map keeps insertion order).
  const [block = 1] = [...perBlock].sort((a, b) => sum(b[1]) - sum(a[1]) || a[0] - b[0])[0] ?? []
  const avg = (xs: number[] = []) => (xs.length ? sum(xs) / xs.length : 0)
  const x = Math.max(5, Math.round((avg(planned.get(block)) + avg(perBlock.get(block))) / 300) * 5)
  const tip = block === 1 ? `Try a ${x} min first block.` : `Try a ${x} min block ${block}.`
  return {
    id: 'added',
    text: `You added time in ${hits.length} of your last ${ls.length} sessions, usually to block ${block}. ${tip}`,
    bars: bars(
      ls.map(({ summary }) =>
        bar(
          ratio(summary.focusSeconds, sum(focusOf(summary).map(b => b.plannedSeconds))),
          summary.stats.addedSeconds > 0,
        ),
      ),
    ),
    label: `${hits.length} of ${ls.length} sessions had added time`,
    strength: hits.length / ls.length,
  }
}

const used = (b: SummaryBlock) => ratio(b.actualSeconds, b.plannedSeconds)

function skipped(ls: Looked[]): Observation | null {
  const numbers = new Set(ls.flatMap(l => focusOf(l.summary).map(b => b.focusNumber ?? 0)))
  let best: { block: number; n: number; m: number; occ: SummaryBlock[] } | null = null
  for (const block of [...numbers].sort((a, b) => a - b)) {
    const occ = ls.flatMap(l => focusOf(l.summary).filter(b => b.focusNumber === block))
    const n = occ.filter(b => b.outcome === 'skipped').length
    if (n >= MIN_OCCURRENCES && (!best || n / occ.length > best.n / best.m))
      best = { block, n, m: occ.length, occ }
  }
  if (!best) return null
  return {
    id: 'skipped',
    text: `Block ${best.block} is where you skip: ${best.n} of the last ${best.m} times. Plan something lighter there.`,
    bars: bars(best.occ.map(b => bar(used(b), b.outcome === 'skipped'))),
    label: `${best.n} of ${best.m} sessions skipped block ${best.block}`,
    strength: best.n / best.m,
  }
}

function cutBreaks(ls: Looked[]): Observation | null {
  const breaks: { block: SummaryBlock; scatteredAfter: boolean }[] = []
  for (const { summary } of ls)
    summary.blocks.forEach((block, i) => {
      if (block.kind !== 'break') return
      const next = summary.blocks[i + 1]
      breaks.push({
        block,
        scatteredAfter:
          block.cut !== null && next?.kind === 'focus' && next.log?.rating === 'scattered',
      })
    })
  const cut = breaks.filter(b => b.block.cut !== null)
  if (cut.length < MIN_OCCURRENCES) return null
  const k = cut.filter(b => b.scatteredAfter).length
  return {
    id: 'cut',
    text:
      `Breaks were cut short ${cut.length} times in the last 14 days.` +
      (k >= 2 ? ` Focus after a cut break was rated Scattered ${k} times.` : ''),
    bars: bars(breaks.map(b => bar(used(b.block), b.block.cut !== null))),
    label: `${cut.length} of ${breaks.length} breaks were cut short`,
    strength: cut.length / breaks.length,
  }
}

function carriedTasks(ls: Looked[]): Observation | null {
  const next = new Map<string, number>() // task id -> notes carrying it to 'next'; insertion = first seen
  for (const { session } of ls)
    for (const c of session.note?.carried ?? [])
      next.set(c.taskId, (next.get(c.taskId) ?? 0) + (c.fate === 'next' ? 1 : 0))
  const n = [...next.values()].filter(c => c >= MIN_OCCURRENCES).length
  if (n < MIN_OCCURRENCES) return null
  return {
    id: 'carried',
    text: `${n} tasks were carried to the next session more than twice. Split them or set them aside.`,
    bars: bars(
      [...next.values()].map(c =>
        bar(Math.min(1, Math.max(0.2, c / MIN_OCCURRENCES)), c >= MIN_OCCURRENCES),
      ),
    ),
    label: `${n} of ${next.size} carried tasks came back 3 times or more`,
    strength: n / next.size,
  }
}

function deepTime(ls: Looked[], fmt: Format): Observation | null {
  const focus = ls.flatMap(l => focusOf(l.summary)).sort((a, b) => a.start - b.start)
  const deep = focus.filter(b => b.log?.rating === 'deep')
  if (deep.length < MIN_OCCURRENCES) return null
  const minutesOfDay = (ms: number) => {
    const s = fmt.stamp(ms) // YYYY-MM-DD-HHMM
    return Number(s.slice(11, 13)) * 60 + Number(s.slice(13, 15))
  }
  const byTime = [...deep].sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))
  const p75 = byTime[Math.ceil(0.75 * byTime.length) - 1] ?? byTime[0]
  if (!p75) return null
  const hour = Math.floor(minutesOfDay(p75.start) / 60) + 1
  // ponytail: a 23:xx p75 reads "before 00:00"; cap if that ever shows up in practice.
  const time = fmt.clock(p75.start - minutesOfDay(p75.start) * 60_000 + hour * 3_600_000)
  return {
    id: 'deep',
    text: `Most of your Deep blocks started before ${time}. Plan the hard work there.`,
    bars: bars(focus.map(b => bar(used(b), b.log?.rating === 'deep'))),
    label: `${deep.length} of ${focus.length} blocks were rated Deep`,
    strength: deep.length / focus.length,
  }
}

/** At most 3 observations, strongest first; ties keep the rule table order. */
export function observations(sessions: HistorySession[], now: number, fmt: Format): Observation[] {
  const ls = looked(sessions, now)
  return [added(ls), skipped(ls), cutBreaks(ls), carriedTasks(ls), deepTime(ls, fmt)]
    .filter((o): o is Observation => o !== null)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, MAX_OBSERVATIONS)
}

const endOf = (s: HistorySession) => Math.max(0, ...s.records.map(r => r.endedAt))
const focusRecords = (s: HistorySession) => s.records.filter(r => r.kind === 'focus')
const minutes = (seconds: number) => Math.round(seconds / 60)

export type PlanRow = {
  day: string
  label: string
  plannedMinutes: number
  focusedMinutes: number
  addedMinutes: number
}

/** One row per day with sessions (all statuses), newest first, limited to `rows`. */
export function planVsActual(sessions: HistorySession[], now: number, fmt: Format, rows: number) {
  const days = new Map<string, { end: number; planned: number; focused: number; added: number }>()
  for (const s of sessions) {
    const end = endOf(s)
    if (!end) continue
    const key = fmt.stamp(end).slice(0, 10)
    const d = days.get(key) ?? { end, planned: 0, focused: 0, added: 0 }
    for (const r of focusRecords(s)) {
      d.planned += r.plannedSeconds
      d.focused += r.actualSeconds
      d.added += r.addedSeconds
    }
    days.set(key, { ...d, end: Math.max(d.end, end) })
  }
  const list = [...days]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, rows)
    .map(([, d]): PlanRow => {
      const label = fmt.day(d.end, now)
      return {
        day: label.split(' ').slice(0, 2).join(' '),
        label,
        plannedMinutes: minutes(d.planned),
        focusedMinutes: minutes(d.focused),
        addedMinutes: minutes(Math.max(0, d.added)),
      }
    })
  const scale = Math.max(
    0,
    ...list.map(r => Math.max(r.plannedMinutes + r.addedMinutes, r.focusedMinutes)),
  )
  return { rows: list, scale }
}

export type CalendarCell = {
  date: string
  minutes: number
  level: 0 | 1 | 2 | 3
  today: boolean
  future: boolean
}

// Local-time day keys, 'YYYY-MM-DD'.
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 35 cells, Monday start, the last row is the week of `now`. Focus minutes by session end day. */
export function calendar(sessions: HistorySession[], now: number): CalendarCell[] {
  const byDay = new Map<string, number>()
  for (const s of sessions) {
    const end = endOf(s)
    if (!end) continue
    const key = localKey(new Date(end))
    byDay.set(key, (byDay.get(key) ?? 0) + sum(focusRecords(s).map(r => r.actualSeconds)))
  }
  const today = new Date(now)
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7) - 28)
  const todayKey = localKey(today)
  return Array.from({ length: 35 }, (_, i): CalendarCell => {
    const date = localKey(new Date(first.getFullYear(), first.getMonth(), first.getDate() + i))
    const m = minutes(byDay.get(date) ?? 0)
    return {
      date,
      minutes: m,
      level: m === 0 ? 0 : m < 60 ? 1 : m < 120 ? 2 : 3,
      today: date === todayKey,
      future: date > todayKey,
    }
  })
}
