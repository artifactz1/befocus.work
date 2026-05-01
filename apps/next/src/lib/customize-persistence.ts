import type { Theme } from '@repo/types/customize'
import { DEFAULT_THEME } from '@repo/types/customize'

const ACTIVE_KEY = 'befocus.activeTheme'

export function loadActiveTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return DEFAULT_THEME
    const parsed = JSON.parse(raw)
    // Future versions can't be safely interpreted by v1 code; surface to console
    // (so a user rolling back from a beta build sees why their theme reset).
    if (parsed?.version && parsed.version !== 1) {
      console.warn(
        `[befocus] Discarding stored theme with unsupported version ${parsed.version}; resetting to default.`,
      )
      return DEFAULT_THEME
    }
    if (parsed?.version !== 1) return DEFAULT_THEME
    // Shape check — guards against corrupt or hand-edited localStorage entries
    // that would otherwise crash the applier on `c.color.accent` etc.
    if (!parsed.customizations || typeof parsed.customizations !== 'object') {
      return DEFAULT_THEME
    }
    return parsed as Theme
  } catch {
    return DEFAULT_THEME
  }
}

export function saveActiveTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(theme))
  } catch {
    // Quota or disabled storage — silently ignore in v1.
  }
}

export function clearActiveTheme() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_KEY)
}
