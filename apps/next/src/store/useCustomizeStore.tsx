'use client'

import type { Customizations, Theme } from '@repo/types/customize'
import { DEFAULT_CUSTOMIZATIONS, DEFAULT_THEME } from '@repo/types/customize'
import { create } from 'zustand'

type CustomizeTab = 'theme' | 'background' | 'type' | 'color' | 'style'

type CustomizeStore = {
  activeTheme: Theme
  preview: Customizations
  isOpen: boolean
  currentTab: CustomizeTab

  open: (tab?: CustomizeTab) => void
  close: () => void
  setTab: (tab: CustomizeTab) => void
  setPreview: (patch: Partial<Customizations>) => void
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

  setPreview: patch => set(s => ({ preview: { ...s.preview, ...patch } })),

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
