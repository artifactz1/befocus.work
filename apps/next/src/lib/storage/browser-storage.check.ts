// Runnable self-check for the browser-storage helper (no test runner exists in this repo).
// Run with: bun run src/lib/storage/browser-storage.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { z } from 'zod'
import { readStored, writeStored } from './browser-storage'

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
const schema = z.object({ a: z.number() })

{
  const st = fake()
  assert.equal(writeStored('k', { a: 1 }, st), true)
  assert.deepEqual(readStored('k', schema, st), { a: 1 }, 'round trip')
}
assert.equal(readStored('missing', schema, fake()), null, 'missing key')
assert.equal(readStored('k', schema, fake({ k: '{' })), null, 'bad JSON')
assert.equal(readStored('k', schema, fake({ k: '{"a":"x"}' })), null, 'schema miss')
assert.equal(readStored('k', schema, undefined), null, 'no storage read')
assert.equal(writeStored('k', 1, undefined), false, 'no storage write')
assert.equal(readStored('k', schema, boom), null, 'throwing getItem')
assert.equal(writeStored('k', 1, boom), false, 'throwing setItem')
// storage whose access throws: the module must not touch it at import time
assert.equal(readStored('k', schema), null, 'no localStorage in bun')

console.log('browser-storage.check ok')
