'use client'

import switchStyles from '~/components/settings/session-card.module.css'
import { DENSITIES, PROGRESS_STYLES, SESSION_PROGRESS } from '~/lib/customize/catalog'
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

export function SessionProgressSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup
      id='customize-session-progress'
      label='Session progress'
      value={SESSION_PROGRESS.find(view => view.id === preview.sessionProgress)?.label}
    >
      <SegmentedControl
        name='sessionProgress'
        legend='Session progress'
        options={SESSION_PROGRESS.map(view => ({ value: view.id, label: view.label }))}
        value={preview.sessionProgress}
        onChange={value => setPreview('sessionProgress', value as typeof preview.sessionProgress)}
      />
      <p style={{ fontSize: 13, lineHeight: 1.4, marginTop: 8, opacity: 0.6 }}>
        You can also tap the progress area on the timer screen.
      </p>
    </ControlGroup>
  )
}

export function BreakLogSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup
      id='customize-break-log'
      label='Break log'
      value={preview.askAtBreak ? 'On' : 'Off'}
    >
      <button
        type='button'
        role='switch'
        aria-checked={preview.askAtBreak}
        className={switchStyles.switch}
        onClick={() => setPreview('askAtBreak', !preview.askAtBreak)}
      >
        <span className={switchStyles.track} aria-hidden />
        Ask what got done at each break
      </button>
      <p style={{ fontSize: 13, lineHeight: 1.4, marginTop: 8, opacity: 0.6 }}>
        The summary at the end of a session always shows.
      </p>
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
