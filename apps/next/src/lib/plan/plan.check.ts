// Runnable self-check for the plan module (no test runner exists in this repo).
// Run with: bun run src/lib/plan/plan.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { PLAN_LIMITS, planBlocksSchema } from '@repo/types/plan'
import {
  addFocusBlock,
  deriveBlockTimes,
  formatDuration,
  nudgeBlock,
  plannedBlockNumber,
  planSummary,
  planTask,
  removeBlock,
  seedFromSettings,
  type TimedBlock,
} from './plan'

let n = 0
const at = <T>(a: T[], i: number): T => {
  const v = a[i]
  assert.ok(v)
  return v
}
const newId = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`
const settings = { sessions: 6, workMinutes: 25, breakMinutes: 5 }
const kinds = (b: { kind: string }[]) => b.map(x => x.kind[0]).join('')

// seed + summary + durations
const seed = seedFromSettings(settings, newId)
assert.equal(seed.length, 11)
assert.equal(kinds(seed), 'fbfbfbfbfbf')
assert.equal(new Set(seed.map(b => b.id)).size, 11)
assert.equal(planSummary(seed), '6 blocks · 2 h 55 min')
assert.equal(formatDuration(25), '25 min')
assert.equal(formatDuration(175), '2 h 55 min')
assert.equal(formatDuration(60), '1 h')
assert.equal(planBlocksSchema.safeParse(seed).success, true)

// add: appends [break, focus]; capped at 16 focus blocks
const added = addFocusBlock(seed, { workMinutes: 30, breakMinutes: 10 }, newId)
assert.equal(added.length, 13)
assert.deepEqual(
  added.slice(-2).map(b => [b.kind, b.minutes]),
  [
    ['break', 10],
    ['focus', 30],
  ],
)
let full = seed
while (full.filter(b => b.kind === 'focus').length < PLAN_LIMITS.maxFocus) {
  full = addFocusBlock(full, settings, newId)
}
assert.equal(full.length, 31)
assert.equal(addFocusBlock(full, settings, newId), full)
assert.equal(planBlocksSchema.safeParse(full).success, true)

// remove: focus k>0 drops the break before; first drops the break after; last one is kept
const mid = removeBlock(seed, at(seed, 4).id)
assert.equal(mid.blocks.length, 9)
assert.equal(kinds(mid.blocks), 'fbfbfbfbf')
assert.equal(
  mid.blocks.some(b => b.id === at(seed, 3).id || b.id === at(seed, 4).id),
  false,
)
assert.equal(mid.removedIndex, 4)
const first = removeBlock(seed, at(seed, 0).id)
assert.equal(at(first.blocks, 0).id, at(seed, 2).id)
assert.equal(first.blocks.length, 9)
const one = seedFromSettings({ ...settings, sessions: 1 }, newId)
assert.equal(removeBlock(one, at(one, 0).id).blocks, one)
assert.equal(removeBlock(seed, at(seed, 1).id).blocks, seed)

// nudge: step 5, clamp 5-90
const single = (m: number) => [{ id: 'x', kind: 'focus' as const, minutes: m }]
assert.equal(nudgeBlock(single(90), 'x', 5)[0]?.minutes, 90)
assert.equal(nudgeBlock(single(5), 'x', -5)[0]?.minutes, 5)
assert.equal(nudgeBlock(single(25), 'x', 5)[0]?.minutes, 30)
assert.equal(nudgeBlock(single(25), 'x', -5)[0]?.minutes, 20)

// derived times: planning chain
const T0 = Date.UTC(2026, 0, 1, 10, 0)
const timed = (b: { id: string; kind: 'focus' | 'break'; minutes: number }): TimedBlock => ({
  id: b.id,
  kind: b.kind,
  plannedSeconds: b.minutes * 60,
  addedSeconds: 0,
  startedAt: null,
  endedAt: null,
  leftSeconds: null,
})
const planning = deriveBlockTimes(seed.map(timed), T0, T0)
assert.equal(at(planning, 0).start, T0)
assert.equal(at(planning, 0).end, T0 + 25 * 60_000)
for (let i = 1; i < planning.length; i++)
  assert.equal(at(planning, i).start, at(planning, i - 1).end)
assert.equal(at(planning, 10).end, T0 + 175 * 60_000)

// derived times: live. block 1 done, block 3 (index 2) current with 10 min left
const live = (added: number): TimedBlock[] => {
  const t = seed.map(timed)
  t[0] = { ...at(t, 0), startedAt: T0, endedAt: T0 + 25 * 60_000 }
  t[1] = { ...at(t, 1), startedAt: T0 + 25 * 60_000, endedAt: T0 + 30 * 60_000 }
  t[2] = { ...at(t, 2), startedAt: T0 + 30 * 60_000, addedSeconds: added, leftSeconds: 600 + added }
  return t
}
const now = T0 + 45 * 60_000
const base = deriveBlockTimes(live(0), T0, now)
assert.equal(at(base, 0).end, T0 + 25 * 60_000)
assert.equal(at(base, 2).end, now + 600_000)
assert.equal(at(base, 3).start, at(base, 2).end)
const plus = deriveBlockTimes(live(300), T0, now)
assert.equal(at(plus, 3).start - at(base, 3).start, 300_000)
assert.equal(at(plus, 10).end - at(base, 10).end, 300_000)

// schema rejections
const b = (_: string, kind: 'focus' | 'break', minutes: number) => ({ id: newId(), kind, minutes })
const bad = (blocks: unknown) => planBlocksSchema.safeParse(blocks).success === false
assert.ok(bad([b('', 'focus', 25), b('', 'focus', 25)]), 'adjacent focus')
assert.ok(bad([b('', 'break', 5), b('', 'focus', 25)]), 'leading break')
const dup = b('', 'focus', 25)
assert.ok(bad([dup, b('', 'break', 5), dup]), 'duplicate ids')
assert.ok(bad(seedFromSettings({ ...settings, sessions: 17 }, newId)), '17 focus')
for (const m of [3, 95, 7.5]) assert.ok(bad([b('', 'focus', m)]), `focus ${m}`)
assert.equal(planBlocksSchema.safeParse([b('', 'focus', 7)]).success, true)

// planTask: move keeps worked/completed, unplan-all adds nothing, other tasks untouched
const L = (taskId: string, blockId: string, planned = true) => ({
  blockId,
  taskId,
  planned,
  worked: true,
  completed: false,
  workedAt: null,
  completedAt: null,
})
const start = [L('t1', 'b1'), L('t2', 'b1')]
const moved = planTask(start, 't1', 'b2')
assert.equal(moved.length, 3)
assert.deepEqual(moved[0], { ...L('t1', 'b1'), planned: false })
assert.equal(moved[1], start[1])
assert.deepEqual(at(moved, 2), {
  blockId: 'b2',
  taskId: 't1',
  planned: true,
  worked: false,
  completed: false,
  workedAt: null,
  completedAt: null,
})
const back = planTask(moved, 't1', 'b1')
assert.equal(back.length, 3)
assert.equal(back.filter(l => l.taskId === 't1' && l.planned).length, 1)
assert.equal(at(back, 0).planned, true)
const none = planTask(moved, 't1', null)
assert.equal(none.length, 3)
assert.equal(
  none.some(l => l.taskId === 't1' && l.planned),
  false,
)
assert.equal(planTask(start, 't9', null).length, 2)

assert.equal(plannedBlockNumber(seed, [L('t1', at(seed, 2).id)], 't1'), 2)
assert.equal(plannedBlockNumber(seed, [L('t1', at(seed, 2).id, false)], 't1'), null)
assert.equal(plannedBlockNumber(seed, [L('t1', 'gone')], 't1'), null)

console.log('plan.check OK')
