'use client'

import { DEFAULT_LOOK, lookEquals } from '@repo/types/look'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import styles from '../customize-panel.module.css'

export default function ThemeSection() {
  const preview = useCustomizeStore(state => state.preview)
  const isDefault = lookEquals(preview, DEFAULT_LOOK)

  return (
    <>
      <div className={styles.current}>
        <span
          className={styles.thumb}
          style={{ backgroundColor: preview.bg.color, color: preview.accent }}
        >
          Aa
        </span>
        <div>
          <p className={styles.currentName}>{isDefault ? 'Default' : 'Custom look (unsaved)'}</p>
        </div>
      </div>
      <div className={styles.empty}>Presets and saved themes arrive later.</div>
    </>
  )
}
