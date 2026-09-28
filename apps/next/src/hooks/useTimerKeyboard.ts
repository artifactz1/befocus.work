import { useEffect } from 'react'
import { useTimerStoreApi } from '~/store/useTimerStore'

const EDITABLE_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])"
const GUARDED_CONTAINER_SELECTOR =
  "[role='dialog']:not([data-customize-panel]), [role='alertdialog'], [role='menu'], [role='listbox']"
const ACTIVATABLE_SELECTOR =
  "button, a[href], summary, [role='button'], [role='tab'], [role='menuitem'], [role='option'], [role='switch'], [role='checkbox'], [role='radio'], [role='slider']"

export function useTimerKeyboard() {
  const store = useTimerStoreApi()

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

      const target = event.target
      if (target instanceof Element) {
        if (target.closest(EDITABLE_SELECTOR)) return
        if (target.closest(GUARDED_CONTAINER_SELECTOR)) return
      }

      if (event.key === ' ') {
        if (target instanceof Element && target.closest(ACTIVATABLE_SELECTOR)) return
        event.preventDefault()
        store.getState().toggleTimer()
        return
      }

      if (event.key.toLowerCase() === 'r') {
        store.getState().resetCurrentTime()
      }
    }

    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [store])
}
