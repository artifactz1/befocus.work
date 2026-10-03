'use client'

import { DENSITIES, PROGRESS_STYLES } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ControlGroup, PickCard, RangeField, SegmentedControl } from '../controls'
import styles from '../customize-panel.module.css'

const PROGRESS_ORDER = ['none', 'ruler', 'ink', 'edge'] as const

export function ProgressSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup
      id='customize-progress'
      label='Timer progress'
      value={PROGRESS_STYLES.find(style => style.id === preview.progress)?.label}
    >
      <div className={styles.progs}>
        {PROGRESS_ORDER.map(id => {
          const label = PROGRESS_STYLES.find(style => style.id === id)?.label ?? id
          return (
            <PickCard
              key={id}
              name='progress'
              value={id}
              checked={id === preview.progress}
              onChange={value => setPreview('progress', value as typeof preview.progress)}
              label={label}
              className={styles.progCard}
            >
              <i className={styles.progGlyph} data-style={id} aria-hidden />
              <span className={styles.nm} aria-hidden>
                {label}
              </span>
            </PickCard>
          )
        })}
      </div>
    </ControlGroup>
  )
}

export function DensitySection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup id='customize-density' label='Density'>
      <SegmentedControl
        name='density'
        legend='Density'
        options={DENSITIES.map(density => ({ value: density.id, label: density.label }))}
        value={preview.density}
        onChange={value => setPreview('density', value as typeof preview.density)}
      />
    </ControlGroup>
  )
}

export function FinishSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup id='customize-finish' label='Finish'>
      <RangeField
        id='contrast'
        label='Text contrast'
        min={0.55}
        max={1}
        step={0.01}
        value={preview.contrast}
        format={value => `${Math.round(value * 100)}%`}
        onChange={value => setPreview('contrast', value)}
      />
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
  )
}
