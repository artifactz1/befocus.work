// Runnable self-check for the summary model (no test runner exists in this repo).
// Run with: TZ=UTC bun run src/lib/logs/summary.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { blockLogSchema, sessionNoteSchema } from '@repo/types/logs'
import type { Block } from '~/lib/blocks/blocks'
import { mdFixture, must, SID } from './fixture'
import {
  buildSummary,
  defaultFate,
  fateOps,
  finishedRecords,
  makeFormat,
  toHistoryLinks,
} from './summary'

const fmt = makeFormat('en-GB', 'UTC')
const s = buildSummary(mdFixture())

// headline and stats
assert.equal(s.status, 'finished')
assert.equal(s.focusSeconds, 5520)
assert.equal(fmt.compact(s.focusSeconds), '1h 32m')
assert.deepEqual(s.stats, {
  blocksDone: 3,
  blocksTotal: 4,
  skipped: 1,
  addedSeconds: 300,
  tasksDone: 3,
  tasksTotal: 5,
  breaksCut: 1,
})
assert.equal(fmt.range(s.start, s.end), '09:00 - 10:44')
assert.deepEqual(
  s.done.map(d => d.text),
  ['Write notes', 'Review PR', 'Reply to Alex'],
)
assert.deepEqual(
  s.notDone.map(d => [d.text, d.fate]),
  [
    ['Fix flaky timer test', 'later'],
    ['Draft Phase 10 board', 'next'],
  ],
)
assert.deepEqual(
  s.later.map(d => d.text),
  ['Update README'],
)
assert.equal(s.nextTime, 'Silence Slack before the third block.')

// blocks
assert.deepEqual(
  s.blocks.map(b => [b.id, b.focusNumber, b.cut]),
  [
    ['b1', 1, null],
    ['k1', null, null],
    ['b2', 2, null],
    ['k2', null, 'short'],
    ['b3', 3, null],
    ['k3', null, null],
    ['b4', 4, null],
  ],
)
assert.deepEqual(
  s.blocks[2]?.tasks.map(t => t.text),
  ['Review PR', 'Reply to Alex'],
)
assert.equal(s.blocks[0]?.log?.rating, 'deep')

// a break skipped under 60 s reads "skipped"
const quick = mdFixture()
quick.records = quick.records.map(r => (r.id === 'k2' ? { ...r, actualSeconds: 10 } : r))
assert.equal(buildSummary(quick).blocks[3]?.cut, 'skipped')

// no note = stopped; past sessions have no Later list; a saved fate wins over the default
const past = mdFixture()
past.live = false
past.note = null
const ps = buildSummary(past)
assert.equal(ps.status, 'stopped')
assert.deepEqual(ps.later, [])
const over = mdFixture()
over.note = {
  ...must(over.note),
  carried: [{ taskId: 't5', text: 'Draft Phase 10 board', fate: 'drop' }],
}
assert.equal(buildSummary(over).notDone.find(n => n.taskId === 't5')?.fate, 'drop')

// a task completed in any block is Done, never Not done; nothing in both Not done and Later
const dup = mdFixture()
dup.links.push({ ...must(dup.links[3]), blockId: 'b4', completed: true, completedAt: 'x' })
const ds = buildSummary(dup)
assert.ok(ds.done.some(d => d.taskId === 't4'))
assert.ok(!ds.notDone.some(d => d.taskId === 't4'))
dup.tasks = dup.tasks.map(t => (t.id === 't5' ? { ...t, later: true, laterAt: null } : t))
const ls = buildSummary(dup)
assert.ok(!ls.later.some(l => ls.notDone.some(n => n.taskId === l.taskId)))

// defaultFate
const links = mdFixture().links
assert.equal(defaultFate('t5', links, 'b4'), 'next')
assert.equal(defaultFate('t4', links, 'b4'), 'later')

// fateOps
assert.deepEqual(fateOps(null, 'next'), ['plan-next'])
assert.deepEqual(fateOps(null, 'later'), ['set-later'])
assert.deepEqual(fateOps(null, 'drop'), ['archive'])
assert.deepEqual(fateOps('drop', 'next'), ['restore', 'plan-next'])
assert.deepEqual(fateOps('next', 'later'), ['unplan', 'set-later'])
assert.deepEqual(fateOps('later', 'drop'), ['clear-later', 'archive'])
assert.deepEqual(fateOps('next', 'next'), [])

// finishedRecords: ended blocks of the run, step records win by id, sorted by index
// toRecord validates ids as uuids, the fixture uses short ids
const uid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`
const base = mdFixture().records.map((r, i) => ({ ...r, id: uid(i) }))
const blk = (r: (typeof base)[number], over: Partial<Block> = {}): Block =>
  ({
    id: r.id,
    sessionId: r.sessionId,
    kind: r.kind,
    index: r.index,
    plannedSeconds: r.plannedSeconds,
    actualSeconds: r.actualSeconds,
    addedSeconds: r.addedSeconds,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    outcome: r.outcome,
    carriedSeconds: 0,
    firstStartedAt: null,
    ...over,
  }) as Block
const unended = blk(must(base[6]), { endedAt: null, outcome: null })
const fr = finishedRecords(
  [blk(must(base[2])), blk(must(base[0])), unended],
  [{ ...must(base[0]), actualSeconds: 1 }],
)
assert.deepEqual(
  fr.map(r => [r.id, r.actualSeconds]),
  [
    [uid(0), 1],
    [uid(2), 1500],
  ],
)

// toHistoryLinks
const hl = toHistoryLinks(
  [
    {
      blockId: 'b1',
      taskId: 't1',
      planned: true,
      worked: false,
      completed: false,
      workedAt: null,
      completedAt: null,
    },
    {
      blockId: 'b1',
      taskId: 'gone',
      planned: true,
      worked: false,
      completed: false,
      workedAt: null,
      completedAt: null,
    },
  ],
  mdFixture().tasks,
)
assert.deepEqual(
  hl.map(l => [l.taskId, l.text]),
  [['t1', 'Write notes']],
)

// formatting
assert.equal(fmt.compact(3000), '50m')
assert.equal(fmt.compact(3600), '1h')
assert.equal(fmt.compact(5520), '1h 32m')
assert.equal(fmt.added(300), '+5 min')
const now = Date.UTC(2026, 9, 21, 12)
const ago = (d: number) => new Date(now - d * 86_400_000).toISOString()
assert.equal(fmt.since(ago(0), now), 'today')
assert.equal(fmt.since(ago(1), now), 'yesterday')
assert.equal(fmt.since(ago(3), now), 'since Sun')
assert.equal(fmt.since(ago(10), now), 'since 11 Oct')
assert.equal(fmt.day(now, now), 'Wed 21 Oct')
assert.equal(fmt.day(Date.UTC(2025, 8, 16, 9), now), 'Tue 16 Sep 2025')
assert.equal(fmt.dayWithYear(now), 'Wed 21 Oct 2026')
assert.equal(fmt.stamp(Date.UTC(2026, 9, 21, 9, 0)), '2026-10-21-0900')

// schema caps (10-01 contract)
const ok = { blockId: SID, sessionId: SID, rating: null }
assert.equal(blockLogSchema.safeParse({ ...ok, text: 'ok' }).success, true)
assert.equal(blockLogSchema.safeParse({ ...ok, text: 'x'.repeat(2001) }).success, false)
const noteOk = { sessionId: SID, nextTime: '', carried: [] }
assert.equal(
  sessionNoteSchema.safeParse({ ...noteOk, extraDone: Array.from({ length: 21 }, () => 'a') })
    .success,
  false,
)

console.log('summary.check OK')
