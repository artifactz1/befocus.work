import { Toggle } from '@repo/ui/toggle'
import { Minus } from 'lucide-react'
import { useSoundsStore } from '~/store/useSoundsStore'

export default function ToggleDeleteModeButton() {
  const { toggleDeleteMode, toggleAddMode, isAddMode, isDeleteMode } = useSoundsStore()

  const handleSubmit = () => {
    if (isAddMode === true) {
      toggleDeleteMode()
      toggleAddMode()
    }
    toggleDeleteMode()
  }

  return (

    <Toggle disabled={isAddMode} onClick={handleSubmit}>
      {
        isAddMode ? '' : isDeleteMode ? 'Cancel' :
          <Minus />
      }
    </Toggle>
  )
}
