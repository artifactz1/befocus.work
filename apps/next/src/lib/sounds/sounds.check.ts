// Regression check for #101/#102. Run: bun run src/lib/sounds/sounds.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { isYouTubeUrl, youTubeVideoId } from '@repo/api/lib/youtube'
import type { Sound } from '~/store/useSoundsStore'
import {
  autoLabel,
  discBase,
  HIDDEN_STARTERS_KEY,
  hideStarter,
  isStarterId,
  knobKeyValue,
  labelFill,
  playRecordState,
  readHiddenStarters,
  reconcileSounds,
  STARTER_SOUNDS,
  thumbnailUrl,
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

// vinyl look: a changed label or finish on the server replaces the local sound, keeping playback
const looked = reconcileSounds(
  { a1: playing },
  [row('a1', { labelColor: '#86efac', labelImage: 'thumbnail', discFinish: 'smoke' })],
  none,
)
assert.deepEqual(
  [looked.a1?.labelColor, looked.a1?.labelImage, looked.a1?.discFinish, looked.a1?.playing],
  ['#86efac', 'thumbnail', 'smoke', true],
)
const lookedAgain = { a1: looked.a1 as Sound }
assert.equal(
  reconcileSounds(
    lookedAgain,
    [row('a1', { labelColor: '#86efac', labelImage: 'thumbnail', discFinish: 'smoke' })],
    none,
  ),
  lookedAgain,
  'same look keeps the reference',
)

// Auto label: accent mixed toward graphite by an FNV-1a pick ("a" -> 0xe40c292c % 5 = 0 -> 92%)
assert.equal(autoLabel('a'), 'color-mix(in srgb, var(--user-accent) 92%, #2a2a2a)')
assert.equal(autoLabel('  Smooth Jazz '), autoLabel('smooth jazz'))
assert.equal(labelFill({ name: 'a', labelColor: '#fde047' }), '#fde047')
assert.equal(labelFill({ name: 'a', labelColor: null }), autoLabel('a'))
assert.equal(discBase(undefined, '#fff'), '#0b0b0b')
assert.equal(discBase('black', '#fff'), '#0b0b0b')
assert.equal(discBase('tinted', '#fde047'), 'color-mix(in srgb, #fde047 34%, #0b0b0b)')
assert.match(discBase('smoke', '#fff'), /^rgb\(/)

assert.equal(
  thumbnailUrl('https://www.youtube.com/watch?v=jfKfPfyJRdk&t=3'),
  'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
)
assert.equal(thumbnailUrl('https://evil.com/watch?v=x'), null)
for (const [url, id] of [
  ['https://youtu.be/jfKfPfyJRdk?si=1', 'jfKfPfyJRdk'],
  ['https://www.youtube.com/shorts/abc/', 'abc'],
  ['https://www.youtube.com/embed/xyz', 'xyz'],
  ['https://www.youtube.com/live/q1?feature=share', 'q1'],
  ['https://www.youtube.com/watch?v=', null],
] as const) {
  assert.equal(youTubeVideoId(url), id, url)
}

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

assert.equal(knobKeyValue(0.4, 'ArrowUp', 0.4), 0.45)
assert.equal(knobKeyValue(0.4, 'ArrowRight', 0.4), 0.45)
assert.equal(knobKeyValue(0.4, 'ArrowDown', 0.4), 0.35)
assert.equal(knobKeyValue(0.4, 'ArrowLeft', 0.4), 0.35)
assert.equal(knobKeyValue(0.4, 'PageUp', 0.4), 0.5)
assert.equal(knobKeyValue(0.4, 'PageDown', 0.4), 0.3)
assert.equal(knobKeyValue(0.98, 'ArrowUp', 0.4), 1, 'clamps high')
assert.equal(knobKeyValue(0.02, 'PageDown', 0.4), 0, 'clamps low')
assert.equal(knobKeyValue(0.1, 'ArrowUp', 0.4), 0.15, 'rounds to 2 decimals')
assert.equal(knobKeyValue(0.4, 'Home', 0.4), 0)
assert.equal(knobKeyValue(0.4, 'End', 0.4), 1)
assert.equal(knobKeyValue(0.6, 'Enter', 0.6), 0)
assert.equal(knobKeyValue(0, ' ', 0.6), 0.6)
assert.equal(knobKeyValue(0, 'Enter', 0), 0.4)
assert.equal(knobKeyValue(0.4, 'x', 0.4), null)

for (const ok of [
  'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  'https://youtube.com/watch?v=x',
  'https://m.youtube.com/watch?v=x',
  'https://music.youtube.com/watch?v=x',
  'https://youtu.be/jfKfPfyJRdk',
  'http://youtu.be/x',
  'https://www.youtube.com/live/x',
  'https://www.youtube.com/shorts/x',
]) {
  assert.equal(isYouTubeUrl(ok), true, ok)
}
for (const bad of [
  'https://evil.com/youtube.com/watch',
  'https://youtube.com.evil.com/watch?v=x',
  'https://notyoutube.com/x',
  'javascript:alert(1)',
  'ftp://youtu.be/x',
  'https://youtu.be/',
  'www.youtube.com/watch?v=x',
  '',
  `https://www.youtube.com/watch?v=${'a'.repeat(2049)}`,
]) {
  assert.equal(isYouTubeUrl(bad), false, bad)
}

console.log('sounds.check OK')
