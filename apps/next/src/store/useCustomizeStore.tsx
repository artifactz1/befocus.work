'use client'

import type { Customizations, Theme } from '@repo/types/customize'
import { DEFAULT_CUSTOMIZATIONS, DEFAULT_THEME } from '@repo/types/customize'
import { create } from 'zustand'

type CustomizeTab = 'theme' | 'background' | 'type' | 'color' | 'style'

// One-level-deep partial: scalar fields stay required-or-absent, nested
// object fields accept Partial. Lets callers patch e.g. just
// `{ color: { accent } }` without restating `contrast`.
type CustomizationsPatch = {
  background?: Customizations['background']
  overlay?: Partial<Customizations['overlay']>
  blur?: Customizations['blur']
  grain?: Customizations['grain']
  typography?: Partial<Customizations['typography']>
  color?: Partial<Customizations['color']>
  timer?: Partial<Customizations['timer']>
  density?: Customizations['density']
}

type CustomizeStore = {
  activeTheme: Theme
  preview: Customizations
  isOpen: boolean
  currentTab: CustomizeTab

  open: (tab?: CustomizeTab) => void
  close: () => void
  setTab: (tab: CustomizeTab) => void
  setPreview: (patch: CustomizationsPatch) => void
  apply: () => void
  resetToDefault: () => void
  hydrate: (theme: Theme) => void
}

export const useCustomizeStore = create<CustomizeStore>(set => ({
  activeTheme: DEFAULT_THEME,
  preview: DEFAULT_CUSTOMIZATIONS,
  isOpen: false,
  currentTab: 'theme',

  open: tab =>
    set(s => ({
      isOpen: true,
      currentTab: tab ?? s.currentTab,
      preview: s.activeTheme.customizations,
    })),

  close: () =>
    set(s => ({
      isOpen: false,
      preview: s.activeTheme.customizations,
    })),

  setTab: tab => set({ currentTab: tab }),

  // Deep-merges one level for nested objects (color/overlay/typography/timer).
  // Top-level merge alone would let `setPreview({ color: { accent } })` drop
  // `contrast`, so callers can patch a single nested field without re-reading
  // siblings out of stale closures.
  setPreview: patch =>
    set(s => ({
      preview: {
        ...s.preview,
        ...patch,
        color: patch.color ? { ...s.preview.color, ...patch.color } : s.preview.color,
        overlay: patch.overlay ? { ...s.preview.overlay, ...patch.overlay } : s.preview.overlay,
        typography: patch.typography
          ? { ...s.preview.typography, ...patch.typography }
          : s.preview.typography,
        timer: patch.timer ? { ...s.preview.timer, ...patch.timer } : s.preview.timer,
      },
    })),

  apply: () =>
    set(s => ({
      activeTheme: {
        ...s.activeTheme,
        customizations: s.preview,
        updatedAt: new Date().toISOString(),
      },
      isOpen: false,
    })),

  resetToDefault: () =>
    set(() => ({
      activeTheme: DEFAULT_THEME,
      preview: DEFAULT_CUSTOMIZATIONS,
    })),

  hydrate: theme => set({ activeTheme: theme, preview: theme.customizations }),
}))
