// Runnable self-check for guest task parsing (no test runner exists in this repo).
// Run with: bun run src/lib/tasks/tasks-storage.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { parseGuestTasks, toGuestTasks } from './tasks-storage'

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

console.log('tasks-storage.check OK')
