// Runnable self-check for guest task parsing (no test runner exists in this repo).
// Run with: bun run src/lib/tasks/tasks-storage.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import {
  appendGuestLinkHistory,
  parseGuestLinkHistory,
  parseGuestPlan,
  parseGuestTasks,
  toGuestLinkHistory,
  toGuestPlan,
  toGuestTasks,
} from './tasks-storage'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const task = (n: number, over: object = {}) => ({
  id: id(n),
  text: `t${n}`,
  completed: false,
  archived: false,
  ...over,
})

const valid = [task(1), task(2, { completed: true }), task(3, { archived: true })]
assert.deepEqual(parseGuestTasks({ version: 1, tasks: valid }), valid, 'valid order kept')

for (const bad of [null, 'x', 5, {}, { version: 2, tasks: [] }]) {
  assert.deepEqual(parseGuestTasks(bad), [], `rejects ${JSON.stringify(bad)}`)
}

const mixed = [
  task(1),
  task(2, { id: 'x' }),
  task(3, { text: 'a'.repeat(501) }),
  task(4, { text: '' }),
  task(5, { completed: 'yes' }),
  task(6),
]
assert.deepEqual(
  parseGuestTasks({ version: 1, tasks: mixed }).map(t => t.id),
  [id(1), id(6)],
  'invalid items dropped, siblings kept',
)

const many = Array.from({ length: 1200 }, (_, i) => task(i))
assert.equal(parseGuestTasks({ version: 1, tasks: many }).length, 1000, 'capped at 1000')

assert.deepEqual(
  parseGuestTasks({ version: 1, tasks: [task(1), task(1, { text: 'dup' })] }),
  [task(1)],
  'first duplicate wins',
)

assert.deepEqual(parseGuestTasks(toGuestTasks(valid)), valid, 'round trip')

// Plan
const plan = {
  sessionId: id(100),
  wentLive: false,
  blocks: [
    { id: id(1), kind: 'focus' as const, minutes: 25 },
    { id: id(2), kind: 'break' as const, minutes: 5 },
    { id: id(3), kind: 'focus' as const, minutes: 25 },
  ],
}
const link = (blockId: string, over: object = {}) => ({
  blockId,
  taskId: id(50),
  planned: true,
  worked: false,
  completed: false,
  workedAt: null,
  completedAt: null,
  ...over,
})
const links = [link(id(1)), link(id(3))]
assert.deepEqual(parseGuestPlan({ version: 1, plan, links }), { plan, links }, 'valid plan')
for (const bad of [
  null,
  'x',
  {},
  { version: 2, plan, links },
  { version: 1, plan: { ...plan, blocks: [plan.blocks[1]] }, links },
]) {
  assert.deepEqual(parseGuestPlan(bad), { plan: null, links: [] }, 'rejects garbage plan')
}
assert.deepEqual(
  parseGuestPlan({ version: 1, plan, links: [link(id(1)), link(id(99)), { x: 1 }] }).links,
  [link(id(1))],
  'unknown-block and invalid links dropped',
)
const manyLinks = Array.from({ length: 600 }, () => link(id(1)))
assert.equal(parseGuestPlan({ version: 1, plan, links: manyLinks }).links.length, 512, 'links cap')
assert.deepEqual(parseGuestPlan(toGuestPlan(plan, links)), { plan, links }, 'plan round trip')

// link history
const hl = (n: number, over: object = {}) =>
  link(id(1), {
    taskId: id(n),
    worked: true,
    workedAt: `2026-01-01T00:${String(n % 60).padStart(2, '0')}:00.000Z`,
    ...over,
  })
assert.deepEqual(parseGuestLinkHistory('garbage'), [], 'history: garbage')
assert.deepEqual(parseGuestLinkHistory({ version: 2, links: [hl(1)] }), [], 'history: version')
assert.deepEqual(parseGuestLinkHistory({ version: 1, links: 'x' }), [], 'history: non-array')
assert.deepEqual(
  parseGuestLinkHistory({ version: 1, links: [hl(1), { x: 1 }, hl(2)] }),
  [hl(1), hl(2)],
  'history: drops invalid',
)
assert.deepEqual(parseGuestLinkHistory(toGuestLinkHistory([hl(1)])), [hl(1)], 'history: round trip')

const planned = link(id(1), { taskId: id(9) }) // neither worked nor completed
const appended = parseGuestLinkHistory(
  appendGuestLinkHistory(toGuestLinkHistory([hl(1)]), [planned, hl(2)]),
)
assert.deepEqual(appended, [hl(1), hl(2)], 'append keeps worked or completed only')
const replaced = parseGuestLinkHistory(
  appendGuestLinkHistory(toGuestLinkHistory([hl(1)]), [
    hl(1, { completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
  ]),
)
assert.equal(replaced.length, 1, 'append replaces same block and task')
assert.equal(replaced[0]?.completed, true, 'replacement wins')
assert.deepEqual(
  parseGuestLinkHistory(appendGuestLinkHistory('garbage', [hl(3)])),
  [hl(3)],
  'append over corrupt raw',
)
const manyHist = Array.from({ length: 600 }, (_, i) =>
  hl(i + 1, {
    blockId: id(1000 + i),
    workedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
  }),
)
const capped = parseGuestLinkHistory(appendGuestLinkHistory(null, manyHist))
assert.equal(capped.length, 500, 'history cap')
assert.equal(
  capped.some(l => l.blockId === id(1000)),
  false,
  'oldest dropped',
)
assert.equal(
  capped.some(l => l.blockId === id(1599)),
  true,
  'newest kept',
)

console.log('tasks-storage.check OK')
