import type { Sound } from '~/store/useSoundsStore'

export interface ServerSound {
  id: string
  name: string
  url: string
  isCustom: boolean
  soundType: Sound['soundType']
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
    next[r.id] =
      prev && prev.name === r.name && prev.url === r.url
        ? prev
        : { ...(prev ?? { playing: false, volume: 0 }), ...r, isCustom: true }
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
