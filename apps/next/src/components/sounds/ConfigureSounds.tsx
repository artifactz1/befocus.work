import ToggleAddMode from './ToggleAddMode'
import ToggleDeleteModeButton from './ToggleDeleteMode'

export default function ConfigureSounds() {
  return (
    <div>
      <div className='mt-4 flex w-full items-center justify-between'>
        <ToggleAddMode />
        <ToggleDeleteModeButton />
      </div>
    </div>
  )


}
