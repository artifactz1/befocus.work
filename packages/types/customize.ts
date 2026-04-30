// packages/types/customize.ts

export type BackgroundCustomization =
  | { kind: 'curated'; assetId: string }
  | { kind: 'upload'; mediaId: string; mediaType: 'image' | 'video' }
  | { kind: 'url'; url: string; mediaType: 'image' | 'video' }
  | { kind: 'solid'; color: string }

export type TypographyFamily = 'inter-tight' | 'editorial-serif' | 'mono' | 'display-sans'

export type RingStyle = 'dashed' | 'solid' | 'off'
export type Density = 'compact' | 'comfortable' | 'roomy'

export type Customizations = {
  background: BackgroundCustomization
  overlay: { color: string; opacity: number } // hsl, 0..1
  blur: number // 0..40
  grain: number // 0..1
  typography: { family: TypographyFamily }
  color: { accent: string; contrast: number } // hsl, 0..1
  timer: { ringStyle: RingStyle }
  density: Density
}

export type Theme = {
  id: string
  userId: string | null
  name: string
  isCurated: boolean
  version: 1
  customizations: Customizations
  createdAt: string
  updatedAt: string
}

export const DEFAULT_CUSTOMIZATIONS: Customizations = {
  background: { kind: 'solid', color: 'hsl(0 0% 6%)' },
  overlay: { color: 'hsl(0 0% 0%)', opacity: 0 },
  blur: 0,
  grain: 0.05,
  typography: { family: 'inter-tight' },
  color: { accent: 'hsl(12 6.5% 15.1%)', contrast: 1 },
  timer: { ringStyle: 'dashed' },
  density: 'comfortable',
}

export const DEFAULT_THEME: Theme = {
  id: 'default',
  userId: null,
  name: 'Default',
  isCurated: true,
  version: 1,
  customizations: DEFAULT_CUSTOMIZATIONS,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}
