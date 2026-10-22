// Runnable self-check for the improve rules and chart data (no test runner exists in this repo).
// Run with: TZ=UTC bun run src/lib/logs/insights.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { BlockKind, BlockOutcome, BlockRecord } from '@repo/types/blocks'
import type { BlockLog, FocusRating, SessionNote, TaskFate } from '@repo/types/logs'
import type { HistorySession } from './history'
import { calendar, improveState, observations, planVsActual } from './insights'
import { makeFormat } from './summary'

const fmt = makeFormat('en-GB', 'UTC')
const now = Date.UTC(2026, 9, 21, 12) // Wed 21 Oct 2026 12:00

type Spec = {
  kind?: BlockKind
  planned?: number // minutes
  actual?: number // minutes, defaults to planned
  added?: number // minutes
  outcome?: BlockOutcome
  rating?: FocusRating
}
type Opts = { hour?: number; finished?: boolean; carried?: [string, TaskFate][] }

let counter = 0
/** A session ending `daysAgo` days before `now`'s day; blocks run back to back from `hour`. */
function session(daysAgo: number, specs: Spec[], opts: Opts = {}): HistorySession {
  const sessionId = `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`
  let t = Date.UTC(2026, 9, 21 - daysAgo, opts.hour ?? 9)
  const logs: BlockLog[] = []
  const records = specs.map((s, index): BlockRecord => {
    const planned = s.planned ?? 25
    const actual = s.actual ?? planned
    const r: BlockRecord = {
      id: `${sessionId}-${index}`,
      sessionId,
      kind: s.kind ?? 'focus',
      index,
      plannedSeconds: planned * 60,
      actualSeconds: actual * 60,
      addedSeconds: (s.added ?? 0) * 60,
      startedAt: t,
      endedAt: t + actual * 60_000,
      outcome: s.outcome ?? 'finished',
    }
    t = r.endedAt
    if (s.rating) logs.push({ blockId: r.id, sessionId, text: '', rating: s.rating })
    return r
  })
  const note: SessionNote | null =
    opts.finished === false
      ? null
      : {
          sessionId,
          nextTime: '',
          extraDone: [],
          carried: (opts.carried ?? []).map(([taskId, fate]) => ({
            taskId,
            text: taskId,
            fate,
          })),
        }
  return { sessionId, records, logs, links: [], note }
}
const many = (n: number, make: (i: number) => HistorySession) =>
  Array.from({ length: n }, (_, i) => make(i))
const texts = (s: HistorySession[]) => observations(s, now, fmt).map(o => o.text)
const withAdded = (i: number, on: number) => session(i, [{ added: i < on ? 5 : 0 }, {}])

// improveState: only finished sessions in the last 14 days count.
assert.deepEqual(improveState([session(1, [{}]), session(2, [{}])], now), {
  finished: 2,
  ready: false,
})
assert.deepEqual(
  improveState(
    [session(1, [{}]), session(2, [{}]), session(3, [{}], { finished: false }), session(20, [{}])],
    now,
  ),
  { finished: 2, ready: false },
)
assert.equal(
  improveState(
    many(3, i => session(i, [{}])),
    now,
  ).ready,
  true,
)

// No data, no rules.
assert.deepEqual(observations([], now, fmt), [])
assert.deepEqual(
  observations(
    many(5, i => session(i, [{}, {}])),
    now,
    fmt,
  ),
  [],
)

// Added time: 3 of 5 fires (block 1, planned 25 + added 5 -> 30), 2 of 5 does not.
const added3 = many(5, i => withAdded(i, 3))
assert.deepEqual(texts(added3), [
  'You added time in 3 of your last 5 sessions, usually to block 1. Try a 30 min first block.',
])
assert.deepEqual(texts(many(5, i => withAdded(i, 2))), [])
{
  const [o] = observations(added3, now, fmt)
  assert.ok(o)
  assert.equal(o.label, '3 of 5 sessions had added time')
  assert.ok(o.bars.length >= 6 && o.bars.length <= 10)
  assert.equal(o.bars.filter(b => b.status === 'happened').length, 3)
  assert.equal(o.bars.filter(b => b.status === 'none').length, 1, 'padded on the left to 6')
  assert.equal(o.bars[0]?.status, 'none')
  for (const b of o.bars) assert.ok(b.value >= 0.2 && b.value <= 1)
}
// Added time to a later block adapts the tip.
assert.deepEqual(texts(many(4, i => session(i, [{}, {}, { added: i < 3 ? 10 : 0 }]))), [
  'You added time in 3 of your last 4 sessions, usually to block 3. Try a 35 min block 3.',
])

// Skipped block.
const skip = (on: number) =>
  many(4, i => session(i, [{}, { outcome: i < on ? 'skipped' : 'finished', actual: 10 }]))
assert.deepEqual(texts(skip(3)), [
  'Block 2 is where you skip: 3 of the last 4 times. Plan something lighter there.',
])
assert.deepEqual(texts(skip(2)), [])

// Cut breaks, with and without the Scattered sentence.
const cut = (n: number, scattered: number) =>
  many(n, i =>
    session(i, [
      {},
      { kind: 'break', planned: 5, actual: 2, outcome: 'skipped' },
      { rating: i < scattered ? 'scattered' : 'okay' },
    ]),
  )
assert.deepEqual(texts(cut(3, 2)), [
  'Breaks were cut short 3 times in the last 14 days. Focus after a cut break was rated Scattered 2 times.',
])
assert.deepEqual(texts(cut(3, 1)), ['Breaks were cut short 3 times in the last 14 days.'])
assert.deepEqual(texts(cut(2, 2)), [])

// Carried tasks: a task with fate next in 3+ notes counts once.
const carried = (tasks: number) =>
  many(3, i =>
    session(i, [{}], {
      carried: [...Array(tasks).keys()].map((k): [string, TaskFate] => [`t${k}`, 'next']),
    }),
  )
assert.deepEqual(texts(carried(3)), [
  '3 tasks were carried to the next session more than twice. Split them or set them aside.',
])
assert.deepEqual(texts(carried(2)), [])
{
  const [o] = observations(carried(3), now, fmt)
  assert.ok(o && o.bars.length >= 6 && o.bars.length <= 10)
}

// Deep time of day: p75 of starts 09:00, 10:00, 11:00 is 11:00, so before 12:00.
const deep = (n: number) => many(n, i => session(i, [{ rating: 'deep' }], { hour: 9 + i }))
assert.deepEqual(texts(deep(3)), [
  'Most of your Deep blocks started before 12:00. Plan the hard work there.',
])
assert.deepEqual(texts(deep(2)), [])

// Window and stopped sessions: nothing older than 14 days or unfinished feeds a rule.
assert.deepEqual(texts(many(5, i => withAdded(i + 15, 5))), [])
assert.deepEqual(texts(many(5, i => session(i, [{ added: 5 }, {}], { finished: false }))), [])

// At most 3 observations, strongest first.
{
  const all = [
    ...many(5, i => withAdded(i, 5)),
    ...skip(4),
    ...cut(3, 3),
    ...carried(3),
    ...deep(3),
  ]
  const obs = observations(all, now, fmt)
  assert.equal(obs.length, 3)
  for (let i = 1; i < obs.length; i++)
    assert.ok((obs[i - 1]?.strength ?? 0) >= (obs[i]?.strength ?? 0))
  for (const o of obs) assert.ok(o.bars.length >= 6 && o.bars.length <= 10)
}

// Plan vs actual: one row per day, newest first, scale over the visible rows.
{
  const s = [
    session(0, [
      { planned: 50, actual: 50, added: 10 },
      { kind: 'break', planned: 5 },
    ]),
    session(1, [{ planned: 100, actual: 92 }]),
    session(2, [{ planned: 25, actual: 25 }]),
  ]
  const { rows, scale } = planVsActual(s, now, fmt, 2)
  assert.deepEqual(rows, [
    {
      day: 'Wed 21',
      label: 'Wed 21 Oct',
      plannedMinutes: 50,
      focusedMinutes: 50,
      addedMinutes: 10,
    },
    {
      day: 'Tue 20',
      label: 'Tue 20 Oct',
      plannedMinutes: 100,
      focusedMinutes: 92,
      addedMinutes: 0,
    },
  ])
  assert.equal(scale, 100)
  assert.equal(planVsActual(s, now, fmt, 6).rows.length, 3)
}

// Calendar: 35 cells, Monday start, ending in the week of now (Sun 25 Oct is a future cell).
{
  const cells = calendar(
    [session(0, [{ actual: 90 }]), session(1, [{ actual: 130 }]), session(2, [{ actual: 30 }])],
    now,
  )
  assert.equal(cells.length, 35)
  assert.equal(cells[0]?.date, '2026-09-21') // Monday, 4 weeks before the Monday of now
  assert.equal(cells[34]?.date, '2026-10-25')
  const at = (d: string) => cells.find(c => c.date === d)
  assert.deepEqual(at('2026-10-21'), {
    date: '2026-10-21',
    minutes: 90,
    level: 2,
    today: true,
    future: false,
  })
  assert.equal(at('2026-10-20')?.level, 3)
  assert.equal(at('2026-10-19')?.level, 1)
  assert.equal(at('2026-10-18')?.level, 0)
  assert.equal(at('2026-10-22')?.future, true)
  assert.equal(cells.filter(c => c.today).length, 1)
}

console.log('insights.check OK')
