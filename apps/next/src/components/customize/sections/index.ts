import type { ComponentType } from 'react'
import BackgroundSection from './BackgroundSection'
import ColorSection from './ColorSection'
import StyleSection from './StyleSection'
import ThemeSection from './ThemeSection'
import TypeSection from './TypeSection'

export type CustomizeSectionId = 'theme' | 'background' | 'type' | 'color' | 'style'

export const CUSTOMIZE_SECTIONS: {
  id: CustomizeSectionId
  label: string
  Component: ComponentType
}[] = [
  { id: 'theme', label: 'Theme', Component: ThemeSection },
  { id: 'background', label: 'Background', Component: BackgroundSection },
  { id: 'type', label: 'Type', Component: TypeSection },
  { id: 'color', label: 'Color', Component: ColorSection },
  { id: 'style', label: 'Style', Component: StyleSection },
]
