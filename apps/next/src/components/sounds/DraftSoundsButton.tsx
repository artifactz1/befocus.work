'use client'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Slider } from '@repo/ui/slider'
import { Toggle } from '@repo/ui/toggle'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useDeleteUserSound, useUpdateUserSound } from '~/hooks/useSounds'
import { useSoundsStore } from '~/store/useSoundsStore'

const AmbientSoundsButton = ({ soundId }: { soundId: string }) => {
  // Split the store selectors to avoid unnecessary re-renders
  const sound = useSoundsStore(state => state.sounds[soundId])
  const editModes = useSoundsStore(state => state.editModes)
  const isDeleteMode = useSoundsStore(state => state.isDeleteMode)

  // Actions
  const toggleEditMode = useSoundsStore(state => state.toggleEditMode)
  const editSound = useSoundsStore(state => state.editSound)
  const toggleSound = useSoundsStore(state => state.toggleSound)
  const setVolume = useSoundsStore(state => state.setVolume)

  const [originalName, setOriginalName] = useState('')

  const deleteSoundMutation = useDeleteUserSound();
  const updateSoundMutation = useUpdateUserSound(soundId);

  if (!sound) return null

  // helper flag
  const isEditing = !!editModes[soundId]

  return (
    <main>
      {!isDeleteMode ? (
        <div className='space-y-1 border-2 p-2 rounded-lg'>
          <motion.button
            className="group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300 h-10"
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
                onClick={e => e.stopPropagation()}
                onChange={e => editSound(soundId, e.target.value)}
                onBlur={() => {
                  toggleEditMode(soundId)

                  if (sound.name.trim() === '') {
                    editSound(soundId, originalName)
                    return
                  }

                  if (sound.name !== originalName) {
                    updateSoundMutation.mutate(sound.name)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    toggleEditMode(soundId)

                    if (sound.name.trim() === '') {
                      editSound(soundId, originalName)
                      return
                    }

                    if (sound.name !== originalName) {
                      updateSoundMutation.mutate(sound.name)
                    }
                  }
                }}
                className="bg-transparent h-10 px-0 py-0 rounded-sm w-full"
              />
            ) : (
              <span>{sound.name}</span>
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
          <Button onClick={() => deleteSoundMutation.mutate(soundId)}>
            Delete {sound.name}
          </Button>
        </div>
      )}
    </main>
  )
}

export default AmbientSoundsButton