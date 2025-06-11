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

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

const SoundSettings = ({ soundId,  }: { soundId: string }) => {
  // Split the store selectors to avoid unnecessary re-renders
  const sound = useSoundsStore(state => state.sounds[soundId])
  const editModes = useSoundsStore(state => state.editModes)
  const isDeleteMode = useSoundsStore(state => state.isDeleteMode)
  const currentTime = useSoundsStore(state => state.currentTimes[soundId] ?? 0)
  const duration = useSoundsStore(state => state.durations[soundId] ?? 300)
  const isSeeking = useSoundsStore(state => state.seekingStates[soundId] ?? false)
  const playerRefs = useSoundsStore(state => state.playerRefs)

  // Actions
  const toggleEditMode = useSoundsStore(state => state.toggleEditMode)
  const editSound = useSoundsStore(state => state.editSound)
  const toggleSound = useSoundsStore(state => state.toggleSound)
  const setVolume = useSoundsStore(state => state.setVolume)
  const setSeeking = useSoundsStore(state => state.setSeeking)
  const setCurrentTime = useSoundsStore(state => state.setCurrentTime)

  const [originalName, setOriginalName] = useState('')

  const deleteSoundMutation = useDeleteUserSound();
  const updateSoundMutation = useUpdateUserSound(soundId);

  // Debug logging - only log when values actually change
  // console.log(`[${soundId}] Current Time:`, currentTime, 'Duration:', duration, 'Seeking:', isSeeking)

  if (!sound) return null

  // helper flag
  const isEditing = !!editModes[soundId]

  const handleSliderChange = ([raw]: number[]) => {
    const val = raw ?? 0
    // console.log(`[${soundId}] Slider Change:`, val)
    setSeeking(soundId, true)
    setCurrentTime(soundId, val)
  }

  const handleSliderCommit = ([raw]: number[]) => {
    const val = raw ?? 0
    // console.log(`[${soundId}] Slider Commit:`, val)

    const player = playerRefs[soundId]
    if (player) {
      // console.log(`[${soundId}] Seeking to:`, val)
      player.seekTo(val, 'seconds')
    } else {
      console.warn(`[${soundId}] No player ref found`)
    }

    setCurrentTime(soundId, val)
    setSeeking(soundId, false)
  }

  return (
    <main>
      {!isDeleteMode ? (
        <div className='space-y-2'>
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


          <div className="flex items-center space-x-2">
              <Slider
                value={[isSeeking ? currentTime : currentTime]}
                min={0}
                max={duration}
                step={0.1}
                onValueChange={handleSliderChange}
                onValueCommit={handleSliderCommit}
                className="w-full"
              />
              <span className="text-xs w-16 text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

          {/* Debug Info - Remove in production */}
          {/* <div className="text-xs text-gray-500 mt-2">
            <div>Debug: Seeking={isSeeking ? 'true' : 'false'}</div>
            <div>Current Time: {currentTime.toFixed(1)}s</div>
            <div>Duration: {duration.toFixed(1)}s</div>
            <div>Player Ref: {playerRefs[soundId] ? 'exists' : 'missing'}</div>
          </div> */}
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