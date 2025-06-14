import type ReactPlayer from 'react-player'
import { create } from 'zustand'

// Define sound types
const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
type SoundType = (typeof soundTypes)[number]

export interface Sound {
  id: string         // unique key
  name: string       // display name
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
  isDeleteMode: boolean
  isAddMode: boolean
  sounds: Record<string, Sound>
  toggleSound: (id: string) => void
  toggleDeleteMode: () => void
  toggleAddMode: () => void
  setVolume: (id: string, volume: number) => void
  addSound: (id: string, name: string, url: string, isCustom: boolean, soundType: SoundType) => void
  deleteSound: (id: string) => void
  alarmId: string
  setAlarmId: (id: string) => void
  ambientId: string
  setAmbientId: (id: string) => void
  bgMusicId: string
  setBgMusic: (id: string) => void
  isSoundSettingsOpen: boolean
  setSoundSettingsOpen: (state: boolean) => void
  editModes: Record<string, boolean>
  toggleEditMode: (id: string) => void
  editSound: (id: string, newName: string) => void
  currentTimes: Record<string, number>
  setCurrentTime: (id: string, time: number) => void
  durations: Record<string, number>
  setDuration: (id: string, duration: number) => void
  playerRefs: Record<string, ReactPlayer | null>
  setPlayerRef: (id: string, ref: ReactPlayer | null) => void
  seekTo: (id: string, time: number) => void
  seekingStates: Record<string, boolean>
  setSeeking: (id: string, state: boolean) => void
  // Remove lastSeekTimes as it's causing issues
}

const alarmList: Alarm[] = [
  { id: 'alarm1', name: 'Alarm 1', filePath: '/sounds/public_sounds_alarm1.mp3' },
  { id: 'alarm2', name: 'Alarm 2', filePath: '/sounds/public_sounds_alarm2.mp3' },
  { id: 'alarm3', name: 'Alarm 3', filePath: '/sounds/public_sounds_alarm3.mp3' },
  { id: 'alarm4', name: 'Alarm 4', filePath: '/sounds/public_sounds_alarm4.mp3' },
  { id: 'alarm5', name: 'Alarm 5', filePath: '/sounds/public_sounds_alarm5.mp3' },
]

export const useSoundsStore = create<SoundsState>((set, get) => {
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
    sounds: { ...initialSounds },
    isDeleteMode: false,
    isAddMode: false,
    isSoundSettingsOpen: false,
    setSoundSettingsOpen: state => set({ isSoundSettingsOpen: state }),

    alarmId: 'alarm1',
    setAlarmId: id => set({ alarmId: id }),

    ambientId: 'rain',
    setAmbientId: id => set({ ambientId: id }),

    bgMusicId: 'jazz',
    setBgMusic: id => set({ bgMusicId: id }),

    toggleSound: id =>
      set(state => {
        const sound = state.sounds[id]
        if (sound) {
          return {
            sounds: {
              ...state.sounds,
              [id]: { ...sound, playing: !sound.playing }
            }
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
              [id]: { ...sound, volume }
            }
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

    toggleDeleteMode: () =>
      set(state => ({ isDeleteMode: !state.isDeleteMode })),

    toggleAddMode: () =>
      set(state => ({ isAddMode: !state.isAddMode })),

    editModes: {},
    toggleEditMode: id =>
      set(state => ({
        editModes: { ...state.editModes, [id]: !state.editModes[id] },
      })),

    editSound: (id, newName) =>
      set(state => {
        const sound = state.sounds[id];
        if (!sound) return state;

        return {
          sounds: {
            ...state.sounds,
            [id]: {
              ...sound,
              name: newName,
            },
          },
        };
      }),

    currentTimes: {},
    setCurrentTime: (id, time) =>
      set(state => ({
        currentTimes: {
          ...state.currentTimes,
          [id]: time,
        },
      })),

    durations: {},
    setDuration: (id, duration) =>
      set(state => ({
        durations: {
          ...state.durations,
          [id]: duration,
        },
      })),

    playerRefs: {},
    setPlayerRef: (id, ref) =>
      set(state => ({
        playerRefs: {
          ...state.playerRefs,
          [id]: ref,
        },
      })),

    seekTo: (id: string, time: number) => {
      const state = get()
      const player = state.playerRefs[id]
      if (player) {
        player.seekTo(time, 'seconds')
        set(prevState => ({
          currentTimes: {
            ...prevState.currentTimes,
            [id]: time
          }
        }))
      }
    },

    seekingStates: {},
    setSeeking: (id, state) =>
      set((prevState) => ({
        seekingStates: {
          ...prevState.seekingStates,
          [id]: state,
        },
      })),
  }
})

// Now add your custom sounds with both id and name
const custom = useSoundsStore.getState().addSound
custom('rain', 'Rain Ambience', 'https://www.youtube.com/watch?v=yIQd2Ya0Ziw', true, 'ambient')
custom('jazz', 'Smooth Jazz', 'https://www.youtube.com/watch?v=VwR3LBbL6Jk', true, 'bgMusic')
custom('lofi1', 'Lofi Hip Hop', 'https://www.youtube.com/watch?v=617L_MOB37k&ab_channel=thebootlegboy2', true, 'bgMusic')
custom('library', 'Library Murmurs', 'https://www.youtube.com/watch?v=4vIQON2fDWM', true, 'ambient')
custom('fireplace', 'Crackling Fireplace', 'https://www.youtube.com/watch?v=UgHKb_7884o', true, 'ambient')