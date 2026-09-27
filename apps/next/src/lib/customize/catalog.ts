import type { Look } from '@repo/types/look'

/** 8 solid backgrounds (CTL-01), exact values from the accepted prototype. */
export const SOLIDS = [
  { name: 'Ink', color: '#0f0f0f' },
  { name: 'Stone', color: '#1c1b19' },
  { name: 'Slate', color: '#1a1d23' },
  { name: 'Moss', color: '#111a13' },
  { name: 'Plum', color: '#1f1420' },
  { name: 'Umber', color: '#241a12' },
  { name: 'Night', color: '#0d1420' },
  { name: 'Paper dark', color: '#1f1d1a' },
] as const

/** 12 accent colors (CTL-05), exact values from the accepted prototype. */
export const ACCENTS = [
  '#f5f5f4',
  '#fca5a5',
  '#fdba74',
  '#fcd34d',
  '#bef264',
  '#86efac',
  '#5eead4',
  '#7dd3fc',
  '#93c5fd',
  '#c4b5fd',
  '#f0abfc',
  '#fda4af',
] as const

/**
 * 4 fonts (CTL-04). UI-SPEC lists the literal family names (e.g. 'Fraunces'), but next/font
 * rewrites family names to hashed ones, so these stacks reference the next/font CSS variables
 * declared in the root layout instead of the literal names.
 */
export const FONTS: Record<Look['font'], { label: string; stack: string }> = {
  'inter-tight': { label: 'Inter Tight', stack: 'var(--font-app), system-ui, sans-serif' },
  'editorial-serif': {
    label: 'Editorial serif',
    stack: 'var(--font-fraunces), Georgia, serif',
  },
  mono: { label: 'Mono', stack: 'var(--font-jetbrains-mono), ui-monospace, monospace' },
  'display-sans': {
    label: 'Display sans',
    stack: 'var(--font-space-grotesk), system-ui, sans-serif',
  },
}

/** 4 progress styles (CTL-07), ordered as shown in the panel's Style section. */
export const PROGRESS_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'ruler', label: 'Ruler' },
  { id: 'ink', label: 'Ink' },
  { id: 'edge', label: 'Edge' },
] as const

/** 3 densities (CTL-08). Numeric scale factors live in CSS (Task 3), not here. */
export const DENSITIES = [
  { id: 'compact', label: 'Compact' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'roomy', label: 'Roomy' },
] as const

export function lookToTokens(look: Look): {
  props: Record<string, string>
  attrs: { 'data-progress': string; 'data-density': string }
} {
  return {
    props: {
      '--bg-solid': look.bg.color,
      '--bg-overlay-color': look.overlayColor,
      '--bg-overlay-opacity': String(look.overlayOpacity),
      '--bg-blur': `${look.blur}px`,
      '--user-accent': look.accent,
      '--text-contrast': String(look.contrast),
      '--grain-opacity': String(look.grain),
      '--font-display': FONTS[look.font].stack,
    },
    attrs: {
      'data-progress': look.progress,
      'data-density': look.density,
    },
  }
}
