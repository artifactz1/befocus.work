'use client'

import { ACCENTS } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ColorField, ControlGroup, SwatchGroup } from '../controls'

export default function AccentSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup id='customize-accent' label='Accent'>
      <SwatchGroup
        name='accent'
        legend='Accent'
        variant='accent'
        options={ACCENTS.map(hex => ({ value: hex, label: `Accent ${hex}`, color: hex }))}
        value={preview.accent}
        onChange={hex => setPreview('accent', hex)}
      />
      <ColorField
        id='accent-custom'
        label='Custom'
        value={preview.accent}
        onChange={hex => setPreview('accent', hex.toLowerCase())}
      />
    </ControlGroup>
  )
}
