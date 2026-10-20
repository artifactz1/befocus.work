'use client'

import { DEFAULT_LOOK, type Look, type LookKey, lookEquals, lookSchema } from '@repo/types/look'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useStore } from 'zustand/react'
import { createStore } from 'zustand/vanilla'
import { api } from '~/lib/api.client'
import { lookToTokens } from '~/lib/customize/catalog'
import { readGuestLook, writeGuestLook } from '~/lib/customize/guest-look'
import { createLookSaver } from '~/lib/customize/look-saver'

export type CustomizeMode = 'account' | 'guest'

export function reportSaveFailed(error: unknown) {
  console.error('look save failed', error)
  toast.error(
    "Couldn't save your look. It stays on this screen. We'll try again next time you change it.",
    {
      id: 'look-save-failed',
    },
  )
}

// Once per page load; the look stays painted for this visit.
let storageBlockedShown = false

export function reportStorageBlocked() {
  if (storageBlockedShown) return
  storageBlockedShown = true
  toast("This browser isn't saving your look. Private browsing can block storage.")
}

interface CustomizeState {
  /** What the dashboard shows when the panel is closed. */
  active: Look
  /** A copy of `active` taken when the panel opens, edited live by every control. */
  preview: Look
  /** What storage or the server last confirmed. Moves only after a write succeeds. */
  persisted: Look
  mode: CustomizeMode
  panelOpen: boolean
  openPanel: () => void
  setPreview: <K extends LookKey>(key: K, value: Look[K]) => void
  patchPreview: (patch: Partial<Omit<Look, 'version'>>) => void
  /** The only write path: server for account, browser storage for guest. */
  saveLook: (look: Look) => void
  /** Keeps the live preview, saves it when it changed, and closes the panel. */
  apply: () => void
  /** Puts the preview back to the look the panel opened with. The panel stays open. */
  revert: () => void
}

function createCustomizeStore(mode: CustomizeMode, initialLook: unknown) {
  const parsed = lookSchema.safeParse(initialLook)
  const look = parsed.success ? parsed.data : DEFAULT_LOOK

  return createStore<CustomizeState>()((set, get) => {
    const saver = createLookSaver({
      send: async next => {
        const res = await api.user.themes.active.$put(
          { json: { look: next } },
          { init: { keepalive: true } },
        )
        if (!res.ok) throw new Error(String(res.status))
      },
      onSaved: saved => set({ persisted: saved }),
      onError: reportSaveFailed,
    })

    return {
      mode,
      active: look,
      preview: look,
      persisted: look,
      panelOpen: false,
      openPanel: () => set(state => ({ preview: state.active, panelOpen: true })),
      setPreview: (key, value) => get().patchPreview({ [key]: value }),
      patchPreview: patch => {
        const result = lookSchema.safeParse({ ...get().preview, ...patch })
        if (!result.success) {
          console.warn('patchPreview: invalid look patch', patch)
          return
        }
        set({ preview: result.data })
      },
      saveLook: next => {
        if (mode === 'account') {
          saver.save(next)
        } else if (writeGuestLook(next)) {
          set({ persisted: next })
        } else {
          reportStorageBlocked()
        }
      },
      apply: () => {
        const { preview, active, saveLook } = get()
        // compare with active, not persisted: a failed save is retried on the next change
        if (!lookEquals(preview, active)) saveLook(preview)
        set({ active: preview, panelOpen: false })
      },
      revert: () => set(state => ({ preview: state.active })),
    }
  })
}

type CustomizeStoreApi = ReturnType<typeof createCustomizeStore>

const CustomizeStoreContext = createContext<CustomizeStoreApi | undefined>(undefined)

function identity(state: CustomizeState): CustomizeState {
  return state
}

export function selectPaintedLook(state: CustomizeState): Look {
  return state.panelOpen ? state.preview : state.active
}

export function selectIsDirty(state: CustomizeState): boolean {
  return !lookEquals(state.preview, state.active)
}

/** Custom property names lookToTokens ever writes - fixed regardless of look values. */
const TOKEN_NAMES = Object.keys(lookToTokens(DEFAULT_LOOK).props)

export function CustomizeStoreProvider({
  mode,
  initialLook,
  children,
}: {
  mode: CustomizeMode
  initialLook: unknown
  children: ReactNode
}) {
  const [store] = useState(() => createCustomizeStore(mode, initialLook))

  // Route leaves that unmount the layout (for example /guest to /sign-in) with the panel open.
  useEffect(
    () => () => {
      if (store.getState().panelOpen) store.getState().apply()
    },
    [store],
  )

  useEffect(() => {
    const root = document.documentElement

    const paint = () => {
      const state = store.getState()
      const { props, attrs } = lookToTokens(selectPaintedLook(state))
      for (const [name, value] of Object.entries(props)) {
        root.style.setProperty(name, value)
      }
      root.setAttribute('data-progress', attrs['data-progress'])
      root.setAttribute('data-density', attrs['data-density'])
      root.setAttribute('data-panel', state.panelOpen ? 'open' : 'closed')
    }

    if (mode === 'guest') {
      const stored = readGuestLook()
      if (stored) store.setState({ active: stored, preview: stored, persisted: stored })
    }

    paint()
    const unsubscribe = store.subscribe(paint)

    return () => {
      unsubscribe()
      for (const name of TOKEN_NAMES) {
        root.style.removeProperty(name)
      }
      root.removeAttribute('data-progress')
      root.removeAttribute('data-density')
      root.removeAttribute('data-panel')
    }
  }, [store, mode])

  return <CustomizeStoreContext.Provider value={store}>{children}</CustomizeStoreContext.Provider>
}

export function useCustomizeStore(): CustomizeState
export function useCustomizeStore<T>(selector: (state: CustomizeState) => T): T
export function useCustomizeStore<T = CustomizeState>(selector?: (state: CustomizeState) => T): T {
  const store = useContext(CustomizeStoreContext)
  if (!store) {
    throw new Error('useCustomizeStore must be used within CustomizeStoreProvider')
  }
  return useStore(store, selector ?? (identity as unknown as (state: CustomizeState) => T))
}
