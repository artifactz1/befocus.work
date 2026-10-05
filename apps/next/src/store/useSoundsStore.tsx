import { create } from 'zustand'
import {
  readHiddenStarters,
  reconcileSounds,
  type ServerSound,
  STARTER_SOUNDS,
} from '~/lib/sounds/sounds'

// Define sound types
const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
type SoundType = (typeof soundTypes)[number]

export interface Sound {
  id: string // unique key
  name: string // display name
  playing: boolean
  volume: number
  url: string
  isCustom: boolean
  soundType: SoundType
}

interface Alarm {
  id: string
  name: string
  filePath: string
}

interface SoundsState {
  sounds: Record<string, Sound>
  toggleSound: (id: string) => void
  setVolume: (id: string, volume: number) => void
  addSound: (id: string, name: string, url: string, isCustom: boolean, soundType: SoundType) => void
  deleteSound: (id: string) => void
  syncUserSounds: (rows: ServerSound[] | undefined) => void
  alarmId: string
  setAlarmId: (id: string) => void
  bgMusicId: string
  setBgMusic: (id: string) => void
  roomOpen: boolean
  setRoomOpen: (state: boolean) => void
}

const alarmList: Alarm[] = [
  { id: 'alarm1', name: 'Alarm 1', filePath: '/sounds/public_sounds_alarm1.mp3' },
  { id: 'alarm2', name: 'Alarm 2', filePath: '/sounds/public_sounds_alarm2.mp3' },
  { id: 'alarm3', name: 'Alarm 3', filePath: '/sounds/public_sounds_alarm3.mp3' },
  { id: 'alarm4', name: 'Alarm 4', filePath: '/sounds/public_sounds_alarm4.mp3' },
  { id: 'alarm5', name: 'Alarm 5', filePath: '/sounds/public_sounds_alarm5.mp3' },
]

export const useSoundsStore = create<SoundsState>(set => {
  // Prepopulate with alarms
  const initialSounds = alarmList.reduce<Record<string, Sound>>((acc, alarm) => {
    acc[alarm.id] = {
      id: alarm.id,
      name: alarm.name,
      playing: false,
      volume: 0.5,
      url: alarm.filePath,
      isCustom: false,
      soundType: 'alarm',
    }
    return acc
  }, {})

  return {
    sounds: { ...initialSounds, ...STARTER_SOUNDS },
    roomOpen: false,
    setRoomOpen: state => set({ roomOpen: state }),

    alarmId: 'alarm1',
    setAlarmId: id => set({ alarmId: id }),

    bgMusicId: 'jazz',
    setBgMusic: id => set({ bgMusicId: id }),

    toggleSound: id =>
      set(state => {
        const sound = state.sounds[id]
        if (sound) {
          return {
            sounds: {
              ...state.sounds,
              [id]: { ...sound, playing: !sound.playing },
            },
          }
        }
        return state
      }),

    setVolume: (id, volume) =>
      set(state => {
        const sound = state.sounds[id]
        if (sound) {
          return {
            sounds: {
              ...state.sounds,
              [id]: { ...sound, volume },
            },
          }
        }
        return state
      }),

    addSound: (id, name, url, isCustom, soundType) =>
      set(state => ({
        sounds: {
          ...state.sounds,
          [id]: { id, name, playing: false, volume: 0, url, isCustom, soundType },
        },
      })),

    deleteSound: id =>
      set(state => {
        const { [id]: deleted, ...newSounds } = state.sounds
        return { sounds: newSounds }
      }),

    syncUserSounds: rows =>
      set(state => {
        const sounds = reconcileSounds(state.sounds, rows, readHiddenStarters())
        return sounds === state.sounds ? state : { sounds }
      }),
  }
})
