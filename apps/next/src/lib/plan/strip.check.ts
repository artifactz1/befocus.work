// Runnable self-check for stripWidths. Run with: bun run src/lib/plan/strip.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { type StripBlock, stripWidths } from './strip'

const desktop = { gap: 4, minFocus: 32, minBreak: 8 }
const phone = { gap: 2, minFocus: 16, minBreak: 4 }
function f(minutes: number): StripBlock {
  return { kind: 'focus', minutes }
}
function b(minutes: number): StripBlock {
  return { kind: 'break', minutes }
}

{
  const r = stripWidths([f(25), b(5), f(25)], 920, desktop)
  assert.equal(r.overflow, false)
  assert.ok(
    Math.abs(r.widths.reduce((s, w) => s + w, 0) - (920 - 8)) < 1e-9,
    'sums to width - gaps',
  )
  assert.ok(Math.abs((r.widths[0] as number) / (r.widths[1] as number) - 5) < 1e-9, 'proportional')
}
{
  const blocks = Array.from({ length: 31 }, (_, i) => (i % 2 ? b(5) : f(25)))
  const r = stripWidths(blocks, 310, phone)
  assert.equal(r.overflow, true)
  blocks.forEach((x, i) => {
    assert.ok((r.widths[i] as number) >= (x.kind === 'focus' ? 16 : 4), `block ${i} min`)
  })
}
{
  const plain = stripWidths([f(25), b(5), f(25)], 920, desktop).widths
  const added = stripWidths([f(30), b(5), f(25)], 920, desktop).widths
  assert.ok(
    (added[0] as number) / (added[2] as number) > (plain[0] as number) / (plain[2] as number),
  )
}
console.log('strip.check OK')
