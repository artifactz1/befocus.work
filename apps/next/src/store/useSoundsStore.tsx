// import { create } from 'zustand'

// // Define sound types
// const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
// type SoundType = (typeof soundTypes)[number]

// interface Sound {
//   playing: boolean
//   volume: number
//   url: string // URL for the sound
//   isCustom: boolean
//   soundType: SoundType // New field for sound type
// }

// interface Alarm {
//   name: string
//   filePath: string // File path for alarm sound
// }

// interface SoundsState {
//   isDeleteMode: boolean
//   isAddMode: boolean
//   sounds: Record<string, Sound> // Use Record instead of index signature
//   toggleSound: (id: string) => void
//   toggleDeleteMode: () => void
//   toggleAddMode: () => void
//   setVolume: (id: string, volume: number) => void
//   addSound: (id: string, url: string, isCustom: boolean, soundType: SoundType) => void // Updated
//   deleteSound: (id: string) => void
//   alarmId: string
//   setAlarmId: (id: string) => void
//   ambientId: string
//   setAmbientId: (id: string) => void
//   bgMusicId: string
//   setBgMusic: (id: string) => void
//   isSoundSettingsOpen: boolean
//   setSoundSettingsOpen: (state: boolean) => void
//   editModes: Record<string, boolean>
//   toggleEditMode: (id: string) => void
//   editSound: (id: string, newName: string) => void

// }

// const alarmList: Alarm[] = [
//   { name: 'alarm1', filePath: '/sounds/public_sounds_alarm1.mp3' },
//   { name: 'alarm2', filePath: '/sounds/public_sounds_alarm2.mp3' },
//   { name: 'alarm3', filePath: '/sounds/public_sounds_alarm3.mp3' },
//   { name: 'alarm4', filePath: '/sounds/public_sounds_alarm4.mp3' },
//   { name: 'alarm5', filePath: '/sounds/public_sounds_alarm5.mp3' },
// ]

// export const useSoundsStore = create<SoundsState>(set => {
//   // Prepopulate sounds with alarms
//   const initialSounds = alarmList.reduce<Record<string, Sound>>((acc, alarm) => {
//     acc[alarm.name] = {
//       playing: false,
//       volume: 0.5,
//       url: alarm.filePath,
//       isCustom: false,
//       soundType: 'alarm', // Set sound type for alarms
//     }
//     return acc
//   }, {})

//   return {
//     sounds: {
//       ...initialSounds,
//     },
//     isDeleteMode: false, // Initialize delete mode state
//     isAddMode: false, // Initialize add mode state
//     isSoundSettingsOpen: false,
//     setSoundSettingsOpen: state => set({ isSoundSettingsOpen: state }),
//     alarmId: 'alarm1',
//     setAlarmId: id => set({ alarmId: id }),
//     ambientId: 'rain',
//     setAmbientId: id => set({ ambientId: id }),
//     bgMusicId: 'jazz',
//     setBgMusic: id => set({ bgMusicId: id }),
//     toggleSound: id =>
//       set(state => {
//         const sound = state.sounds[id]
//         if (sound) {
//           sound.playing = !sound.playing
//         }
//         return { sounds: { ...state.sounds } }
//       }),
//     setVolume: (id, volume) =>
//       set(state => {
//         const sound = state.sounds[id]
//         if (sound) {
//           sound.volume = volume
//         }
//         return { sounds: { ...state.sounds } }
//       }),
//     addSound: (id, url, isCustom, soundType: SoundType) =>
//       set(state => ({
//         sounds: {
//           ...state.sounds,
//           [id]: { playing: false, volume: 0, url, isCustom: isCustom, soundType },
//         },
//       })),
//     deleteSound: id =>
//       set(state => {
//         const newSounds = { ...state.sounds }
//         delete newSounds[id]
//         return { sounds: newSounds }
//       }),
//     toggleDeleteMode: () =>
//       set(state => ({
//         ...state,
//         isDeleteMode: !state.isDeleteMode,
//       })),
//     toggleAddMode: () =>
//       set(state => ({
//         ...state,
//         isAddMode: !state.isAddMode,
//       })),
//     editModes: {},
//     toggleEditMode: (id) =>
//       set((state) => ({
//         editModes: {
//           ...state.editModes,
//           [id]: !state.editModes[id],
//         },
//       })),
//     editSound: (id, newName) =>
//       set((state) => ({
//         sounds: {
//           ...state.sounds,
//           [id]: {
//             ...state.sounds[id],
//             // we’ll need to have given Sound a “name” field too if you want to rename
//             name: newName,
//           } as Sound,
//         },
//       })),
//   }
// })

// // Add "rain" and "jazz" sounds after initialization
// useSoundsStore.getState().addSound(
//   'rain',
//   'https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm',
//   true,
//   'ambient', // Specify the sound type
// )
// useSoundsStore.getState().addSound(
//   'jazz',
//   'https://www.youtube.com/watch?v=VwR3LBbL6Jk&ab_channel=SolaceCrossing',
//   true,
//   'bgMusic', // Specify the sound type
// )

// useSoundsStore.getState().addSound(
//   'howls moving castle',
//   'https://www.youtube.com/watch?v=VwR3LBbL6Jk&ab_channel=SolaceCrossing',
//   true,
//   'bgMusic', // Specify the sound type
// )

// useSoundsStore.getState().addSound(
//   'howls moving castle',
//   'https://www.youtube.com/watch?v=z3aS5AwhJSU&ab_channel=YES24',
//   true,
//   'bgMusic', // Specify the sound type
// )

// useSoundsStore.getState().addSound(
//   'howls moving castle',
//   'https://www.youtube.com/watch?v=3UV6vbUlNTY&ab_channel=MelodyBox',
//   true,
//   'bgMusic', // Specify the sound type
// )

// useSoundsStore.getState().addSound(
//   'libary',
//   'https://www.youtube.com/watch?v=4vIQON2fDWM&ab_channel=TheGuildofAmbience',
//   true,
//   'ambient', // Specify the sound type
// )

// useSoundsStore.getState().addSound(
//   'fireplace',
//   'https://www.youtube.com/watch?v=UgHKb_7884o&ab_channel=CatTrumpet',
//   true,
//   'ambient', // Specify the sound type
// )

import { create } from 'zustand'

// Define sound types
const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
type SoundType = (typeof soundTypes)[number]

interface Sound {
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
        if (sound) sound.playing = !sound.playing
        return { sounds: { ...state.sounds } }
      }),

    setVolume: (id, volume) =>
      set(state => {
        const sound = state.sounds[id]
        if (sound) sound.volume = volume
        return { sounds: { ...state.sounds } }
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
        const newSounds = { ...state.sounds }
        delete newSounds[id]
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
        if (!sound) return {}; // or throw an error, depending on your design

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
  }
})

// Now add your custom sounds with both id and name
const custom = useSoundsStore.getState().addSound
custom('rain', 'Rain Ambience', 'https://www.youtube.com/watch?v=yIQd2Ya0Ziw', true, 'ambient')
custom('jazz', 'Smooth Jazz', 'https://www.youtube.com/watch?v=VwR3LBbL6Jk', true, 'bgMusic')
custom('howls-move', 'Howl’s Moving Castle Theme', 'https://www.youtube.com/watch?v=z3aS5AwhJSU', true, 'bgMusic')
custom('library', 'Library Murmurs', 'https://www.youtube.com/watch?v=4vIQON2fDWM', true, 'ambient')
custom('fireplace', 'Crackling Fireplace', 'https://www.youtube.com/watch?v=UgHKb_7884o', true, 'ambient')
