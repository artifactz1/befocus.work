import { DEFAULT_SOLID, type Look } from '@repo/types/look'

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

/** 5 starter looks. Picking one sets only bg, accent and font; the other fields stay as they are. */
export const LOOKS: { name: string; look: Pick<Look, 'bg' | 'accent' | 'font'> }[] = [
  {
    name: 'Default',
    look: { bg: { kind: 'solid', color: DEFAULT_SOLID }, accent: '#f5f5f4', font: 'inter-tight' },
  },
  {
    name: 'Paper',
    look: { bg: { kind: 'solid', color: '#1f1d1a' }, accent: '#fdba74', font: 'editorial-serif' },
  },
  {
    name: 'Moss',
    look: { bg: { kind: 'solid', color: '#111a13' }, accent: '#86efac', font: 'display-sans' },
  },
  {
    name: 'Night',
    look: { bg: { kind: 'solid', color: '#0d1420' }, accent: '#93c5fd', font: 'mono' },
  },
  {
    name: 'Plum',
    look: { bg: { kind: 'solid', color: '#1f1420' }, accent: '#f0abfc', font: 'inter-tight' },
  },
]

/** Name of the starter look `look` currently matches, or undefined for a custom mix. */
export function lookName(look: Look): string | undefined {
  return LOOKS.find(
    preset =>
      preset.look.bg.color === look.bg.color &&
      preset.look.accent === look.accent &&
      preset.look.font === look.font,
  )?.name
}

/** Name of the solid `color` matches: a catalog name, 'Default', or 'Custom'. */
export function solidName(color: string): string {
  if (color === DEFAULT_SOLID) return 'Default'
  return SOLIDS.find(solid => solid.color === color)?.name ?? 'Custom'
}

/** 4 progress styles (CTL-07), ordered as shown in the panel's Timer progress group. */
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
