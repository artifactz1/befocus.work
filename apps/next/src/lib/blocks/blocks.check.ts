// Runnable self-check for the block run engine (no test runner exists in this repo).
// Run with: bun run src/lib/blocks/blocks.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { MAX_ACTUAL_SECONDS, MAX_ADDED_SECONDS } from '@repo/types/blocks'
import {
  adjust,
  type Block,
  badgeText,
  buildSeed,
  canAdjust,
  createRun,
  currentBlock,
  legacy,
  minutesLabel,
  nudgeDelays,
  pause,
  pendingRecord,
  type Run,
  resetBlock,
  resetSession,
  seed,
  skip,
  start,
  startNext,
  tick,
  timeLeftSeconds,
  toRecord,
} from './blocks'

let n = 0
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`
const T0 = 1_800_000_000_000
const sizes = { workDuration: 1500, breakDuration: 300, sessions: 3 }
const fresh = () => ({ sessionId: uuid(), seed: buildSeed(sizes, uuid) })
const mk = (): Run => createRun(uuid(), buildSeed(sizes, uuid))
const cur = (r: Run): Block => currentBlock(r)

// buildSeed
const sd = buildSeed(sizes, uuid)
assert.deepEqual(
  sd.map(b => [b.kind, b.plannedSeconds]),
  [
    ['focus', 1500],
    ['break', 300],
    ['focus', 1500],
    ['break', 300],
    ['focus', 1500],
  ],
)

// createRun
let r = mk()
assert.equal(r.status, 'idle')
assert.equal(r.currentBlockId, r.blocks[0]?.id)
assert.equal(r.remainingMs, 1_500_000)
assert.deepEqual(
  r.blocks.map(b => b.index),
  [0, 1, 2, 3, 4],
)
assert.ok(r.blocks.every(b => b.sessionId === r.sessionId && b.startedAt === null))

// start, pause, resume
r = start(mk(), T0)
assert.equal(r.status, 'running')
assert.equal(r.endsAt, T0 + 1_500_000)
assert.equal(cur(r).startedAt, T0)
assert.equal(r.segmentStartedAt, T0)
const p = pause(r, T0 + 10_000)
assert.equal(p.status, 'paused')
assert.equal(p.activeMs, 10_000)
assert.equal(timeLeftSeconds(p, T0 + 99_000), 1490)
let q = start(p, T0 + 70_000)
assert.equal(q.endsAt, T0 + 70_000 + 1_490_000)
assert.equal(cur(q).startedAt, T0)

// tick
r = start(mk(), T0)
assert.equal(tick(r, T0 + 1000).run, r)
assert.deepEqual(tick(r, T0 + 1000).records, [])
let e = tick(r, T0 + 9_999_999) // woke from sleep long after the end
assert.equal(e.run.status, 'ended')
assert.equal(cur(e.run).endedAt, T0 + 1_500_000)
assert.equal(cur(e.run).outcome, 'finished')
assert.equal(cur(e.run).actualSeconds, 1500)
assert.equal(e.records.length, 1)
assert.equal((e.records[0]?.endedAt ?? 0) - (e.records[0]?.startedAt ?? 0), 1_500_000)
assert.equal(timeLeftSeconds(e.run, T0 + 9_999_999), 0)
// pause then run to end
q = start(pause(start(mk(), T0), T0 + 10_000), T0 + 70_000)
e = tick(q, q.endsAt as number)
assert.equal(e.records[0]?.actualSeconds, 1500)
assert.equal(e.records[0]?.endedAt, T0 + 70_000 + 1_490_000)

// timeLeftSeconds
assert.equal(timeLeftSeconds(r, T0 + 1), 1500)
assert.equal(timeLeftSeconds(r, T0 + 1_499_001), 1)
assert.equal(timeLeftSeconds(r, T0 + 2_000_000), 0)
assert.equal(timeLeftSeconds(mk(), T0), 1500)

// canAdjust / adjust
r = start(mk(), T0)
assert.equal(canAdjust(mk(), 1, T0), false)
assert.equal(canAdjust(p, 1, T0), false)
assert.equal(canAdjust(r, 5, T0), true)
const at420 = T0 + 1_500_000 - 260_000 // 04:20 left
assert.equal(canAdjust(r, -1, at420), true)
assert.equal(canAdjust(r, -5, at420), false)
assert.equal(canAdjust(r, -1, T0 + 1_500_000 - 60_000), false)
let a = adjust(r, 5, T0)
assert.equal(a.endsAt, T0 + 1_500_000 + 300_000)
assert.equal(cur(a).addedSeconds, 300)
a = adjust(r, -1, T0)
assert.equal(a.endsAt, T0 + 1_500_000 - 60_000)
assert.equal(cur(a).addedSeconds, -60)
assert.equal(adjust(r, -30, at420), r)
const capped = { ...r, blocks: r.blocks.map(b => ({ ...b, addedSeconds: MAX_ADDED_SECONDS })) }
assert.equal(canAdjust(capped, 1, T0), false)
assert.equal(adjust(capped, 1, T0), capped)

// adjust while ended
e = tick(r, T0 + 1_500_000)
assert.equal(canAdjust(e.run, -1, T0 + 1_600_000), false)
assert.equal(canAdjust(e.run, 1, T0 + 1_600_000), true)
const t = T0 + 1_600_000
const back = adjust(e.run, 1, t)
assert.equal(back.status, 'running')
assert.equal(back.endsAt, t + 60_000)
assert.equal(back.segmentStartedAt, t)
assert.equal(cur(back).endedAt, null)
assert.equal(cur(back).outcome, null)
assert.equal(cur(back).addedSeconds, 60)
assert.equal(cur(back).id, cur(e.run).id)
const again = tick(back, t + 60_000)
assert.equal(again.records[0]?.id, e.records[0]?.id)
assert.equal(again.records[0]?.actualSeconds, 1560)
assert.equal(again.records[0]?.addedSeconds, 60)

// startNext
const n1 = startNext(e.run, t, fresh)
assert.equal(n1.run.currentBlockId, e.run.blocks[1]?.id)
assert.equal(n1.run.status, 'running')
assert.equal(n1.run.endsAt, t + 300_000)
assert.deepEqual(n1.records, [])
const lastRun = mk()
const atLast = start({ ...lastRun, currentBlockId: lastRun.blocks[4]?.id ?? '' }, T0)
const lastEnded = tick(atLast, T0 + 1_500_000).run
const fin = startNext(lastEnded, T0 + 1_600_000, fresh)
assert.equal(fin.run.completed, true)
assert.equal(fin.run.status, 'idle')
assert.notEqual(fin.run.sessionId, lastRun.sessionId)
assert.equal(startNext(r, T0, fresh).run, r)

// skip forward from running
r = start(mk(), T0)
let s = skip(r, 1, T0 + 60_000, fresh)
assert.equal(s.records.length, 1)
assert.equal(s.records[0]?.outcome, 'skipped')
assert.equal(s.records[0]?.actualSeconds, 60)
assert.equal(s.run.currentBlockId, r.blocks[1]?.id)
assert.equal(s.run.status, 'idle')
assert.equal(cur(s.run).startedAt, null)
// skip from paused
s = skip(pause(r, T0 + 30_000), 1, T0 + 99_000, fresh)
assert.equal(s.records[0]?.actualSeconds, 30)
// skip on a block that never started
s = skip(mk(), 1, T0, fresh)
assert.deepEqual(s.records, [])
// skip forward from ended keeps finished
e = tick(r, T0 + 1_500_000)
s = skip(e.run, 1, T0 + 1_600_000, fresh)
assert.deepEqual(s.records, [])
assert.equal(s.run.blocks[0]?.outcome, 'finished')
assert.equal(s.run.currentBlockId, r.blocks[1]?.id)
assert.equal(s.run.status, 'idle')
// skip forward on the last block finishes the session
s = skip(atLast, 1, T0 + 5000, fresh)
assert.equal(s.run.completed, true)
assert.equal(s.records[0]?.outcome, 'skipped')
s = skip({ ...lastEnded }, 1, T0 + 1_600_000, fresh)
assert.equal(s.run.completed, true)
assert.deepEqual(s.records, [])

// skip back
assert.equal(skip(mk(), -1, T0, fresh).run.status, 'idle')
const sameIdle = mk()
assert.equal(skip(sameIdle, -1, T0, fresh).run, sameIdle)
assert.equal(skip(e.run, -1, T0 + 1_600_000, fresh).run, e.run)
assert.equal(skip(p, -1, T0 + 100_000, fresh).run, p)
assert.equal(skip(r, -1, T0 + 5000, fresh).run.status, 'paused')
assert.deepEqual(skip(r, -1, T0 + 5000, fresh).records, [])
const second = skip(e.run, 1, T0 + 1_600_000, fresh).run // on break, block 0 finished
const sb = skip(start(second, T0 + 1_700_000), -1, T0 + 1_710_000, fresh)
assert.equal(sb.records.length, 1)
assert.equal(sb.records[0]?.outcome, 'skipped')
assert.equal(sb.records[0]?.kind, 'break')
assert.equal(sb.run.currentBlockId, second.blocks[0]?.id)
assert.equal(sb.run.status, 'idle')
// skip back from idle: no record
assert.deepEqual(skip(second, -1, T0 + 1_700_000, fresh).records, [])

// re-run accumulate
const base = createRun(uuid(), [
  { id: uuid(), kind: 'focus', plannedSeconds: 1500 },
  { id: uuid(), kind: 'break', plannedSeconds: 300 },
])
let w = start(base, T0)
w = pause(w, T0 + 600_000) // 600 s focus
w = skip(w, 1, T0 + 600_000, fresh).run // skipped record would be 600 on block 0
assert.equal(w.blocks[0]?.outcome, 'skipped')
assert.equal(w.blocks[0]?.actualSeconds, 600)
w = skip(w, -1, T0 + 700_000, fresh).run // re-run block 0 (idle)
assert.equal(cur(w).carriedSeconds, 600)
assert.equal(cur(w).id, base.blocks[0]?.id)
const t1 = T0 + 800_000
w = start(w, t1)
const rs = resetBlock(w, t1 + 120_000)
assert.equal(rs.records.length, 1)
assert.equal(rs.records[0]?.id, base.blocks[0]?.id)
assert.equal(rs.records[0]?.actualSeconds, 720)
assert.equal(rs.records[0]?.startedAt, T0)
assert.equal(rs.records[0]?.outcome, 'reset')
assert.equal(rs.run.status, 'idle')
assert.equal(cur(rs.run).carriedSeconds, 720)
assert.equal(rs.run.remainingMs, 1_500_000)
assert.equal(cur(rs.run).addedSeconds, 0)
const t2 = t1 + 200_000
const done = tick(start(rs.run, t2), t2 + 1_500_000)
assert.equal(done.records[0]?.id, base.blocks[0]?.id)
assert.equal(done.records[0]?.actualSeconds, 720 + 1500)
assert.equal(done.records[0]?.startedAt, T0)
assert.equal(done.records[0]?.outcome, 'finished')
const huge = { ...rs.run, blocks: rs.run.blocks.map(b => ({ ...b, carriedSeconds: 86_000 })) }
assert.equal(tick(start(huge, t2), t2 + 1_500_000).records[0]?.actualSeconds, MAX_ACTUAL_SECONDS)

// resetBlock on ended
const re = resetBlock(e.run, T0 + 1_600_000)
assert.deepEqual(re.records, [])
assert.equal(re.run.status, 'idle')
assert.equal(cur(re.run).carriedSeconds, 1500)
assert.equal(cur(re.run).outcome, null)
// resetBlock on an idle never-started block
assert.deepEqual(resetBlock(mk(), T0).records, [])

// resetSession
const rr = resetSession(start(mk(), T0), T0 + 5000, 'ffffffff-ffff-4fff-8fff-ffffffffffff', sd)
assert.equal(rr.records.length, 1)
assert.equal(rr.records[0]?.outcome, 'reset')
assert.equal(rr.run.sessionId, 'ffffffff-ffff-4fff-8fff-ffffffffffff')
assert.equal(rr.run.status, 'idle')
assert.deepEqual(resetSession(mk(), T0, uuid(), sd).records, [])

// pendingRecord
r = start(mk(), T0)
let pr = pendingRecord(r, T0 + 90_000)
assert.equal(pr?.outcome, 'reset')
assert.equal(pr?.actualSeconds, 90)
assert.equal(pr?.endedAt, T0 + 90_000)
assert.equal(r.status, 'running')
assert.equal(cur(r).outcome, null)
pr = pendingRecord(pause(r, T0 + 30_000), T0 + 500_000)
assert.equal(pr?.actualSeconds, 30)
pr = pendingRecord(start(rs.run, t2), t2 + 10_000)
assert.equal(pr?.actualSeconds, 730)
assert.equal(pendingRecord(mk(), T0), null)
assert.equal(pendingRecord(e.run, T0 + 2_000_000), null)
assert.equal(pendingRecord(fin.run, T0), null)
pr = pendingRecord(r, T0 + 1_500_000 + 600_000)
assert.equal(pr?.outcome, 'finished')
assert.equal(pr?.endedAt, T0 + 1_500_000)
assert.equal(pr?.actualSeconds, 1500)

// seed
const fresh1 = mk()
const reseed = seed(fresh1, { sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', blocks: sd })
assert.equal(reseed?.sessionId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
assert.equal(reseed?.blocks.length, 5)
const live = skip(start(mk(), T0), 1, T0 + 1000, fresh).run // current = break (index 1)
const newSeed = [
  ...live.blocks.map(b => ({ id: b.id, kind: b.kind, plannedSeconds: b.plannedSeconds })),
]
newSeed.push({ id: uuid(), kind: 'focus', plannedSeconds: 900 })
const grown = seed(live, { sessionId: live.sessionId, blocks: newSeed })
assert.equal(grown?.blocks.length, 6)
assert.equal(grown?.blocks[0]?.outcome, 'skipped')
assert.equal(grown?.blocks[5]?.plannedSeconds, 900)
assert.equal(grown?.blocks[5]?.index, 5)
assert.equal(seed(live, { sessionId: uuid(), blocks: newSeed }), null)

// legacy
r = mk()
assert.deepEqual(legacy(r, T0, 3), {
  timeLeft: 1500,
  isRunning: false,
  isWorking: true,
  currentSession: 1,
})
const onBreak = skip(r, 1, T0, fresh).run
assert.equal(legacy(onBreak, T0, 3).isWorking, false)
assert.equal(legacy(onBreak, T0, 3).currentSession, 1)
const onSecond = skip(onBreak, 1, T0, fresh).run
assert.equal(legacy(onSecond, T0, 3).currentSession, 2)
assert.equal(legacy(start(r, T0), T0, 3).isRunning, true)
assert.equal(legacy(fin.run, T0, 3).currentSession, 4)

// toRecord
assert.equal(toRecord(cur(r)), null)
const warn = console.warn
console.warn = () => {}
assert.equal(toRecord({ ...cur(e.run), id: 'not-a-uuid' }), null)
console.warn = warn

// nudgeDelays, badgeText, minutesLabel
assert.deepEqual(nudgeDelays(T0, T0 + 45_000), [15_000])
assert.deepEqual(nudgeDelays(T0, T0), [30_000, 60_000])
assert.deepEqual(nudgeDelays(T0, T0 + 90_000), [])
assert.equal(badgeText(0), null)
assert.equal(badgeText(300), '+5')
assert.equal(badgeText(-180), '−3')
assert.equal(minutesLabel(1), '1 minute')
assert.equal(minutesLabel(5), '5 minutes')

console.log('blocks.check: ok')
