'use client'

import { ACCENTS } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ColorField, ControlGroup, RangeField, SwatchGroup } from '../controls'

export default function ColorSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <>
      <ControlGroup label='Accent' hint='Used for the timer progress and the session grid'>
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
          label='Custom accent'
          value={preview.accent}
          onChange={hex => setPreview('accent', hex.toLowerCase())}
        />
      </ControlGroup>

      <ControlGroup label='Text'>
        <RangeField
          id='contrast'
          label='Text contrast'
          min={0.55}
          max={1}
          step={0.01}
          value={preview.contrast}
          format={value => `${Math.round(value * 100)}%`}
          onChange={value => setPreview('contrast', value)}
          hint='Lower = softer, dimmer digits'
        />
      </ControlGroup>
    </>
  )
}
