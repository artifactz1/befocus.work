'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import CustomizePanelBody from './CustomizePanelBody'
import styles from './customize-panel.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const

export default function CustomizePanelDesktop() {
  const panelOpen = useCustomizeStore(state => state.panelOpen)
  const reducedMotion = useReducedMotion()
  const duration = reducedMotion ? 0 : 0.45

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.aside
          className={`${styles.panel} ${styles.inspector}`}
          role='dialog'
          aria-modal='false'
          aria-labelledby='customize-heading'
          data-customize-panel
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration, ease: EASE }}
        >
          <CustomizePanelBody variant='desktop' />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
