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

// computeTimerTransform (D-20, UX-05)
const EPS = 0.01

// closed panel returns identity regardless of viewport
assert.deepEqual(
  computeTimerTransform({ panelOpen: false, vw: 1440, vh: 900, timerW: 838, timerH: 250, centerY: 450 }),
  { tx: 0, ty: 0, scale: 1 },
  'closed panel must return identity',
)

// 1440x900: centred scale about .42
{
  const { tx, ty, scale } = computeTimerTransform({
    panelOpen: true,
    vw: 1440,
    vh: 900,
    timerW: 838,
    timerH: 250,
    centerY: 450,
  })
  assert.equal(tx, 0, '1440x900 must not translate x')
  assert.equal(ty, 0, '1440x900 must not translate y')
  assert.ok(Math.abs(scale - 0.42) < 0.005, `1440x900 scale must be within 0.005 of 0.42, got ${scale}`)
}

// 1920x1080: cap at exactly 0.72, centred
{
  const { tx, ty, scale } = computeTimerTransform({
    panelOpen: true,
    vw: 1920,
    vh: 1080,
    timerW: 1006,
    timerH: 300,
    centerY: 540,
  })
  assert.equal(tx, 0, '1920x1080 must not translate x')
  assert.equal(ty, 0, '1920x1080 must not translate y')
  assert.equal(scale, 0.72, '1920x1080 scale must hit the 0.72 cap exactly')
}

// 1024x640: narrow-desktop fallback, tx -260, scale 0.72
{
  const { tx, scale } = computeTimerTransform({
    panelOpen: true,
    vw: 1024,
    vh: 640,
    timerW: 596,
    timerH: 178,
    centerY: 320,
  })
  assert.equal(tx, -260, '1024x640 fallback tx must be -260')
  assert.equal(scale, 0.72, '1024x640 fallback scale must hit the 0.72 cap')
}

// 1280x800: centred would be about .26 (below the 0.4 floor), so fallback also applies
{
  const { tx, scale } = computeTimerTransform({
    panelOpen: true,
    vw: 1280,
    vh: 800,
    timerW: 745,
    timerH: 222,
    centerY: 400,
  })
  assert.equal(tx, -260, '1280x800 fallback tx must be -260')
  assert.equal(scale, 0.72, '1280x800 fallback scale must hit the 0.72 cap')
}

// 390x844 mobile: rise above the sheet, scale 0.72, ty within 0.5 of -253.2
{
  const { tx, ty, scale } = computeTimerTransform({
    panelOpen: true,
    vw: 390,
    vh: 844,
    timerW: 350,
    timerH: 250,
    centerY: 422,
  })
  assert.equal(tx, 0, '390x844 must not translate x')
  assert.ok(Math.abs(ty - -253.2) < 0.5, `390x844 ty must be within 0.5 of -253.2, got ${ty}`)
  assert.equal(scale, 0.72, '390x844 scale must hit the 0.72 cap')
}

// an unmeasured timer (0 width or height) returns identity even while open
assert.deepEqual(
  computeTimerTransform({ panelOpen: true, vw: 1440, vh: 900, timerW: 0, timerH: 250, centerY: 450 }),
  { tx: 0, ty: 0, scale: 1 },
  'zero timerW must return identity',
)
assert.deepEqual(
  computeTimerTransform({ panelOpen: true, vw: 1440, vh: 900, timerW: 838, timerH: 0, centerY: 450 }),
  { tx: 0, ty: 0, scale: 1 },
  'zero timerH must return identity',
)

// a tiny viewport never returns scale <= 0 (floor 0.2)
{
  const { scale } = computeTimerTransform({
    panelOpen: true,
    vw: 200,
    vh: 200,
    timerW: 500,
    timerH: 500,
    centerY: 100,
  })
  assert.ok(scale >= 0.2 - EPS, `tiny viewport scale must be floored at 0.2, got ${scale}`)
}

console.log('customize.check OK')
