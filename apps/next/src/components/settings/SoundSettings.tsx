'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Separator } from '@repo/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSoundsStore } from '~/store/useSoundsStore'
import MenuButton from '../MenuButtons'
import AddSoundButton from '../sounds/AddSoundButton'
import AlarmSoundsButton from '../sounds/AlarmSoundsButton'
import AmbientSoundsButton from '../sounds/AmbientSoundsButton'
import BgMusicSoundsButton from '../sounds/BgMusicSoundsButton'
import ConfigureSounds from '../sounds/ConfigureSounds'

export default function SoundSettings() {
  const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false)
  const { setSoundSettingsOpen, isAddMode } = useSoundsStore()


  useEffect(() => {
    setSoundSettingsOpen(isSoundOpen)
  }, [isSoundOpen, setSoundSettingsOpen])
  return (
    <Popover open={isSoundOpen} onOpenChange={setIsSoundOpen}>
      <PopoverTrigger asChild>
        <MenuButton>
          <Volume2 />
        </MenuButton>
      </PopoverTrigger>
      <PopoverContent
        align='center'
        className=' w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:ml-[82px] sm:w-[392px] md:mx-10 lg:mx-0'
      >
        <Tabs className='flex w-full select-none flex-col justify-end rounded-md no-underline outline-none'>
          <Volume2 />
          <div className='mb-2 mt-4 text-lg font-bold'>befocus/sounds</div>
          <Separator className='my-4 bg-white' />
          <TabsList className="flex w-full">
            <TabsTrigger className="flex-1 " value="music">
              Music
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="ambient">
              Ambient
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="alarm">
              Alarm
            </TabsTrigger>
          </TabsList>
          <TabsContent value="music">
            {
              isAddMode ? (
                <AddSoundButton type={'bgMusic'} />
              ) : (

                <BgMusicSoundsButton />
              )
            }
            <ConfigureSounds />
          </TabsContent>
          <TabsContent value="ambient">
            {
              isAddMode ? (
                <AddSoundButton type={'ambient'} />
              ) : (

                <AmbientSoundsButton />
              )
            }
            <ConfigureSounds />
          </TabsContent>
          <TabsContent value="alarm">
            <AlarmSoundsButton />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
