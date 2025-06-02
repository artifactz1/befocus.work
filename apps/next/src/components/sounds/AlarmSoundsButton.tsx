'use client'

import { Button } from '@repo/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { Slider } from '@repo/ui/slider'
import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSoundsStore } from '~/store/useSoundsStore'
import Divider from '../helper/Divider'

export default function AlarmSoundsButton() {
  const { sounds, alarmId, setAlarmId, setVolume, toggleSound, isSoundSettingsOpen } =
    useSoundsStore()

  const sound = sounds[alarmId]

  const [volume, setVolumeState] = useState(0.5)

  const [isPlaying, setIsPlaying] = useState(false) // Local state to manage ReactPlayer's playing state

  // Set ReactPlayer to not play when popover is open
  useEffect(() => {
    if (isSoundSettingsOpen) {
      setIsPlaying(false) // Stop sound when the popover is open
    }
  }, [isSoundSettingsOpen])

  // Update ReactPlayer's playing state when a new sound is selected
  const handleSelectChange = (value: string) => {
    if (value) {
      setAlarmId(value) // Safely update alarmId
      toggleSound(value) // Trigger sound toggle
      setIsPlaying(true) // Start playing the sound when a new alarm is selected
    } else {
      console.warn('Invalid value selected:', value)
    }
  }

  if (!sound) return null

  return (
    <div className="pb-5">
      <ReactPlayer
        url={sound.url} // Replace with your media URL
        playing={isPlaying} // Controlled by state
        volume={volume}
        controls={false}
        width='0'
        height='0'
        onReady={() => console.log('Player is ready')}
        onStart={() => console.log('Video started')}
        onError={(error) => console.error('ReactPlayer error:', error)} // Add this
        onLoadStart={() => console.log('Load started for:', sound.url)} // Add this
      />
      <Divider className="hidden md:block" />
      <h3 className='mb-3 text-left font-semibold py-2'>Alarm Sound</h3>
      <div className='flex flex-col space-y-10 '>
        <Select
          value={alarmId} // Ensure value is a string
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select an alarm' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.keys(sounds)
                .filter(soundId => sounds[soundId]?.soundType === 'alarm') // Only alarm sounds
                .map(soundId => (
                  <SelectItem key={soundId} value={soundId}>
                    {soundId}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='flex w-full items-center space-y-2'>
          {/* <label className="block text-center text-sm">Volume</label> */}
          <Slider
            value={[volume * 100]} // Default to the current volume (range 0-100)
            onValueChange={value => {
              const newVol = (value[0] ?? 0) / 100  // Default to 0 if value is undefined
              // setVolume(alarmId, newVolume / 100) // Set volume globally (range 0-1)
              setVolumeState(newVol) // Set volume globally (range 0-1)
              setVolume(alarmId, newVol)
            }}
            max={100}
            step={1}
            className='w-full'
          />
        </div>
        {/* <Button>
          Preview Sound
        </Button> */}
        {/* <Button onClick={() => setIsPlaying(true)}>
          Preview Sound
        </Button> */}

        {/* <Separator className='my-4 hidden bg-white md:block' /> */}
        <Button onClick={() => {
          toggleSound(alarmId);
          setIsPlaying(true);
        }}>
          Preview Sound
        </Button>
      </div>
    </div>
  )
}
