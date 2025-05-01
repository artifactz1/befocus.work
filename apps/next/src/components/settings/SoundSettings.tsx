'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSoundsStore } from '~/store/useSoundsStore'
import MenuButton from '../MenuButtons'
import AmbientSoundsButton from '../sounds/AmbientSoundsButton'
import AlarmSoundsButton from '../sounds/AlarmSoundsButton'
import { Separator } from '@repo/ui/separator'
import BgMusicSoundsButton from '../sounds/BgMusicSoundsButton'
import ConfigureSounds from '../sounds/ConfigureSounds'
// import ToggleAddMode from '../sounds/ToggleAddMode'Mode'

export default function SoundSettings() {
  const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false)
  const { setSoundSettingsOpen } = useSoundsStore()

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
        className='max-h-[500px] w-[90vw] gap-3 overflow-y-hidden rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 hover:overflow-y-auto sm:ml-[82px] sm:w-[392px] md:mx-10 lg:mx-0'
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
            <BgMusicSoundsButton />
            <ConfigureSounds sound='bgMusic'/>
          </TabsContent>
          <TabsContent value="ambient">
            <AmbientSoundsButton />
            <ConfigureSounds sound='ambient'/>
          </TabsContent>
          <TabsContent value="alarm">
            <AlarmSoundsButton />
          </TabsContent>
        </Tabs>
        {/* <div className='mb-2 mt-4 text-lg font-bold'>befocus/sounds</div>
          <AlarmSoundsButton />
          <AmbientSoundsButton />
          <BgMusicSoundsButton />
          <AddSoundButton />
          <div className='mt-4 flex w-full items-center justify-center space-x-2'>
            <ToggleAddMode />
            <ToggleDeleteModeButton />
          </div> */}
      </PopoverContent>
    </Popover>
  )
}
