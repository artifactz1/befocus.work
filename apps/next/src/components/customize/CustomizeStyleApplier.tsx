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
  const isOpen = useCustomizeStore((s) => s.isOpen)
  const preview = useCustomizeStore((s) => s.preview)
  const active = useCustomizeStore((s) => s.activeTheme.customizations)
  // Store actions always produce fresh references for `preview` / `activeTheme.customizations`,
  // so this derived `c` flips identity on every meaningful change → useEffect dep array works.
  const c = isOpen ? preview : active

  useEffect(() => {
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
  }, [c])

  return null
}

function stripHsl(v: string) {
  const m = v.match(/^hsl\(([^)]+)\)$/i)
  return m?.[1] ? m[1].trim() : v
}
