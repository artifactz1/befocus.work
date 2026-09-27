'use client'

import { DEFAULT_SOLID } from '@repo/types/look'
import { SOLIDS } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ColorField, ControlGroup, RangeField, SwatchGroup } from '../controls'

export default function BackgroundSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  const bgColor = preview.bg.color === DEFAULT_SOLID ? '#101010' : preview.bg.color

  return (
    <>
      <ControlGroup label='Background'>
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
          label='Custom color'
          value={bgColor}
          onChange={hex => setPreview('bg', { kind: 'solid', color: hex })}
        />
      </ControlGroup>

      <ControlGroup label='Overlay' hint='Tints the background for legibility'>
        <ColorField
          id='overlay-tint'
          label='Overlay tint'
          value={preview.overlayColor}
          onChange={hex => setPreview('overlayColor', hex)}
        />
        <RangeField
          id='overlay-opacity'
          label='Overlay opacity'
          min={0}
          max={1}
          step={0.01}
          value={preview.overlayOpacity}
          format={value => `${Math.round(value * 100)}%`}
          onChange={value => setPreview('overlayOpacity', value)}
        />
      </ControlGroup>

      <ControlGroup label='Blur'>
        <RangeField
          id='blur'
          label='Blur'
          min={0}
          max={40}
          step={1}
          value={preview.blur}
          format={value => `${value}px`}
          onChange={value => setPreview('blur', value)}
          hint='Only visible on image and video backgrounds'
        />
      </ControlGroup>
    </>
  )
}
