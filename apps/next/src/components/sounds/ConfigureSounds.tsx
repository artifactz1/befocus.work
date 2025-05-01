import type { SoundType } from '@repo/api/db/schemas'
import AddSoundButton from './AddSoundButton'
import ToggleAddMode from './ToggleAddMode'
import ToggleDeleteModeButton from './ToggleDeleteMode'

export default function ConfigureSounds({ sound }: { sound: SoundType }) {
  return (
    <div>
      <AddSoundButton type={sound} />
      <div className='mt-4 flex w-full items-center justify-between'>
        <ToggleAddMode />
        <ToggleDeleteModeButton />
      </div>
    </div>
  )


}
