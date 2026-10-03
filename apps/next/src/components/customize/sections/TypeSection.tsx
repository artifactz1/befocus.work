'use client'

import { FONTS } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ControlGroup, PickCard } from '../controls'
import styles from '../customize-panel.module.css'

export default function TypeSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup id='customize-typeface' label='Typeface' value={FONTS[preview.font].label}>
      <div className={styles.picks}>
        {Object.entries(FONTS).map(([id, font]) => (
          <PickCard
            key={id}
            name='font'
            value={id}
            checked={id === preview.font}
            onChange={value => setPreview('font', value as typeof preview.font)}
            label={font.label}
          >
            <span className={styles.big} aria-hidden style={{ fontFamily: font.stack }}>
              25:00
            </span>
            <span className={styles.nm} aria-hidden>
              {font.label}
            </span>
          </PickCard>
        ))}
      </div>
    </ControlGroup>
  )
}
