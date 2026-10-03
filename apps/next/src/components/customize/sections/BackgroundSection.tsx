'use client'

import { DEFAULT_SOLID } from '@repo/types/look'
import { SOLIDS, solidName } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ColorField, ControlGroup, SwatchGroup } from '../controls'

// ponytail: overlay tint/opacity and blur stay in the Look schema but have no controls until
// image and video backgrounds land (Phase 5); on a solid they change nothing visible.
export default function BackgroundSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  const bgColor = preview.bg.color === DEFAULT_SOLID ? '#101010' : preview.bg.color

  return (
    <ControlGroup id='customize-background' label='Background' value={solidName(preview.bg.color)}>
      <SwatchGroup
        name='bg-solid'
        legend='Background'
        options={SOLIDS.map(solid => ({
          value: solid.color,
          label: solid.name,
          color: solid.color,
        }))}
        value={preview.bg.color}
        onChange={color => setPreview('bg', { kind: 'solid', color })}
      />
      <ColorField
        id='bg-custom'
        label='Custom'
        value={bgColor}
        onChange={hex => setPreview('bg', { kind: 'solid', color: hex })}
      />
    </ControlGroup>
  )
}
