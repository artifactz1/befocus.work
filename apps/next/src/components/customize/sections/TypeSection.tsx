'use client'

import { FONTS } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ControlGroup, PickCard } from '../controls'
import styles from '../customize-panel.module.css'

export default function TypeSection() {
  const preview = useCustomizeStore(state => state.preview)
  const setPreview = useCustomizeStore(state => state.setPreview)

  return (
    <ControlGroup
      label='Font'
      hint='Applies to the timer, session title and dashboard text. Panels and menus keep Inter Tight.'
    >
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
              17:42
            </span>
          </PickCard>
        ))}
      </div>
    </ControlGroup>
  )
}
