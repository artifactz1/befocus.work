// ~/types/look.ts
import { z } from 'zod'

/** Exactly `#` plus 6 hex digits, case-insensitive, stored lowercase. */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform(value => value.toLowerCase())

/** D-05 locks this literal as the default solid background - the current dashboard color. */
export const DEFAULT_SOLID = 'hsl(0 0% 6.3%)'

/**
 * Union of the hex schema and the one allowed non-hex literal. This keeps the default
 * reproducible while still rejecting every other free-form string (CSS-injection guard).
 */
export const solidColorSchema = z.union([hexColorSchema, z.literal(DEFAULT_SOLID)])

/**
 * `bg.kind` is a discriminated union. Phase 2 implements only `solid`; `image`, `video` and
 * `url` variants join in Phases 5-6 (comment only, no stub variants here).
 */
export const bgSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('solid'), color: solidColorSchema }),
])

export const FONT_IDS = ['inter-tight', 'editorial-serif', 'mono', 'display-sans'] as const
export const PROGRESS_IDS = ['edge', 'ruler', 'ink', 'none'] as const
export const DENSITY_IDS = ['compact', 'comfortable', 'roomy'] as const

export const lookSchema = z
  .object({
    version: z.literal(1),
    bg: bgSchema,
    overlayColor: hexColorSchema,
    overlayOpacity: z.number().finite().min(0).max(1),
    blur: z.number().finite().min(0).max(40),
    font: z.enum(FONT_IDS),
    accent: hexColorSchema,
    contrast: z.number().finite().min(0.55).max(1),
    progress: z.enum(PROGRESS_IDS),
    density: z.enum(DENSITY_IDS),
    grain: z.number().finite().min(0).max(1),
  })
  .strict()

export type Look = z.infer<typeof lookSchema>
export type LookKey = Exclude<keyof Look, 'version'>

/**
 * The prototype's own `DEFAULT_LOOK` uses `bg.kind: 'none'`. D-05 overrides that: Phase 2's
 * default must be `kind: 'solid'` with the exact current background color, so the discriminated
 * union never has a "no background" state to special-case later.
 */
export const DEFAULT_LOOK: Look = {
  version: 1,
  bg: { kind: 'solid', color: DEFAULT_SOLID },
  overlayColor: '#000000',
  overlayOpacity: 0,
  blur: 0,
  font: 'inter-tight',
  accent: '#f5f5f4',
  contrast: 1,
  progress: 'edge',
  density: 'comfortable',
  grain: 0.05,
}

/** Explicit field comparison - key order in an object is not guaranteed, so no JSON.stringify. */
export function lookEquals(a: Look, b: Look): boolean {
  return (
    a.version === b.version &&
    a.bg.kind === b.bg.kind &&
    a.bg.color === b.bg.color &&
    a.overlayColor === b.overlayColor &&
    a.overlayOpacity === b.overlayOpacity &&
    a.blur === b.blur &&
    a.font === b.font &&
    a.accent === b.accent &&
    a.contrast === b.contrast &&
    a.progress === b.progress &&
    a.density === b.density &&
    a.grain === b.grain
  )
}
