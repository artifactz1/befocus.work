'use client'

import { useEffect } from 'react'
import { useCustomizeStore } from '~/store/useCustomizeStore'

/**
 * Subscribes to active+preview state. While panel is open, applies preview;
 * otherwise applies active. Writes to <html> as CSS vars + data attrs.
 *
 * Mount once near the dashboard root.
 */
export default function CustomizeStyleApplier() {
  const isOpen = useCustomizeStore(s => s.isOpen)
  const preview = useCustomizeStore(s => s.preview)
  const active = useCustomizeStore(s => s.activeTheme.customizations)
  const isHydrated = useCustomizeStore(s => s.isHydrated)
  const hydrateFromStorage = useCustomizeStore(s => s.hydrateFromStorage)

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    if (!isHydrated) hydrateFromStorage()
  }, [isHydrated, hydrateFromStorage])

  // Store mutations always produce fresh references; this derived `c`
  // flips identity on every meaningful change so the effect dep array works.
  const c = isOpen ? preview : active

  useEffect(() => {
    // Don't write defaults to <html> until hydration completes — prevents
    // a flash of default values before the user's saved theme loads.
    if (!isHydrated) return

    const root = document.documentElement
    root.style.setProperty('--accent', stripHsl(c.color.accent))
    root.style.setProperty('--text-contrast', String(c.color.contrast))
    root.style.setProperty('--grain-opacity', String(c.grain))
    root.style.setProperty('--bg-overlay-color', stripHsl(c.overlay.color))
    root.style.setProperty('--bg-overlay-opacity', String(c.overlay.opacity))
    root.style.setProperty('--bg-blur', `${c.blur}px`)

    if (c.background.kind === 'curated') {
      root.style.setProperty('--bg-image', `url('/backgrounds/${c.background.assetId}.jpg')`)
    } else if (c.background.kind === 'url') {
      root.style.setProperty('--bg-image', `url('${c.background.url}')`)
    } else {
      root.style.setProperty('--bg-image', 'none')
    }

    root.dataset.ringStyle = c.timer.ringStyle
    root.dataset.density = c.density
    root.dataset.fontFamily = c.typography.family
  }, [c, isHydrated])

  return null
}

function stripHsl(v: string) {
  const m = v.match(/^hsl\(([^)]+)\)$/i)
  return m?.[1] ? m[1].trim() : v
}
