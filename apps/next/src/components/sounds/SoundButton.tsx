// 'use client'

// import { Button } from '@repo/ui/button'
// import { Slider } from '@repo/ui/slider'
// import { Toggle } from '@repo/ui/toggle'
// import { useMutation, useQueryClient } from '@tanstack/react-query'
// // app/components/SoundSettings.tsx
// import { Volume2, VolumeX } from 'lucide-react'
// import { api } from '~/lib/api.client'
// import { useSoundsStore } from '~/store/useSoundsStore'

// const SoundSettings = ({ soundId }: { soundId: string }) => {
//   const { sounds, toggleSound, setVolume, isDeleteMode, deleteSound } = useSoundsStore()
//   const sound = sounds[soundId]
//   const queryClient = useQueryClient()

//   const deleteMutation = useMutation<void, Error, string>({
//     mutationFn: async (id: string) => {
//       const response = await api.user.sounds[':id'].$delete({
//         param: { id }
//       })
//       if (!response.ok) {
//         const err = await response.json().catch(() => ({ message: 'Unknown error' }))
//         throw new Error(err.message ?? 'Failed to delete sound')
//       }
//     },
//     onSuccess: (_, id) => {
//       deleteSound(id)
//       queryClient.invalidateQueries({ queryKey: ['userSounds'] })
//       console.log(`Deleted sound ${id}`)
//     },
//     onError: err => {
//       console.log(`Delete failed: ${err.message}`)
//     },
//   })


//   if (!sound) return null

//   const handleDelete = () => {
//     // deleteSound(soundId)
//     deleteMutation.mutate(soundId)

//   }

//   return (
//     <main>
//       {!isDeleteMode ? (
//         <div className='flex-row space-y-2'>
//           <span className='p-1 font-medium text-md'>{soundId}</span>

//           <div className='flex space-x-2'>
//             <Toggle
//               pressed={sound.playing === true}
//               onClick={() => toggleSound(soundId)} // Toggle sound globally
//             // className={`${sound.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
//             >
//               {sound.playing ? <Volume2 /> : <VolumeX />}
//             </Toggle>

//             {/* <Slider
//               value={[sound.volume * 100]} // Default to the current volume (range 0-100)
//               onValueChange={value => {
//                 const newVolume = value[0] ?? 80 // Default to 80 if value is undefined
//                 setVolume(soundId, newVolume / 100) // Set volume globally (range 0-1)
//               }}
//               max={100}
//               step={1}
//               className='w-full'
//             /> */}
//             <Slider
//               value={[sound.volume * 100]}
//               onValueChange={([raw]) => {
//                 const newVolume = raw ?? 80
//                 const normalized = newVolume / 100

//                 // update the volume in your store
//                 setVolume(soundId, normalized)

//                 // if we go above 80 and it isn’t already playing, start it
//                 if (newVolume > 1 && !sound.playing) {
//                   toggleSound(soundId)
//                 }
//                 // if we drop to zero and it’s playing, stop it
//                 else if (newVolume === 0 && sound.playing === true) {
//                   toggleSound(soundId)
//                 }
//               }}
//               max={100}
//               step={1}
//               className='w-full'
//             />
//           </div>
//         </div>
//       ) : (
//         <div className='flex flex-col space-y-2'>
//           {/* <label className="p-1">{soundId}</label> */}
//           <Button onClick={handleDelete}>Delete {soundId}</Button>
//         </div>

//         // <div className='flex flex-col space-y-2'>
//         //   <Button onClick={handleDelete} disabled={deleteMutation.status === }>
//         //     {deleteMutation.status === 'loading' ? 'Deleting…' : `Delete ${soundId}`}
//         //   </Button>
//         //   {deleteMutation.isError && (
//         //     <p className='text-red-500'>{deleteMutation.error.message}</p>
//         //   )}
//         // </div>
//       )}
//     </main>
//   )
// }

// export default SoundSettings

'use client'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Slider } from '@repo/ui/slider'
import { Toggle } from '@repo/ui/toggle'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { api } from '~/lib/api.client'
import { useSoundsStore } from '~/store/useSoundsStore'

const SoundSettings = ({ soundId }: { soundId: string }) => {
  const {
    sounds,
    editModes,
    toggleEditMode,
    editSound,
    toggleSound,
    setVolume,
    isDeleteMode,
    deleteSound
  } = useSoundsStore()

  const sound = sounds[soundId]
  const queryClient = useQueryClient()
  const [originalName, setOriginalName] = useState('')

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await api.user.sounds[':id'].$delete({ param: { id } })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Failed to delete sound')
      }
    },
    onSuccess: (_, id) => {
      deleteSound(id)
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
    },
  })

  const updateSoundMutation = useMutation({
    mutationKey: ['updateSound', soundId],
    mutationFn: async (newName: string) => {
      console.log('NEWNAME', newName);
      const response = await api.user.sounds.$put({
        json: { id: soundId, name: newName },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Failed to update sound')
      }
      return response.json()
    },
    onSuccess: () => {
      console.log("User Sound successfully update")
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
    },
    onError: (err: any) => {
      console.error('Error updating sound:', err)
    },
  })

  if (!sound) return null

  // helper flag
  const isEditing = !!editModes[soundId]



  return (
    <main>
      {!isDeleteMode ? (
        <div className='space-y-2'>
          <motion.button
            // …same animation props…
            className="group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300"
            /* single-click anywhere on the row (when not already editing) opens the Input */
            onClick={e => {
              if (e.detail === 1 && !isEditing) {
                setOriginalName(sound.name)
                toggleEditMode(soundId)
              }
            }}
          >
            {isEditing ? (
              <Input
                type="text"
                value={sound.name}
                autoFocus
                /* prevent clicks inside the Input from bubbling back up */
                onClick={e => e.stopPropagation()}
                onChange={e => editSound(soundId, e.target.value)}
                onBlur={() => {
                  toggleEditMode(soundId)

                  if (
                    sound.name.trim() === '' // ⛔ prevent empty strings
                  ) {
                    editSound(soundId, originalName) // 🔁 revert to original
                    return
                  }

                  if (sound.name !== originalName) {
                    updateSoundMutation.mutate(sound.name)
                  }
                }}

                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    toggleEditMode(soundId)

                    if (
                      sound.name.trim() === ''
                    ) {
                      editSound(soundId, originalName)
                      return
                    }

                    if (sound.name !== originalName) {
                      updateSoundMutation.mutate(sound.name)
                    }
                  }
                }}
                className="bg-transparent h-fit px-0 py-0 rounded-sm"
              // className="bg-transparent h-fit  rounded-sm"
              />
            ) : (
              <span className="relative inline-block">
                {sound.name}
              </span>
            )}
          </motion.button>

          <div className='flex space-x-2'>
            <Toggle
              pressed={sound.playing}
              onClick={() => toggleSound(soundId)}
            >
              {sound.playing ? <Volume2 /> : <VolumeX />}
            </Toggle>

            <Slider
              value={[sound.volume * 100]}
              onValueChange={([raw]) => {
                const newVol = (raw ?? 0) / 100
                setVolume(soundId, newVol)
                if (newVol > 0.01 && !sound.playing) toggleSound(soundId)
                if (newVol === 0 && sound.playing) toggleSound(soundId)
              }}
              max={100}
              step={1}
              className='w-full'
            />
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          <Button onClick={() => deleteMutation.mutate(soundId)}>
            Delete {sound.name}
          </Button>
        </div>
      )}
    </main>
  )
}

export default SoundSettings
