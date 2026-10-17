'use client'

import { useCustomizeStore } from '~/store/useCustomizeStore'
import { useSoundsStore } from '~/store/useSoundsStore'
import { useTimerStoreApi } from '~/store/useTimerStore'

// One request-start entry for Play, Space and the command menu. When the card opens it also
// closes Customize and the Records room in the same handler, so the card's focus wins.
export function useSessionCard() {
  const store = useTimerStoreApi()
  const closeCustomize = useCustomizeStore(s => s.apply)

  const closeOthers = () => {
    useSoundsStore.getState().setRoomOpen(false)
    closeCustomize()
  }

  const requestStart = () => {
    store.getState().requestStart()
    if (store.getState().card !== null) closeOthers()
  }

  const openEdit = () => {
    closeOthers()
    store.getState().openCard('edit')
  }

  return { requestStart, openEdit }
}
