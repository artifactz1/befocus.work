// Run: cd packages/api && bun run src/routes/blocks/blocks.check.ts
import assert from 'node:assert/strict'
import type { BlockRecord } from '../../../../types/blocks'
import { insertFocusBlockSchema } from '../../db/tables/focus-blocks'
import { toRows } from './blocks.handler'
import { putBlocksBodySchema } from './blocks.route'

const rec = (n: number, over: Partial<BlockRecord> = {}): BlockRecord => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  sessionId: '11111111-1111-4111-8111-111111111111',
  kind: 'focus',
  index: 0,
  plannedSeconds: 1500,
  actualSeconds: 1500,
  addedSeconds: 0,
  startedAt: 1_800_000_000_000,
  endedAt: 1_800_001_500_000,
  outcome: 'finished',
  ...over,
})
const ok = (records: unknown[]) => putBlocksBodySchema.safeParse({ records }).success

assert.equal(ok([]), false)
assert.equal(ok([rec(1)]), true)
assert.equal(ok(Array.from({ length: 100 }, (_, i) => rec(i + 1))), true)
assert.equal(ok(Array.from({ length: 101 }, (_, i) => rec(i + 1))), false)
assert.equal(ok([{ ...rec(1), extra: 1 }]), false)
assert.equal(ok([rec(1, { id: 'nope' })]), false)
assert.equal(ok([rec(1, { startedAt: 1_800_000_002_000, endedAt: 1_800_000_001_000 })]), false)
assert.equal(ok([rec(1, { addedSeconds: 21_601 })]), false)
assert.equal(ok([rec(1, { actualSeconds: 1.5 })]), false)

const a = rec(1)
const b = rec(2)
const a2 = rec(1, { actualSeconds: 1700, addedSeconds: 200 })
const rows = toRows('u1', [a, b, a2])
assert.equal(rows.length, 2)
assert.ok(rows.every(r => r.userId === 'u1'))
const ra = rows.find(r => r.id === a.id)
assert.ok(ra)
assert.equal(ra.actualSeconds, 1700)
assert.equal(ra.addedSeconds, 200)
assert.equal((ra.startedAt as Date).getTime(), a.startedAt)
assert.equal((ra.endedAt as Date).getTime(), a.endedAt)
for (const r of rows) assert.ok(insertFocusBlockSchema.safeParse(r).success)

console.log('blocks.check: ok')
