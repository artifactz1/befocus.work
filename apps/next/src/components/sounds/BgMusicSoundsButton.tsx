// 'use client'

// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/accordion'
// import { Separator } from '@repo/ui/separator'
// import { useSoundsStore } from '~/store/useSoundsStore'
// import SoundButton from './SoundButton'

// export default function BgMusicSoundsButton() {
//   const { sounds } = useSoundsStore()

//   return (
//     <main>
//       <Separator className='my-4 bg-white' />

//       <Accordion type='single' collapsible>
//         <AccordionItem className='border-0' value='item-1'>
//           <AccordionTrigger className='text-md font-bold'>Music Sounds</AccordionTrigger>
//           <AccordionContent>
//             <div className='space-y-4'>
//               {Object.keys(sounds)
//                 .filter(soundId => sounds[soundId]?.soundType === 'bgMusic')
//                 .map(soundId => (
//                   <SoundButton key={soundId} soundId={soundId} />
//                 ))}
//             </div>
//           </AccordionContent>
//         </AccordionItem>
//       </Accordion>
//       <Separator className='my-4 bg-white' />

//       {/* <h3 className="text-center font-semibold mb-3"> Music Sounds</h3>
//       <div className="space-y-4">
//         {Object.keys(sounds)
//           .filter((soundId) => sounds[soundId]?.soundType === "bgMusic")
//           .map((soundId) => (
//             <SoundButton key={soundId} soundId={soundId} />
//           ))}
//       </div> */}
//     </main>
//   )
// }

'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/accordion'
import { Separator } from '@repo/ui/separator'
import IpodMusicPlayer from './IpodMusicPlayer'

export default function BgMusicSoundsButton() {
  return (
    <main>
      <Separator className='my-4 bg-white' />

      <Accordion type='single' collapsible>
        <AccordionItem className='border-0' value='item-1'>
          <AccordionTrigger className='text-md font-bold'>
            Music Sounds
          </AccordionTrigger>

          <AccordionContent>
            {/* ← here’s your new iPod UI */}
            <IpodMusicPlayer />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator className='my-4 bg-white' />
    </main>
  )
}