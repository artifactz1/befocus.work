// Runnable self-check for the now rules. Run with: bun run src/lib/plan/now.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { TaskLink } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { blockRecordTasks, deriveNow, nextNowAfterDone } from './now'

const task = (id: string, o: Partial<Task> = {}): Task => ({
  id,
  text: `Task ${id}`,
  completed: false,
  archived: false,
  ...o,
})
const link = (taskId: string, blockId: string, o: Partial<TaskLink> = {}): TaskLink => ({
  blockId,
  taskId,
  planned: true,
  worked: false,
  completed: false,
  workedAt: null,
  completedAt: null,
  ...o,
})
const tasks = [task('a'), task('b'), task('c')]

// none worked: first in block order; other blocks ignored
const links = [link('x', 'B2'), link('a', 'B1'), link('b', 'B1'), link('c', 'B1')]
assert.equal(deriveNow([link('x', 'B2'), ...links], [...tasks, task('x')], 'B1'), 'a')
// latest workedAt wins
assert.equal(
  deriveNow(
    [
      link('a', 'B1', { worked: true, workedAt: '2026-01-01T10:00:00.000Z' }),
      link('b', 'B1', { worked: true, workedAt: '2026-01-01T10:05:00.000Z' }),
      link('c', 'B1'),
    ],
    tasks,
    'B1',
  ),
  'b',
)
// completed and archived never count; none open gives null
assert.equal(
  deriveNow(
    links,
    [task('a', { completed: true }), task('b', { archived: true }), task('c')],
    'B1',
  ),
  'c',
)
assert.equal(
  deriveNow(
    links,
    tasks.map(t => ({ ...t, completed: true })),
    'B1',
  ),
  null,
)
assert.equal(deriveNow([], tasks, 'B1'), null)
// a worked-but-completed task is skipped even with the latest stamp
assert.equal(
  deriveNow(
    [link('a', 'B1', { worked: true, workedAt: '2026-01-01T10:09:00.000Z' }), link('b', 'B1')],
    [task('a', { completed: true }), task('b')],
    'B1',
  ),
  'b',
)

// next after done: next open in order, wrapping, else null
assert.equal(nextNowAfterDone(links, tasks, 'B1', 'a'), 'b')
assert.equal(nextNowAfterDone(links, tasks, 'B1', 'c'), 'a')
assert.equal(
  nextNowAfterDone(links, [task('a'), task('b', { completed: true }), task('c')], 'B1', 'a'),
  'c',
)
assert.equal(nextNowAfterDone([link('a', 'B1')], [task('a')], 'B1', 'a'), null)

// block record: completed only under completed; other blocks and unknown tasks ignored
const rec = blockRecordTasks(
  [
    link('a', 'B1', { worked: true }),
    link('b', 'B1', { worked: true, completed: true }),
    link('c', 'B2', { worked: true }),
    link('zzz', 'B1', { worked: true }),
    link('c', 'B1'),
  ],
  tasks,
  'B1',
)
assert.deepEqual(
  rec.worked.map(t => t.id),
  ['a'],
)
assert.deepEqual(
  rec.completed.map(t => t.id),
  ['b'],
)

console.log('now.check OK')
