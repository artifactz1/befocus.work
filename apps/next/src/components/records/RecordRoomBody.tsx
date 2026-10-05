'use client'

import { X } from 'lucide-react'
import { useSoundsStore } from '~/store/useSoundsStore'
import panel from '../customize/customize-panel.module.css'
import styles from './records.module.css'

export default function RecordRoomBody() {
  const setRoomOpen = useSoundsStore(state => state.setRoomOpen)

  return (
    <>
      <div className={panel.head}>
        <h2 id='records-heading' className={panel.heading} tabIndex={-1}>
          Records
        </h2>
        <p className={styles.status} aria-live='polite' />
        <button
          type='button'
          className={panel.closeBtn}
          aria-label='Close records'
          onClick={() => setRoomOpen(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div className={styles.body} />
    </>
  )
}
