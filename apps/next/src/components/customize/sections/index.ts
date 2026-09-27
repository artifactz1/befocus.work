import type { ComponentType } from 'react'
import BackgroundSection from './BackgroundSection'
import ThemeSection from './ThemeSection'

export type CustomizeSectionId = 'theme' | 'background' | 'type' | 'color' | 'style'

export const CUSTOMIZE_SECTIONS: {
  id: CustomizeSectionId
  label: string
  Component: ComponentType
}[] = [
  { id: 'theme', label: 'Theme', Component: ThemeSection },
  { id: 'background', label: 'Background', Component: BackgroundSection },
]
