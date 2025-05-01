import { Toggle } from '@repo/ui/toggle'
import { Plus } from 'lucide-react'
import { useSoundsStore } from '~/store/useSoundsStore'

export default function ToggleAddMode() {
  const { toggleAddMode, toggleDeleteMode, isDeleteMode, isAddMode } = useSoundsStore()

  const handleSubmit = () => {
    // if (isDeleteMode === true) {
    //   toggleAddMode();
    // } else {
    //   toggleAddMode();
    //   toggleDeleteMode();
    // }

    if (isDeleteMode === true) {
      toggleDeleteMode()
      toggleAddMode()
    } else {
      toggleAddMode()
    }
  }

  return (

    <Toggle disabled={isDeleteMode} onClick={handleSubmit}>
      {
        isDeleteMode ? '' : isAddMode ? 'Cancel' :
          <Plus />
      }
    </Toggle>
  )
}
