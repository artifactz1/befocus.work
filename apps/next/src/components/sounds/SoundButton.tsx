'use client'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Slider } from '@repo/ui/slider'
import { Toggle } from '@repo/ui/toggle'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useDeleteUserSound, useUpdateUserSound } from '~/hooks/useSounds'
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
    // deleteSound
  } = useSoundsStore()

  const sound = sounds[soundId]

  const [originalName, setOriginalName] = useState('')

  const deleteSoundMutation = useDeleteUserSound();
  const updateSoundMutation = useUpdateUserSound(soundId);

  const { currentTimes, setCurrentTime } = useSoundsStore()
  const currentTime = currentTimes[soundId] ?? 0
  const [seeking, setSeeking] = useState(false)

  if (!sound) return null

  // helper flag
  const isEditing = !!editModes[soundId]

  return (
    <main>
      {!isDeleteMode ? (
        <div className='space-y-2'>
          <motion.button
            // …same animation props…
            className="group relative flex w-full cursor-pointer select-none items-center space-x-2 rounded p-2 text-sm font-medium transition-colors duration-300 h-10"
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
                className="bg-transparent h-10 px-0 py-0 rounded-sm w-full"
              />
            ) : (
              <span>
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
          <div className="flex items-center space-x-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={300} // Default max — we’ll fix duration support later
              step={0.1}
              onValueChange={([val]) => {
                setSeeking(true)
                setCurrentTime(soundId, val)
              }}
              onValueCommit={([val]) => {
                const player = document.querySelector(`iframe[src*="${sound.url}"]`)?.contentWindow
                if (player) {
                  player.postMessage(
                    JSON.stringify({
                      event: 'command',
                      func: 'seekTo',
                      args: [val, true],
                    }),
                    '*'
                  )
                }
                setSeeking(false)
              }}
              className="w-full"
            />
            <span className="text-xs">{Math.floor(currentTime)}s</span>
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

export default SoundSettings
