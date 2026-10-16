import { youTubeVideoId } from '@repo/api/lib/youtube'
import type { Sound } from '~/store/useSoundsStore'

export type LabelImage = 'thumbnail' | 'upload'
export type DiscFinish = 'black' | 'smoke' | 'tinted'

export interface ServerSound {
  id: string
  name: string
  url: string
  isCustom: boolean
  soundType: Sound['soundType']
  labelColor?: string | null
  labelImage?: LabelImage | null
  discFinish?: DiscFinish
}

const starter = (id: string, name: string, url: string, soundType: Sound['soundType']): Sound => ({
  id,
  name,
  url,
  soundType,
  playing: false,
  volume: 0,
  isCustom: false,
})

// Built-in sounds. Not DB rows, so removing one is remembered per browser (HIDDEN_STARTERS_KEY).
export const STARTER_SOUNDS: Record<string, Sound> = Object.fromEntries(
  [
    starter('rain', 'Rain Ambience', 'https://www.youtube.com/watch?v=yIQd2Ya0Ziw', 'ambient'),
    starter('jazz', 'Smooth Jazz', 'https://www.youtube.com/watch?v=VwR3LBbL6Jk', 'bgMusic'),
    starter(
      'lofi1',
      'Lofi Hip Hop',
      'https://www.youtube.com/watch?v=617L_MOB37k&ab_channel=thebootlegboy2',
      'bgMusic',
    ),
    starter('library', 'Library Murmurs', 'https://www.youtube.com/watch?v=4vIQON2fDWM', 'ambient'),
    starter(
      'fireplace',
      'Crackling Fireplace',
      'https://www.youtube.com/watch?v=UgHKb_7884o',
      'ambient',
    ),
  ].map(s => [s.id, s]),
)

export const isStarterId = (id: string) => Object.hasOwn(STARTER_SOUNDS, id)

// Server rows are the source of truth for user sounds: rows missing from `rows` are dropped (so a
// deleted sound can never come back), new rows are added, existing rows keep playing and volume.
// `rows` undefined (guest or not loaded yet) leaves user sounds untouched.
export function reconcileSounds(
  current: Record<string, Sound>,
  rows: ServerSound[] | undefined,
  hidden: ReadonlySet<string>,
): Record<string, Sound> {
  const next: Record<string, Sound> = {}
  for (const s of Object.values(current)) {
    const keep = s.soundType === 'alarm' || (isStarterId(s.id) ? !hidden.has(s.id) : !rows)
    if (keep) next[s.id] = s
  }
  for (const r of rows ?? []) {
    const prev = current[r.id]
    const same =
      prev &&
      prev.name === r.name &&
      prev.url === r.url &&
      prev.labelColor === r.labelColor &&
      prev.labelImage === r.labelImage &&
      prev.discFinish === r.discFinish
    next[r.id] = same ? prev : { ...(prev ?? { playing: false, volume: 0 }), ...r, isCustom: true }
  }
  const a = Object.keys(next)
  const b = Object.keys(current)
  const same = a.length === b.length && a.every(k => next[k] === current[k])
  return same ? current : next
}

export const HIDDEN_STARTERS_KEY = 'befocus.hiddenStarters'

type Store = Pick<Storage, 'getItem' | 'setItem'>
const defaultStorage = (): Store | undefined => globalThis.localStorage

export function readHiddenStarters(
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
) {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(HIDDEN_STARTERS_KEY) ?? '[]')
    return new Set(
      Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string' && isStarterId(x)) : [],
    )
  } catch {
    return new Set<string>()
  }
}

export function hideStarter(id: string, storage: Store | undefined = defaultStorage()) {
  try {
    storage?.setItem(HIDDEN_STARTERS_KEY, JSON.stringify([...readHiddenStarters(storage), id]))
  } catch {}
}

// Board swatches for a record label. null is Auto.
export const LABEL_SWATCHES = [
  '#fda4af',
  '#fdba74',
  '#fde047',
  '#86efac',
  '#93c5fd',
  '#c4b5fd',
  '#f5f5f4',
] as const

const AUTO_MIX = [92, 55, 35, 70, 22]

// Auto label: the accent mixed toward graphite by an amount picked from the name (FNV-1a), so
// every label sits in the accent's family instead of a saturated hashed hue.
export function autoLabel(name: string) {
  let hash = 2166136261
  for (const ch of name.trim().toLowerCase()) {
    for (let i = 0; i < ch.length; i++) {
      hash = Math.imul(hash ^ ch.charCodeAt(i), 16777619)
    }
  }
  return `color-mix(in srgb, var(--user-accent) ${AUTO_MIX[(hash >>> 0) % AUTO_MIX.length]}%, #2a2a2a)`
}

export const labelFill = (s: Pick<Sound, 'name' | 'labelColor'>) =>
  s.labelColor ?? autoLabel(s.name)

export function discBase(finish: DiscFinish | undefined, label: string) {
  if (finish === 'smoke') return 'rgb(68 68 74 / 0.72)'
  if (finish === 'tinted') return `color-mix(in srgb, ${label} 34%, #0b0b0b)`
  return '#0b0b0b'
}

export function thumbnailUrl(url: string) {
  const id = youTubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null
}

const DEFAULT_RECORD_VOLUME = 0.4

// The one-record rule: playing a record stops every other record. Ambience is untouched.
export function playRecordState(sounds: Record<string, Sound>, id: string) {
  const target = sounds[id]
  if (target?.soundType !== 'bgMusic') return null
  const next: Record<string, Sound> = {}
  for (const [key, s] of Object.entries(sounds)) {
    next[key] = s.soundType === 'bgMusic' && key !== id && s.playing ? { ...s, playing: false } : s
  }
  next[id] = {
    ...target,
    playing: true,
    volume: target.volume === 0 ? DEFAULT_RECORD_VOLUME : target.volume,
  }
  return { sounds: next, bgMusicId: id }
}

const clamp01 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100

// Next knob value for a key press, or null if the key is not a knob key.
export function knobKeyValue(value: number, key: string, last: number): number | null {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return clamp01(value + 0.05)
    case 'ArrowDown':
    case 'ArrowLeft':
      return clamp01(value - 0.05)
    case 'PageUp':
      return clamp01(value + 0.1)
    case 'PageDown':
      return clamp01(value - 0.1)
    case 'Home':
      return 0
    case 'End':
      return 1
    case 'Enter':
    case ' ':
      return value > 0 ? 0 : last > 0 ? last : DEFAULT_RECORD_VOLUME
    default:
      return null
  }
}
