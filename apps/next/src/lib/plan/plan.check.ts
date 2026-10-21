// Runnable self-check for the plan module (no test runner exists in this repo).
// Run with: bun run src/lib/plan/plan.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { PLAN_LIMITS, planBlocksSchema } from '@repo/types/plan'
import {
  addFocusBlock,
  buildSessionView,
  deriveBlockTimes,
  formatDuration,
  nudgeBlock,
  plannedBlockNumber,
  planSummary,
  planTask,
  reconcilePlan,
  removeBlock,
  reseedFromSettings,
  seedFromSettings,
  type TimedBlock,
  toSeed,
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

// toSeed
const seeded = toSeed({ blocks: seed })
assert.equal(seeded.length, 11)
assert.deepEqual(at(seeded, 1), { id: at(seed, 1).id, kind: 'break', plannedSeconds: 300 })

// reconcilePlan: keep / adopt / close (reads only the plan and links)
const P = (wentLive: boolean) => ({ sessionId: 's1', wentLive })
assert.equal(reconcilePlan(P(false), [], { sessionId: 's1' }), 'keep')
assert.equal(reconcilePlan(P(true), [], { sessionId: 's1' }), 'keep')
assert.equal(reconcilePlan(P(false), [], { sessionId: 's2' }), 'adopt')
assert.equal(reconcilePlan(P(true), [], { sessionId: 's2' }), 'close')
assert.equal(reconcilePlan(P(false), [L('t1', 'b1')], { sessionId: 's2' }), 'close')
assert.equal(
  reconcilePlan(P(false), [{ ...L('t1', 'b1'), worked: false }], { sessionId: 's2' }),
  'adopt',
)

// reseedFromSettings: shrink keeps the first ids, grow adds new ones
const shrunk = reseedFromSettings(seed, { ...settings, sessions: 4 }, newId)
assert.equal(shrunk.length, 7)
assert.deepEqual(
  shrunk.map(x => x.id),
  seed.slice(0, 7).map(x => x.id),
)
const grown = reseedFromSettings(shrunk, { sessions: 5, workMinutes: 30, breakMinutes: 10 }, newId)
assert.equal(grown.length, 9)
assert.deepEqual(
  grown.slice(0, 7).map(x => x.id),
  shrunk.map(x => x.id),
)
assert.equal(new Set(grown.map(x => x.id)).size, 9)
assert.equal(at(grown, 0).minutes, 30)
assert.equal(planBlocksSchema.safeParse(grown).success, true)

// buildSessionView
const plan0 = { sessionId: 's1', wentLive: false, blocks: seed }
const sb = (i: number, over: Record<string, unknown> = {}) => ({
  id: at(seed, i).id,
  plannedSeconds: at(seed, i).minutes * 60,
  actualSeconds: 0,
  addedSeconds: 0,
  startedAt: null as number | null,
  endedAt: null as number | null,
  ...over,
})
const taskList = [
  { id: 't1', completed: true, archived: false },
  { id: 't2', completed: false, archived: false },
  { id: 't3', completed: false, archived: false },
]
const vlinks = [
  { ...L('t1', at(seed, 0).id), worked: true, completed: true },
  { ...L('t2', at(seed, 2).id), worked: false },
  { ...L('t3', at(seed, 4).id), worked: false },
]
const view = (storeBlocks: ReturnType<typeof sb>[], extra: Record<string, unknown> = {}) =>
  buildSessionView({
    plan: plan0,
    storeBlocks,
    currentBlockId: at(seed, 0).id,
    paused: false,
    timeLeft: 25 * 60,
    links: vlinks,
    tasks: taskList,
    now: T0,
    ...extra,
  })
const idle = view(seed.map((_, i) => sb(i)))
assert.equal(idle.state, 'planning')
assert.equal(idle.current, null)
assert.ok(idle.blocks.every(x => x.state === 'ahead'))
assert.equal(at(idle.blocks, 0).start, T0)
assert.equal(idle.summary.plannedTasks, 3)

const liveBlocks = (added: number) => [
  sb(0, { startedAt: T0, endedAt: T0 + 25 * 60_000, actualSeconds: 1500 }),
  sb(1, { startedAt: T0 + 25 * 60_000, endedAt: T0 + 30 * 60_000, actualSeconds: 300 }),
  sb(2, { startedAt: T0 + 30 * 60_000, addedSeconds: added }),
  ...seed.slice(3).map((_, i) => sb(i + 3)),
]
const liveView = (added: number, paused = false) =>
  view(liveBlocks(added), {
    currentBlockId: at(seed, 2).id,
    timeLeft: 600 + added,
    paused,
    now: T0 + 45 * 60_000,
  })
const lv = liveView(0)
assert.equal(lv.state, 'live')
assert.deepEqual(
  lv.blocks.slice(0, 4).map(x => x.state),
  ['done', 'done', 'current', 'ahead'],
)
assert.equal(lv.currentIndex, 2)
assert.equal(at(lv.blocks, 2).elapsedSeconds, 900)
assert.equal(at(lv.blocks, 4).focusNumber, 3)
assert.equal(lv.summary.focusElapsedSeconds, 1500 + 900)
assert.equal(lv.summary.doneTasks, 1)
assert.equal(lv.summary.plannedTasks, 3)
assert.deepEqual(at(lv.blocks, 0).taskIds, ['t1'])
assert.equal(at(lv.blocks, 2).paused, false)
assert.equal(liveView(0, true).current?.paused, true)
const lvAdded = liveView(300)
assert.equal(lvAdded.summary.addedTotal, 300)
assert.equal(at(lvAdded.blocks, 2).addedSeconds, 300)
assert.equal(at(lvAdded.blocks, 3).start - at(lv.blocks, 3).start, 300_000)
assert.equal(at(lvAdded.blocks, 2).elapsedSeconds, 900)

console.log('plan.check OK')
