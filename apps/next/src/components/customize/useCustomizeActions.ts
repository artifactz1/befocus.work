'use client'

import { useCustomizeStore } from '~/store/useCustomizeStore'
import { useSoundsStore } from '~/store/useSoundsStore'

/**
 * Live model: every control paints immediately. Done, close, Escape and leaving the route
 * all keep the change (`close`); Revert puts back the look the panel opened with.
 */
export function useCustomizeActions() {
  const openPanel = useCustomizeStore(state => state.openPanel)
  const close = useCustomizeStore(state => state.apply)
  const revert = useCustomizeStore(state => state.revert)
  const panelOpen = useCustomizeStore(state => state.panelOpen)

  // the room and the inspector never show together
  const open = () => {
    useSoundsStore.getState().setRoomOpen(false)
    openPanel()
  }

  const toggle = () => (panelOpen ? close() : open())

  return { open, close, revert, toggle }
}
