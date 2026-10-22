import { useEffect, useRef } from 'react'
import { useSessionCard } from '~/components/settings/useSessionCard'
import { useTimerStoreApi } from '~/store/useTimerStore'

const EDITABLE_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])"
const GUARDED_CONTAINER_SELECTOR =
  "[role='dialog']:not([data-customize-panel]):not([data-record-room]):not([data-tasks-card]), [role='alertdialog'], [role='menu'], [role='listbox'], [data-break-log], [data-session-summary], [data-log-page]"
const ACTIVATABLE_SELECTOR =
  "button, a[href], summary, [role='button'], [role='tab'], [role='menuitem'], [role='option'], [role='switch'], [role='checkbox'], [role='radio'], [role='slider']"

export function useTimerKeyboard() {
  const store = useTimerStoreApi()
  const { requestStart } = useSessionCard()
  const requestStartRef = useRef(requestStart)
  requestStartRef.current = requestStart

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      // Shift is allowed for '+' only (most layouts type it with Shift).
      if (event.shiftKey && event.key !== '+') return

      const target = event.target
      if (target instanceof Element) {
        if (target.closest(EDITABLE_SELECTOR)) return
        if (target.closest(GUARDED_CONTAINER_SELECTOR)) return
      }

      if (event.key === ' ') {
        if (target instanceof Element && target.closest(ACTIVATABLE_SELECTOR)) return
        event.preventDefault()
        requestStartRef.current()
        return
      }

      if (event.key === '+' || event.key === '=') {
        if (store.getState().adjust(1)) event.preventDefault()
        return
      }

      if (event.key === '-') {
        if (store.getState().adjust(-1)) event.preventDefault()
        return
      }

      if (event.key === 'Enter') {
        if (store.getState().status !== 'ended') return
        if (
          target instanceof Element &&
          target.closest(ACTIVATABLE_SELECTOR) &&
          !target.closest("[aria-disabled='true']")
        )
          return
        event.preventDefault()
        store.getState().startNext()
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
