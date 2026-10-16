'use client'

import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Slider } from '@repo/ui/slider'
import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSoundsStore } from '~/store/useSoundsStore'

// Alarm choice, preview and volume. Applies immediately, no Save needed.
export function AlarmPicker() {
  const alarms = useSoundsStore(
    useShallow(state => Object.values(state.sounds).filter(s => s.soundType === 'alarm')),
  )
  const alarmId = useSoundsStore(state => state.alarmId)
  const setAlarmId = useSoundsStore(state => state.setAlarmId)
  const setVolume = useSoundsStore(state => state.setVolume)
  const current = alarms.find(a => a.id === alarmId)

  const [previewing, setPreviewing] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setPreviewing(false)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: stop on alarm change and unmount
  useEffect(() => stop, [alarmId])

  const togglePreview = () => {
    if (previewing) return stop()
    if (!current) return
    const audio = new Audio(current.url)
    audio.volume = current.volume
    audio.onended = () => setPreviewing(false)
    audioRef.current = audio
    setPreviewing(true)
    audio.play().catch(() => setPreviewing(false))
  }

  return (
    <div className='flex flex-col space-y-3'>
      <Label htmlFor='alarm-sound' className='text-md font-bold'>
        Alarm sound
      </Label>
      <div className='flex items-center space-x-2'>
        <Select value={alarmId} onValueChange={setAlarmId}>
          <SelectTrigger id='alarm-sound' className='flex-1'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {alarms.map(a => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type='button'
          variant='secondary'
          size='icon'
          className='h-10 w-10'
          aria-label='Preview alarm'
          aria-pressed={previewing}
          onClick={togglePreview}
        >
          {previewing ? <Pause height={16} width={16} /> : <Play height={16} width={16} />}
        </Button>
      </div>
      <Slider
        aria-label='Alarm volume'
        min={0}
        max={1}
        step={0.05}
        value={[current?.volume ?? 0.5]}
        onValueChange={([v]) => setVolume(alarmId, v ?? 0.5)}
      />
    </div>
  )
}
