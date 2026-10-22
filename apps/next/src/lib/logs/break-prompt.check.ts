// Runnable self-check for breakPromptFor (no test runner exists in this repo).
// Run with: bun run src/lib/logs/break-prompt.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { Run } from '../blocks/blocks'
import { breakPromptFor } from './break-prompt'

const blk = (id: string, kind: 'focus' | 'break', index: number, endedAt: number | null) => ({
  id,
  sessionId: 's',
  kind,
  index,
  plannedSeconds: 60,
  actualSeconds: 0,
  addedSeconds: 0,
  startedAt: null,
  endedAt,
  outcome: null,
  carriedSeconds: 0,
  firstStartedAt: null,
})
const run = (cur: string, status: Run['status'], focusEnded: number | null = 1): Run => ({
  sessionId: 's',
  blocks: [blk('f1', 'focus', 0, focusEnded), blk('b1', 'break', 1, null), blk('f2', 'focus', 2, null)],
  currentBlockId: cur,
  status,
  endsAt: null,
  remainingMs: 0,
  segmentStartedAt: null,
  activeMs: 0,
  completed: false,
})

const none = new Set<string>()
const ended = run('f1', 'ended')
const brk = run('b1', 'running')

assert.deepEqual(breakPromptFor(ended, brk, none, true), { breakId: 'b1', focusId: 'f1' })
assert.equal(breakPromptFor(ended, brk, none, false), null)
assert.equal(breakPromptFor(ended, brk, new Set(['b1']), true), null)
// resume of a paused break
assert.equal(breakPromptFor(run('b1', 'paused'), brk, none, true), null)
// running focus
assert.equal(breakPromptFor(run('f1', 'idle'), run('f1', 'running'), none, true), null)
assert.equal(breakPromptFor(ended, run('f2', 'running'), none, true), null)
// skipped focus (endedAt set) still prompts; focus never ended does not
assert.deepEqual(breakPromptFor(run('f1', 'running'), run('b1', 'running'), none, true), {
  breakId: 'b1',
  focusId: 'f1',
})
assert.equal(breakPromptFor(ended, run('b1', 'running', null), none, true), null)
// break not yet running
assert.equal(breakPromptFor(ended, run('b1', 'idle'), none, true), null)

console.log('break-prompt.check OK')
