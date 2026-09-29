'use client'

import { toast } from 'sonner'
import { selectIsDirty, useCustomizeStore } from '~/store/useCustomizeStore'

export function useCustomizeActions() {
  const openPanel = useCustomizeStore(state => state.openPanel)
  const applyStore = useCustomizeStore(state => state.apply)
  const cancelStore = useCustomizeStore(state => state.cancel)
  const panelOpen = useCustomizeStore(state => state.panelOpen)
  const isDirty = useCustomizeStore(selectIsDirty)

  const open = () => {
    openPanel()
  }

  const apply = () => {
    applyStore()
    toast('Look applied')
  }

  const discard = () => {
    const wasDirty = isDirty
    cancelStore()
    if (wasDirty) {
      toast('Changes discarded')
    }
  }

  const toggle = () => {
    if (panelOpen) {
      discard()
    } else {
      open()
    }
  }

  return { open, apply, discard, toggle }
}
