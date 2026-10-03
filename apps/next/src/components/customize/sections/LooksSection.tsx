'use client'

import { FONTS, LOOKS, lookName } from '~/lib/customize/catalog'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import { ControlGroup, PickCard } from '../controls'
import styles from '../customize-panel.module.css'

export default function LooksSection() {
  const preview = useCustomizeStore(state => state.preview)
  const patchPreview = useCustomizeStore(state => state.patchPreview)
  const current = lookName(preview)

  return (
    <ControlGroup id='customize-looks' label='Looks' value={current ?? 'Custom'}>
      <div className={styles.looks}>
        {LOOKS.map(({ name, look }) => (
          <PickCard
            key={name}
            name='look'
            value={name}
            checked={name === current}
            onChange={() => patchPreview(look)}
            label={`${name} look`}
            className={styles.lookCard}
          >
            <span className={styles.lookThumb} style={{ backgroundColor: look.bg.color }}>
              <i style={{ backgroundColor: look.accent }} />
              <b style={{ fontFamily: FONTS[look.font].stack }}>25</b>
            </span>
            <span className={styles.nm}>{name}</span>
          </PickCard>
        ))}
      </div>
    </ControlGroup>
  )
}
