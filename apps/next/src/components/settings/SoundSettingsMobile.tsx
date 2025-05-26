// 'use client'

// import { Button } from '@repo/ui/button'
// import {
//   Drawer,
//   DrawerContent,
//   DrawerFooter,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerTrigger,
// } from '@repo/ui/drawer'
// import { Separator } from '@repo/ui/separator'
// import { Volume2 } from 'lucide-react'
// import { useEffect, useState } from 'react'
// import { useSoundsStore } from '~/store/useSoundsStore'
// import AddSoundButton from '../sounds/AddSoundButton'
// import AlarmSoundsButton from '../sounds/AlarmSoundsButton'
// import AmbientSoundsButton from '../sounds/AmbientSoundsButton'
// import BgMusicSoundsButton from '../sounds/BgMusicSoundsButton'
// import ToggleAddMode from '../sounds/ToggleAddMode'
// import ToggleDeleteModeButton from '../sounds/ToggleDeleteMode'

// export default function SoundSettingsMobile() {
//   const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false)
//   const { setSoundSettingsOpen } = useSoundsStore()

//   useEffect(() => {
//     setSoundSettingsOpen(isSoundOpen)
//   }, [isSoundOpen, setSoundSettingsOpen])

//   return (
//     <main>
//       <Drawer>
//         <DrawerTrigger asChild>
//           <Button
//             variant='outline'
//             size='lg'
//             className='lg:h-12 lg:w-32'
//             onClick={() => setIsSoundOpen(!isSoundOpen)}
//           >
//             <Volume2 />
//           </Button>
//         </DrawerTrigger>
//         <DrawerContent className='max-h-screen px-2'>
//           <DrawerHeader>
//             <DrawerTitle className='mx-1'>
//               <Volume2 />
//               <div className='mb-2 mt-4 text-left text-lg font-bold'>befocus/sounds</div>
//               <Separator className='mt-4 bg-white' />
//             </DrawerTitle>
//             {/* <DrawerDescription>This action cannot be undone.</DrawerDescription> */}
//           </DrawerHeader>

//           <div className='overflow-y-auto px-5'>
//             <AlarmSoundsButton />
//             <AmbientSoundsButton />
//             <BgMusicSoundsButton />
//           </div>

//           <DrawerFooter>
//             <AddSoundButton type={''} />
//             <div className='mt-4 flex w-full items-center justify-center space-x-2'>
//               <ToggleAddMode />
//               <ToggleDeleteModeButton />
//             </div>
//             {/* <DrawerClose>
//               <Button variant="outline">Cancel</Button>
//             </DrawerClose> */}
//           </DrawerFooter>
//         </DrawerContent>
//       </Drawer>
//     </main>
//   )
// }

'use client'

import { Button } from '@repo/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/drawer'
import { Separator } from '@repo/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSoundsStore } from '~/store/useSoundsStore'
import AddSoundButton from '../sounds/AddSoundButton'
import AlarmSoundsButton from '../sounds/AlarmSoundsButton'
import AmbientSoundsButton from '../sounds/AmbientSoundsButton'
import BgMusicSoundsButton from '../sounds/BgMusicSoundsButton'
import ConfigureSounds from '../sounds/ConfigureSounds'

export default function SoundSettingsMobile() {
  const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false)
  const { setSoundSettingsOpen, isAddMode } = useSoundsStore()

  useEffect(() => {
    setSoundSettingsOpen(isSoundOpen)
  }, [isSoundOpen, setSoundSettingsOpen])

  return (
    <main>
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            variant='outline'
            size='lg'
            className='lg:h-12 lg:w-32'
            onClick={() => setIsSoundOpen(!isSoundOpen)}
          >
            <Volume2 />
          </Button>
        </DrawerTrigger>
        <DrawerContent className='max-h-screen px-2'>
          <DrawerHeader>
            <DrawerTitle className='mx-1'>
              <Volume2 />
              <div className='mb-2 mt-4 text-left text-lg font-bold'>befocus/sounds</div>
              <Separator className='mt-4 bg-white' />
            </DrawerTitle>
          </DrawerHeader>

          <div className='overflow-y-auto px-5'>
            <Tabs defaultValue='music' className='w-full'>
              <TabsList className="flex w-full">
                <TabsTrigger className="flex-1" value="music">
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
                {isAddMode ? (
                  <AddSoundButton type='bgMusic' />
                ) : (
                  <BgMusicSoundsButton />
                )}
                <ConfigureSounds />
              </TabsContent>

              <TabsContent value="ambient">
                {isAddMode ? (
                  <AddSoundButton type='ambient' />
                ) : (
                  <AmbientSoundsButton />
                )}
                <ConfigureSounds />
              </TabsContent>

              <TabsContent value="alarm">
                <AlarmSoundsButton />
              </TabsContent>
            </Tabs>
          </div>

          {/* No need to render AddSoundButton here if already handled in tabs */}
          <DrawerFooter className="py-t" />
          {/* <div className='mt-4 flex w-full items-center justify-center space-x-2'>
              <ToggleAddMode />
              <ToggleDeleteModeButton />
            </div> */}
        </DrawerContent>
      </Drawer>
    </main>
  )
}
