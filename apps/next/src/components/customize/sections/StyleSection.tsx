'use client'

import { DENSITIES, PROGRESS_STYLES } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ControlGroup, RangeField, SegmentedControl } from '../controls'

const PROGRESS_ORDER = ['edge', 'ruler', 'ink', 'none'] as const

export default function StyleSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  const progressOptions = PROGRESS_ORDER.map(id => ({
    value: id,
    label: PROGRESS_STYLES.find(style => style.id === id)?.label ?? id,
  }))

  return (
    <>
      <ControlGroup label='Progress'>
        <SegmentedControl
          name='progress'
          legend='Progress'
          options={progressOptions}
          value={preview.progress}
          onChange={value => setPreview('progress', value as typeof preview.progress)}
        />
      </ControlGroup>

      <ControlGroup label='Density'>
        <SegmentedControl
          name='density'
          legend='Density'
          options={DENSITIES.map(density => ({ value: density.id, label: density.label }))}
          value={preview.density}
          onChange={value => setPreview('density', value as typeof preview.density)}
        />
      </ControlGroup>

      <ControlGroup label='Atmosphere'>
        <RangeField
          id='grain'
          label='Grain'
          min={0}
          max={1}
          step={0.01}
          value={preview.grain}
          format={value => `${Math.round(value * 100)}%`}
          onChange={value => setPreview('grain', value)}
        />
      </ControlGroup>
    </>
  )
}
