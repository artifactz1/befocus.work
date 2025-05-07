'use client'

import { Button } from '@repo/ui/button'
import { Slider } from '@repo/ui/slider'
import { Toggle } from '@repo/ui/toggle'
import { useMutation, useQueryClient } from '@tanstack/react-query'
// app/components/SoundSettings.tsx
import { Volume2, VolumeX } from 'lucide-react'
import { api } from '~/lib/api.client'
import { useSoundsStore } from '~/store/useSoundsStore'

const SoundSettings = ({ soundId }: { soundId: string }) => {
  const { sounds, toggleSound, setVolume, isDeleteMode, deleteSound } = useSoundsStore()
  const sound = sounds[soundId]
  const queryClient = useQueryClient()

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const response = await api.user.sounds[':id'].$delete({
        param: { id }
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Failed to delete sound')
      }
    },
    onSuccess: (_, id) => {
      deleteSound(id)
      queryClient.invalidateQueries({ queryKey: ['userSounds'] })
      console.log(`Deleted sound ${id}`)
    },
    onError: err => {
      console.log(`Delete failed: ${err.message}`)
    },
  })


  if (!sound) return null

  const handleDelete = () => {
    // deleteSound(soundId)
    deleteMutation.mutate(soundId)

  }

  return (
    <main>
      {!isDeleteMode ? (
        <div className='flex-row space-y-2'>
          <span className='p-1 font-medium'>{soundId}</span>
          <div className='flex space-x-2'>
            <Toggle
              pressed={sound.playing === true}
              onClick={() => toggleSound(soundId)} // Toggle sound globally
            // className={`${sound.playing ? "text-blue" : "bg-gray-200 text-gray-800"}`}
            >
              {sound.playing ? <Volume2 /> : <VolumeX />}
            </Toggle>

            {/* <Slider
              value={[sound.volume * 100]} // Default to the current volume (range 0-100)
              onValueChange={value => {
                const newVolume = value[0] ?? 80 // Default to 80 if value is undefined
                setVolume(soundId, newVolume / 100) // Set volume globally (range 0-1)
              }}
              max={100}
              step={1}
              className='w-full'
            /> */}
            <Slider
              value={[sound.volume * 100]}
              onValueChange={([raw]) => {
                const newVolume = raw ?? 80
                const normalized = newVolume / 100

                // update the volume in your store
                setVolume(soundId, normalized)

                // if we go above 80 and it isn’t already playing, start it
                if (newVolume > 1 && !sound.playing) {
                  toggleSound(soundId)
                }
                // if we drop to zero and it’s playing, stop it
                else if (newVolume === 0 && sound.playing === true) {
                  toggleSound(soundId)
                }
              }}
              max={100}
              step={1}
              className='w-full'
            />
          </div>
        </div>
      ) : (
        <div className='flex flex-col space-y-2'>
          {/* <label className="p-1">{soundId}</label> */}
          <Button onClick={handleDelete}>Delete {soundId}</Button>
        </div>

        // <div className='flex flex-col space-y-2'>
        //   <Button onClick={handleDelete} disabled={deleteMutation.status === }>
        //     {deleteMutation.status === 'loading' ? 'Deleting…' : `Delete ${soundId}`}
        //   </Button>
        //   {deleteMutation.isError && (
        //     <p className='text-red-500'>{deleteMutation.error.message}</p>
        //   )}
        // </div>
      )}
    </main>
  )
}

export default SoundSettings
