// Run: cd packages/api && bun run src/lib/label-image.check.ts
import { insertSoundSchema, updateSoundSchema } from '../db/tables/sounds'
import { labelKey, sniffLabelImage } from './label-image'

const eq = (a: unknown, b: unknown, what: string) => {
  if (a !== b) throw new Error(`${what}: expected ${String(b)}, got ${String(a)}`)
}
const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])

eq(sniffLabelImage(bytes(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg', 'jpeg')
eq(sniffLabelImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'image/png', 'png')
eq(
  sniffLabelImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)),
  'image/webp',
  'webp',
)
eq(sniffLabelImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45)), null, 'wav')
eq(
  sniffLabelImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')),
  null,
  'svg',
)
eq(sniffLabelImage(new Uint8Array()), null, 'empty')
eq(labelKey('u1', 's1'), 'labels/u1/s1', 'key')

// Only PUT /user/sounds/:id/label may set an uploaded label; the JSON routes must refuse it.
const sound = {
  id: 's1',
  name: 'Rain',
  url: 'https://www.youtube.com/watch?v=abc',
  soundType: 'ambient',
  isCustom: true,
}
const ok = (data: object) => insertSoundSchema.safeParse({ ...sound, ...data }).success
eq(ok({ labelImage: 'thumbnail', labelColor: '#a1B2c3', discFinish: 'smoke' }), true, 'valid label')
eq(ok({ labelImage: 'upload' }), false, 'insert upload')
eq(updateSoundSchema.safeParse({ id: 's1', labelImage: 'upload' }).success, false, 'update upload')
eq(ok({ labelColor: 'red' }), false, 'colour name')
eq(ok({ discFinish: 'gold' }), false, 'finish')
console.log('label-image checks passed')
