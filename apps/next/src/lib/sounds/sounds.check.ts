// Regression check for #101/#102. Run: bun run src/lib/sounds/sounds.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import type { Sound } from '~/store/useSoundsStore'
import {
  HIDDEN_STARTERS_KEY,
  hideStarter,
  isStarterId,
  labelInk,
  playRecordState,
  readHiddenStarters,
  reconcileSounds,
  STARTER_SOUNDS,
} from './sounds'

const mk = (id: string, over: Partial<Sound> = {}): Sound => ({
  id,
  name: id,
  playing: false,
  volume: 0,
  url: `https://youtu.be/${id}`,
  isCustom: true,
  soundType: 'bgMusic',
  ...over,
})
const alarm = mk('alarm1', { isCustom: false, soundType: 'alarm' })
const jazz = STARTER_SOUNDS.jazz
assert.ok(jazz, 'jazz starter exists')
const none = new Set<string>()
const row = (id: string, over = {}) => ({
  id,
  name: id,
  url: `https://youtu.be/${id}`,
  isCustom: true,
  soundType: 'bgMusic' as const,
  ...over,
})

// starters and ids
assert.equal(isStarterId('jazz'), true)
assert.equal(isStarterId('alarm1'), false)
assert.equal(isStarterId('cuid123'), false)
for (const s of Object.values(STARTER_SOUNDS)) assert.equal(s.isCustom, false)

// H1: a row missing from the server list is dropped (deleted sounds never survive reconcile)
const withRow = { alarm1: alarm, jazz, a1: mk('a1') }
const afterDelete = reconcileSounds(withRow, [], none)
assert.equal(afterDelete.a1, undefined, 'deleted row must be dropped')
assert.ok(afterDelete.alarm1 && afterDelete.jazz, 'alarms and starters survive')

// new server row is added with runtime defaults
const added = reconcileSounds({ alarm1: alarm }, [row('b2', { soundType: 'ambient' })], none)
assert.deepEqual(
  [added.b2?.playing, added.b2?.volume, added.b2?.isCustom, added.b2?.soundType],
  [false, 0, true, 'ambient'],
)

// existing row keeps playing and volume, takes server name and url
const playing = mk('a1', { playing: true, volume: 0.7 })
const merged = reconcileSounds({ a1: playing }, [row('a1', { name: 'New', url: 'u2' })], none)
assert.deepEqual(
  [merged.a1?.playing, merged.a1?.volume, merged.a1?.name, merged.a1?.url],
  [true, 0.7, 'New', 'u2'],
)

// hidden starters are dropped; undefined rows (guest) keep user rows
const hidden = reconcileSounds(withRow, undefined, new Set(['jazz']))
assert.equal(hidden.jazz, undefined, 'hidden starter dropped')
assert.ok(hidden.a1, 'undefined rows leaves user rows alone')

// same reference when nothing changes
const stable = { alarm1: alarm, jazz }
assert.equal(reconcileSounds(stable, [], none), stable)

// localStorage handling
const mem = (init?: string) => {
  let v = init
  return {
    getItem: () => v ?? null,
    setItem: (_: string, x: string) => {
      v = x
    },
  }
}
const st = mem()
hideStarter('jazz', st)
hideStarter('jazz', st)
assert.deepEqual([...readHiddenStarters(st)], ['jazz'], 'no duplicates')
assert.deepEqual([...readHiddenStarters(mem('not json'))], [])
assert.deepEqual([...readHiddenStarters(mem(JSON.stringify(['jazz', 'evil', 5])))], ['jazz'])
assert.ok(HIDDEN_STARTERS_KEY)

// label ink: FNV-1a 32-bit of the trimmed, lowercased name, % 360 ("a" -> 0xe40c292c -> hue 340)
assert.deepEqual(labelInk('a'), {
  ink: 'hsl(340 62% 52%)',
  inkDeep: 'hsl(340 62% 36%)',
  sleeve: 'hsl(340 28% 18%)',
  sleeveDeep: 'hsl(340 28% 11%)',
})
assert.deepEqual(labelInk('  Smooth Jazz '), labelInk('smooth jazz'))
assert.equal(labelInk('smooth jazz').ink, 'hsl(264 62% 52%)')

// one record at a time
const lofi = mk('lofi1', { volume: 0.7 })
const amb = mk('rain', { soundType: 'ambient', playing: true, volume: 0.3 })
const pool = {
  jazz: mk('jazz', { playing: true, volume: 0.5 }),
  lofi1: lofi,
  rain: amb,
  alarm1: alarm,
}
const played = playRecordState(pool, 'lofi1')
assert.ok(played)
assert.equal(played.bgMusicId, 'lofi1')
assert.equal(played.sounds.lofi1?.playing, true)
assert.equal(played.sounds.lofi1?.volume, 0.7, 'existing volume kept')
assert.equal(played.sounds.jazz?.playing, false, 'previous record stops')
assert.equal(played.sounds.rain, amb, 'ambience untouched')
const silent = playRecordState({ ...pool, lofi1: mk('lofi1') }, 'lofi1')
assert.equal(silent?.sounds.lofi1?.volume, 0.4, 'silent record gets a default volume')
assert.equal(playRecordState(pool, 'rain'), null, 'ambience is not a record')
assert.equal(playRecordState(pool, 'nope'), null)

console.log('sounds.check OK')
