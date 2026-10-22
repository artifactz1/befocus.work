// Runnable self-check for guest log storage (no test runner exists in this repo).
// Run with: TZ=UTC bun run src/lib/logs/logs-storage.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { BlockRecord } from '@repo/types/blocks'
import type { BlockLog, SessionNote } from '@repo/types/logs'
import type { TaskLink } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import {
  guestHistory,
  parseGuestLogs,
  parseGuestNotes,
  upsertGuestLog,
  upsertGuestNote,
} from './logs-storage'

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const log = (n: number, text = 'x'): BlockLog => ({
  blockId: uuid(n),
  sessionId: uuid(9000),
  text,
  rating: null,
})
const note = (n: number, nextTime = 'x'): SessionNote => ({
  sessionId: uuid(n),
  nextTime,
  extraDone: [],
  carried: [],
})

// garbage in, empty out
for (const g of [null, undefined, 5, 'x', {}, { version: 2, items: [] }, { version: 1 }]) {
  assert.deepEqual(parseGuestLogs(g), [])
  assert.deepEqual(parseGuestNotes(g), [])
}

// one bad item keeps its siblings
assert.deepEqual(
  parseGuestLogs({ version: 1, items: [log(1), { blockId: 'nope' }, log(2), null] }).map(l => l.blockId),
  [uuid(1), uuid(2)],
)
assert.deepEqual(
  parseGuestNotes({ version: 1, items: [note(1), { sessionId: 1 }, note(2)] }).map(n => n.sessionId),
  [uuid(1), uuid(2)],
)

// upsert replaces by id
{
  const a = upsertGuestLog(null, log(1, 'first'))
  const b = upsertGuestLog(a, log(2))
  const c = upsertGuestLog(b, log(1, 'second'))
  const logs = parseGuestLogs(c)
  assert.equal(logs.length, 2)
  assert.equal(logs.find(l => l.blockId === uuid(1))?.text, 'second')
  assert.equal(c.version, 1)
}

// caps keep the newest
{
  let raw: unknown = null
  for (let i = 1; i <= 505; i++) raw = upsertGuestLog(raw, log(i))
  const logs = parseGuestLogs(raw)
  assert.equal(logs.length, 500)
  assert.equal(logs[0]?.blockId, uuid(6))
  assert.equal(logs[499]?.blockId, uuid(505))
  let nraw: unknown = null
  for (let i = 1; i <= 205; i++) nraw = upsertGuestNote(nraw, note(i))
  const notes = parseGuestNotes(nraw)
  assert.equal(notes.length, 200)
  assert.equal(notes[0]?.sessionId, uuid(6))
  nraw = upsertGuestNote(nraw, note(100, 'edited'))
  assert.equal(parseGuestNotes(nraw).length, 200)
  assert.equal(parseGuestNotes(nraw).at(-1)?.nextTime, 'edited')
}

// guestHistory
{
  const DAY = 86_400_000
  const now = Date.UTC(2026, 9, 21, 12)
  const rec = (n: number, sessionId: string, startedAt: number): BlockRecord => ({
    id: uuid(n),
    sessionId,
    kind: 'focus',
    index: 0,
    plannedSeconds: 1500,
    actualSeconds: 1500,
    addedSeconds: 0,
    startedAt,
    endedAt: startedAt + 1_500_000,
    outcome: 'finished',
  })
  const recent = uuid(7001)
  const old = uuid(7002)
  const records = [rec(1, old, now - 40 * DAY), rec(2, recent, now - 2 * DAY), rec(3, recent, now - DAY)]
  const task = (id: string, text: string): Task => ({ id, text, completed: false, archived: false })
  const tasks = [task(uuid(501), 'write'), task(uuid(502), 'read')]
  const link = (blockId: string, taskId: string, completed = false): TaskLink => ({
    blockId,
    taskId,
    planned: true,
    worked: true,
    completed,
    workedAt: null,
    completedAt: completed ? '2026-10-20T10:00:00.000Z' : null,
  })
  const linkHistory = [link(uuid(2), uuid(501)), link(uuid(1), uuid(502))]
  const liveLinks = [link(uuid(2), uuid(501), true)] // live wins over stored
  const logs = [log(2, 'recent'), log(1, 'old')]
  const notes = [note(7001, 'n-recent'), note(7002, 'n-old')]
  const input = { records, linkHistory, liveLinks, tasks, logs, notes }

  const h = guestHistory(input, { before: now, days: 35 })
  assert.deepEqual(h.records.map(r => r.id), [uuid(2), uuid(3)])
  assert.deepEqual(h.logs.map(l => l.blockId), [uuid(2)])
  assert.deepEqual(h.notes.map(n => n.sessionId), [recent])
  assert.equal(h.links.length, 1)
  assert.equal(h.links[0]?.text, 'write')
  assert.equal(h.links[0]?.completed, true)
  assert.equal(h.nextBefore, new Date(now - 35 * DAY).toISOString())

  const older = guestHistory(input, { before: now - 35 * DAY, days: 35 })
  assert.deepEqual(older.records.map(r => r.id), [uuid(1)])
  assert.equal(older.links[0]?.text, 'read')
  assert.equal(older.nextBefore, null)

  // a session is in the window when its latest record is, and then comes back whole
  const straddle = guestHistory(input, { before: now - 1.5 * DAY, days: 35 })
  assert.deepEqual(straddle.records, [])
  assert.equal(straddle.nextBefore, new Date(now - 1.5 * DAY - 35 * DAY).toISOString())
}

console.log('logs-storage.check OK')
