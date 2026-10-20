// Runnable self-check for guest look storage, the saver queue and the paint script.
// Run with: bun run src/lib/customize/persistence.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { DEFAULT_LOOK, type Look } from '@repo/types/look'
import { lookToTokens } from './catalog'
import {
  GUEST_ACTIVE_KEY,
  GUEST_PAINT_KEY,
  GUEST_THEMES_KEY,
  readGuestLook,
  writeGuestLook,
} from './guest-look'
import { buildPaintScript } from './look-paint'
import { createLookSaver } from './look-saver'

const fake = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init))
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v)
    },
  }
}
const withAccent = (accent: string): Look => ({ ...DEFAULT_LOOK, accent })
const A = withAccent('#fca5a5')
const B = withAccent('#86efac')
const C = withAccent('#93c5fd')

// (a) guest round trip, stable id
{
  const st = fake()
  assert.equal(writeGuestLook(A, st), true)
  const id1 = st.m.get(GUEST_ACTIVE_KEY)
  assert.deepEqual(readGuestLook(st), A)
  assert.equal(writeGuestLook(B, st), true)
  assert.equal(st.m.get(GUEST_ACTIVE_KEY), id1, 'id stable across writes')
  assert.deepEqual(readGuestLook(st), B)
  assert.deepEqual(JSON.parse(st.m.get(GUEST_PAINT_KEY) ?? 'null'), lookToTokens(B))
}

// (b) corrupt or stale records read as null
{
  const id = crypto.randomUUID()
  assert.equal(readGuestLook(fake()), null, 'no keys')
  const themes = JSON.stringify([{ id, name: 'x', look: A }])
  assert.equal(
    readGuestLook(
      fake({ [GUEST_THEMES_KEY]: themes, [GUEST_ACTIVE_KEY]: JSON.stringify(crypto.randomUUID()) }),
    ),
    null,
    'active id with no match',
  )
  const extra = JSON.stringify([{ id, name: 'x', look: { ...A, extra: 1 } }])
  assert.equal(
    readGuestLook(fake({ [GUEST_THEMES_KEY]: extra, [GUEST_ACTIVE_KEY]: JSON.stringify(id) })),
    null,
    'schema failure',
  )
  assert.equal(
    readGuestLook(fake({ [GUEST_THEMES_KEY]: '{', [GUEST_ACTIVE_KEY]: JSON.stringify(id) })),
    null,
    'bad JSON',
  )
}

// (c) throwing setItem
assert.equal(
  writeGuestLook(A, {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota')
    },
  }),
  false,
)

// saver helpers: manually resolved sends
const controlled = () => {
  const sent: Look[] = []
  const saved: Look[] = []
  const errors: unknown[] = []
  const gates: { resolve: () => void; reject: (e: unknown) => void }[] = []
  let concurrent = 0
  let maxConcurrent = 0
  const saver = createLookSaver({
    send: look => {
      sent.push(look)
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      return new Promise<void>((resolve, reject) => {
        gates.push({
          resolve: () => {
            concurrent--
            resolve()
          },
          reject: e => {
            concurrent--
            reject(e)
          },
        })
      })
    },
    onSaved: l => saved.push(l),
    onError: e => errors.push(e),
  })
  return { saver, sent, saved, errors, gates, max: () => maxConcurrent }
}
const tick = () => new Promise(r => setTimeout(r, 0))

// (d) A in flight, B and C queued: sends [A, C], never parallel
{
  const t = controlled()
  t.saver.save(A)
  t.saver.save(B)
  t.saver.save(C)
  assert.deepEqual(t.sent, [A])
  t.gates[0]?.resolve()
  await tick()
  assert.deepEqual(t.sent, [A, C])
  t.gates[1]?.resolve()
  await tick()
  assert.deepEqual(t.saved, [A, C])
  assert.equal(t.max(), 1)
}

// (e) failure reports once, next save retries
{
  const t = controlled()
  t.saver.save(A)
  t.gates[0]?.reject(new Error('net'))
  await tick()
  assert.equal(t.errors.length, 1)
  t.saver.save(A)
  assert.deepEqual(t.sent, [A, A])
  t.gates[1]?.resolve()
  await tick()
  assert.deepEqual(t.saved, [A])
}

// (f) back to the start while the first is in flight: the last send is A again
{
  const t = controlled()
  t.saver.save(A)
  t.saver.save(B)
  t.saver.save(A)
  t.gates[0]?.resolve()
  await tick()
  assert.deepEqual(t.sent, [A, A])
  t.gates[1]?.resolve()
  await tick()
}

// (g) paint script against fake document and localStorage
const run = (script: string, stored: unknown, throws = false) => {
  const props = new Map<string, string>()
  const attrs = new Map<string, string>()
  const document = {
    documentElement: {
      style: { setProperty: (k: string, v: string) => void props.set(k, v) },
      setAttribute: (k: string, v: string) => void attrs.set(k, v),
    },
  }
  const localStorage = {
    getItem: () => {
      if (throws) throw new Error('blocked')
      return stored === undefined ? null : JSON.stringify(stored)
    },
  }
  new Function('document', 'localStorage', script)(document, localStorage)
  return { props, attrs }
}
{
  const tokens = lookToTokens(A)
  const r = run(buildPaintScript(tokens), undefined)
  assert.deepEqual(Object.fromEntries(r.props), tokens.props)
  assert.equal(r.attrs.get('data-progress'), 'edge')
  assert.equal(r.attrs.get('data-density'), 'comfortable')

  const cached = run(buildPaintScript(null), tokens)
  assert.deepEqual(Object.fromEntries(cached.props), tokens.props, 'cache applied')

  const evil = run(buildPaintScript(null), {
    props: {
      '--evil': 'red',
      '--user-accent': 'url(http://x)',
      '--bg-solid': 'red;background:blue',
      '--text-contrast': '0.8',
    },
    attrs: { 'data-progress': 'evil', 'data-density': 'roomy' },
  })
  assert.deepEqual(Object.fromEntries(evil.props), { '--text-contrast': '0.8' })
  assert.equal(evil.attrs.has('data-progress'), false)
  assert.equal(evil.attrs.get('data-density'), 'roomy')

  const breakout = {
    props: { ...tokens.props, '--user-accent': '</script><script>alert(1)</script>' },
    attrs: tokens.attrs,
  }
  assert.equal(buildPaintScript(breakout).includes('</script'), false, 'no script breakout')

  const blocked = run(buildPaintScript(null), tokens, true)
  assert.equal(blocked.props.size + blocked.attrs.size, 0, 'throwing storage paints nothing')
}

console.log('persistence.check ok')
