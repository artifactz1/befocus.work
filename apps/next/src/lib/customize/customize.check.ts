// Runnable self-check for the Look contract and catalog (no test runner exists in this repo).
// Run with: bun run src/lib/customize/customize.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { DEFAULT_LOOK, lookEquals, lookSchema } from '@repo/types/look'
import { FONTS, lookToTokens } from './catalog'
import { computeTimerTransform } from './timer-scale'

// DEFAULT_LOOK passes lookSchema.safeParse
assert.equal(lookSchema.safeParse(DEFAULT_LOOK).success, true, 'DEFAULT_LOOK must parse')

// accent injection payload fails; too-short hex fails; valid hex passes and is lowercased
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, accent: 'red;background:url(x)' }).success,
  false,
  'CSS-injection accent must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, accent: '#FFF' }).success,
  false,
  '3-digit hex must fail',
)
{
  const result = lookSchema.safeParse({ ...DEFAULT_LOOK, accent: '#A1B2C3' })
  assert.equal(result.success, true, '6-digit hex must pass')
  assert.equal(result.success && result.data.accent, '#a1b2c3', 'accent must be stored lowercase')
}

// bg.kind is only 'solid' in Phase 2; bg.color literal default passes, other strings fail
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, bg: { kind: 'image' } }).success,
  false,
  'bg.kind image must fail (solid-only union in Phase 2)',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, bg: { kind: 'solid', color: 'hsl(0 0% 6.3%)' } }).success,
  true,
  'bg.color literal default must pass',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, bg: { kind: 'solid', color: 'not-a-color' } }).success,
  false,
  'bg.color non-hex non-literal must fail',
)

// numeric ranges
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, contrast: 0.3 }).success,
  false,
  'contrast below floor must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, contrast: 0.55 }).success,
  true,
  'contrast at floor must pass',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, overlayOpacity: 1.2 }).success,
  false,
  'overlayOpacity above max must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, blur: 41 }).success,
  false,
  'blur above max must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, grain: -0.1 }).success,
  false,
  'grain below min must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, grain: Number.NaN }).success,
  false,
  'NaN must fail (.finite())',
)

// enums and version
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, font: 'comic-sans' }).success,
  false,
  'unknown font must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, progress: 'ring' }).success,
  false,
  'unknown progress must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, density: 'huge' }).success,
  false,
  'unknown density must fail',
)
assert.equal(
  lookSchema.safeParse({ ...DEFAULT_LOOK, version: 2 }).success,
  false,
  'version other than 1 must fail',
)

// lookEquals
assert.equal(
  lookEquals(DEFAULT_LOOK, structuredClone(DEFAULT_LOOK)),
  true,
  'a clone must equal the original',
)
assert.equal(
  lookEquals(DEFAULT_LOOK, { ...DEFAULT_LOOK, accent: '#000000' }),
  false,
  'changing only accent must make it unequal',
)
assert.equal(
  lookEquals(DEFAULT_LOOK, { ...DEFAULT_LOOK, bg: { kind: 'solid', color: '#000000' } }),
  false,
  'changing only bg.color must make it unequal',
)

// lookToTokens
{
  const { props, attrs } = lookToTokens(DEFAULT_LOOK)
  const propKeys = Object.keys(props).sort()
  assert.deepEqual(
    propKeys,
    [
      '--bg-blur',
      '--bg-overlay-color',
      '--bg-overlay-opacity',
      '--bg-solid',
      '--font-display',
      '--grain-opacity',
      '--text-contrast',
      '--user-accent',
    ].sort(),
    'lookToTokens must return exactly the 8 custom properties',
  )
  assert.deepEqual(
    Object.keys(attrs).sort(),
    ['data-density', 'data-progress'].sort(),
    'lookToTokens must return exactly the 2 attributes',
  )
  assert.equal(
    props['--font-display'],
    FONTS[DEFAULT_LOOK.font].stack,
    '--font-display must come from the FONTS catalog, never the raw key',
  )
}

// computeTimerTransform: translate only, never scale
assert.deepEqual(
  computeTimerTransform({ panelOpen: false, vw: 1440, vh: 900, centerY: 450 }),
  { tx: 0, ty: 0, scale: 1 },
  'closed panel must return identity',
)

for (const [vw, vh] of [
  [1920, 1080],
  [1440, 900],
  [1024, 640],
  [390, 844],
  [200, 200],
] as const) {
  const { scale } = computeTimerTransform({ panelOpen: true, vw, vh, centerY: vh / 2 })
  assert.equal(scale, 1, `${vw}x${vh} must never scale the timer`)
}

// desktop: centre in the area left of the 520px dock
assert.equal(
  computeTimerTransform({ panelOpen: true, vw: 1440, vh: 900, centerY: 450 }).tx,
  -260,
  '1440x900 tx must be -260',
)

// mobile: rise above the 60dvh sheet
assert.ok(
  Math.abs(computeTimerTransform({ panelOpen: true, vw: 390, vh: 844, centerY: 422 }).ty - -253.2) <
    0.5,
  '390x844 ty must be about -253.2',
)

console.log('customize.check OK')
