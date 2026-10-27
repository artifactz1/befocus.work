// Runnable self-check for history grouping (no test runner exists in this repo).
// Run with: TZ=UTC bun run src/lib/logs/history.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { BlockRecord } from '@repo/types/blocks'
import type { History, SessionNote } from '@repo/types/logs'
import { groupSessions, sessionDigest, splitSessions } from './history'
import { makeFormat } from './summary'

const fmt = makeFormat('en-GB', 'UTC')
const sid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`
const at = (d: number, h: number, m = 0) => Date.UTC(2026, 9, d, h, m)

function rec(s: number, i: number, kind: BlockRecord['kind'], start: number, min: number) {
  return {
    id: `s${s}b${i}`,
    sessionId: sid(s),
    kind,
    index: i,
    plannedSeconds: min * 60,
    actualSeconds: min * 60,
    addedSeconds: 0,
    startedAt: start,
    endedAt: start + min * 60_000,
    outcome: 'finished',
  } satisfies BlockRecord
}
const note = (s: number): SessionNote => ({
  sessionId: sid(s),
  nextTime: '',
  extraDone: [],
  carried: [],
})
const link = (s: number, i: number, taskId: string, completed: boolean) => ({
  blockId: `s${s}b${i}`,
  taskId,
  text: taskId,
  planned: true,
  worked: completed,
  completed,
  completedAt: null,
})

const now = at(21, 12)
const history: History = {
  records: [
    // s1: today 09:00-09:30, finished, 1 of 2 tasks done
    rec(1, 0, 'focus', at(21, 9), 30),
    // s2: yesterday 22:00 - 00:30 today? crosses midnight, grouped by end day (today)
    rec(2, 0, 'focus', at(20, 23, 30), 45),
    // s3: yesterday 10:00, stopped (no note)
    rec(3, 0, 'focus', at(20, 10), 25),
    // s4: 3 days earlier
    rec(4, 0, 'focus', at(18, 8), 25),
  ],
  logs: [
    { blockId: 's1b0', sessionId: sid(1), text: '  ', rating: null },
    { blockId: 's1b0', sessionId: sid(1), text: 'first line\nsecond line', rating: 'deep' },
  ],
  notes: [note(1), note(2), note(4)],
  links: [link(1, 0, 'a', true), link(1, 0, 'b', false), link(9, 9, 'x', true)],
  nextBefore: null,
}

const sessions = splitSessions(history)
assert.equal(sessions.length, 4)
const s1 = sessions.find(s => s.sessionId === sid(1))
assert.ok(s1)
assert.equal(s1.records.length, 1)
assert.equal(s1.links.length, 2, 'links of other sessions are not attached')
assert.equal(s1.logs.length, 2)
assert.ok(s1.note)
assert.equal(sessions.find(s => s.sessionId === sid(3))?.note, null)

const d1 = sessionDigest(s1, fmt)
assert.equal(d1.status, 'finished')
assert.equal(d1.focusSeconds, 1800)
assert.equal(d1.tasksDone, 1)
assert.equal(d1.tasksTotal, 2)
assert.equal(d1.firstLog, 'first line', 'first non-empty line of the first non-empty log')
assert.deepEqual(d1.cells, [{ kind: 'focus', outcome: 'finished', seconds: 1800 }])
assert.equal(d1.endClock, '09:30')

const d3 = sessionDigest(sessions.find(s => s.sessionId === sid(3)) ?? s1, fmt)
assert.equal(d3.status, 'stopped', 'no note row means stopped even with all blocks ended')
assert.equal(d3.firstLog, null)

const digests = sessions.map(s => sessionDigest(s, fmt))
const groups = groupSessions(digests, now, fmt)
assert.deepEqual(
  groups.map(g => g.label),
  ['Today', 'Yesterday', 'Sun 18 Oct'],
)
// Today: s1 (ends 09:30) and s2 (crossed midnight, ends 00:15 on the 21st); newest first.
assert.deepEqual(
  groups[0]?.sessions.map(s => s.sessionId),
  [sid(1), sid(2)],
)
assert.deepEqual(
  groups[1]?.sessions.map(s => s.sessionId),
  [sid(3)],
)

console.log('history.check OK')
