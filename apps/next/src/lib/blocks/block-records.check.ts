// Runnable self-check for guest block record storage (no test runner exists in this repo).
// Run with: bun run src/lib/blocks/block-records.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { BlockRecord } from '@repo/types/blocks'
import {
  appendGuestRecords,
  GUEST_RECORDS_KEY,
  MAX_STORED_RECORDS,
  mergeRecords,
  readGuestRecords,
} from './block-records'

const fake = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init))
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v)
    },
  }
}
const boom = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
}
const sessionId = crypto.randomUUID()
const rec = (over: Partial<BlockRecord> = {}): BlockRecord => ({
  id: crypto.randomUUID(),
  sessionId,
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
const ids = (rs: BlockRecord[]) => rs.map(r => r.id)

assert.equal(GUEST_RECORDS_KEY, 'befocus.blockRecords')
assert.equal(MAX_STORED_RECORDS, 500)

// mergeRecords
{
  const a = rec()
  const b = rec()
  assert.deepEqual(mergeRecords([], [a], 500), [a], 'empty plus one')
  const a2 = { ...a, addedSeconds: 60 }
  assert.deepEqual(mergeRecords([a, b], [a2], 500), [b, a2], 'upsert moves to the end')
  const older = Array.from({ length: 499 }, () => rec())
  const fresh = [rec(), rec(), rec()]
  const capped = mergeRecords(older, fresh, 500)
  assert.equal(capped.length, 500, 'cap')
  assert.deepEqual(ids(capped.slice(-3)), ids(fresh), 'newest kept')
  assert.deepEqual(ids(capped.slice(0, 497)), ids(older.slice(2)), 'oldest dropped')
  const d1 = rec()
  const d2 = { ...d1, outcome: 'reset' as const }
  assert.deepEqual(mergeRecords([], [d1, d2], 500), [d2], 'last duplicate in incoming wins')
}

// readGuestRecords
{
  assert.deepEqual(readGuestRecords(fake()), [], 'missing key')
  assert.deepEqual(readGuestRecords(fake({ [GUEST_RECORDS_KEY]: '{' })), [], 'bad JSON')
  assert.deepEqual(readGuestRecords(fake({ [GUEST_RECORDS_KEY]: '{"a":1}' })), [], 'non-array')
  assert.deepEqual(readGuestRecords(boom), [], 'throwing storage')
  assert.deepEqual(readGuestRecords(undefined), [], 'no storage')
  const [r1, r2] = [rec(), rec()]
  const st = fake({ [GUEST_RECORDS_KEY]: JSON.stringify([r1, { junk: 1 }, r2]) })
  assert.deepEqual(readGuestRecords(st), [r1, r2], 'invalid entries dropped')
}

// appendGuestRecords
{
  const r = rec()
  const st = fake()
  assert.equal(appendGuestRecords([r], st), true)
  assert.deepEqual(readGuestRecords(st), [r], 'round trip')
  const r2 = { ...r, addedSeconds: 300 }
  appendGuestRecords([r2], st)
  assert.deepEqual(readGuestRecords(st), [r2], 'same id updates in place')
  assert.equal(appendGuestRecords([r], boom), false, 'throwing setItem')
}

console.log('block-records.check ok')
