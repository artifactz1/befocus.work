import type { ComponentType } from 'react'
import AccentSection from './AccentSection'
import BackgroundSection from './BackgroundSection'
import LooksSection from './LooksSection'
import { DensitySection, FinishSection, ProgressSection } from './StyleSection'
import TypeSection from './TypeSection'

/** The panel's single list, top to bottom. `chip` marks the groups the phone jump row lists. */
export const CUSTOMIZE_SECTIONS: { id: string; chip?: string; Component: ComponentType }[] = [
  { id: 'customize-looks', chip: 'Looks', Component: LooksSection },
  { id: 'customize-background', chip: 'Background', Component: BackgroundSection },
  { id: 'customize-typeface', chip: 'Typeface', Component: TypeSection },
  { id: 'customize-accent', chip: 'Accent', Component: AccentSection },
  { id: 'customize-progress', chip: 'Timer', Component: ProgressSection },
  { id: 'customize-density', Component: DensitySection },
  { id: 'customize-finish', Component: FinishSection },
]
