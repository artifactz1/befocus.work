'use client'

import { DEFAULT_LOOK, type Look, type LookKey, lookEquals, lookSchema } from '@repo/types/look'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { useStore } from 'zustand/react'
import { createStore } from 'zustand/vanilla'
import { lookToTokens } from '~/lib/customize/catalog'

interface CustomizeState {
  /** What the dashboard shows when the panel is closed. */
  active: Look
  /** A copy of `active` taken when the panel opens, edited by every control. */
  preview: Look
  /** What storage has. Always DEFAULT_LOOK in Phase 2 and never written again here. */
  persisted: Look
  panelOpen: boolean
  openPanel: () => void
  setPreview: <K extends LookKey>(key: K, value: Look[K]) => void
  apply: () => void
  cancel: () => void
  resetPreview: () => void
}

function createCustomizeStore(initialLook: unknown) {
  const parsed = lookSchema.safeParse(initialLook)
  const look = parsed.success ? parsed.data : DEFAULT_LOOK

  return createStore<CustomizeState>()((set, get) => ({
    active: look,
    preview: look,
    persisted: look,
    panelOpen: false,
    openPanel: () => set(state => ({ preview: state.active, panelOpen: true })),
    setPreview: (key, value) => {
      const candidate = { ...get().preview, [key]: value }
      const result = lookSchema.safeParse(candidate)
      if (!result.success) {
        console.warn(`setPreview: invalid value for "${key}"`, value)
        return
      }
      set({ preview: result.data })
    },
    apply: () => set(state => ({ active: state.preview, panelOpen: false })),
    cancel: () => set(state => ({ preview: state.active, panelOpen: false })),
    resetPreview: () => set({ preview: DEFAULT_LOOK }),
  }))
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

export function selectIsDefault(state: CustomizeState): boolean {
  return lookEquals(state.preview, DEFAULT_LOOK)
}

/** Custom property names lookToTokens ever writes - fixed regardless of look values. */
const TOKEN_NAMES = Object.keys(lookToTokens(DEFAULT_LOOK).props)

export function CustomizeStoreProvider({
  initialLook,
  children,
}: {
  initialLook: unknown
  children: ReactNode
}) {
  const [store] = useState(() => createCustomizeStore(initialLook))

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
  }, [store])

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
