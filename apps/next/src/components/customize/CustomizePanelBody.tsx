'use client'

import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { selectIsDefault, selectIsDirty, useCustomizeStore } from '~/store/useCustomizeStore'
import styles from './customize-panel.module.css'
import { CUSTOMIZE_SECTIONS, type CustomizeSectionId } from './sections'
import { useCustomizeActions } from './useCustomizeActions'

const LIST_RESET = 'flex h-auto justify-start rounded-none bg-transparent p-0 text-inherit'
const TAB_RESET =
  'rounded-none bg-transparent px-0 py-0 text-inherit font-normal shadow-none data-[state=active]:bg-transparent data-[state=active]:text-inherit data-[state=active]:shadow-none'

export default function CustomizePanelBody() {
  const [sectionId, setSectionId] = useState<CustomizeSectionId>('theme')
  const resetPreview = useCustomizeStore(state => state.resetPreview)
  const isDirty = useCustomizeStore(selectIsDirty)
  const isDefault = useCustomizeStore(selectIsDefault)
  const { apply, discard } = useCustomizeActions()

  const pinged = useRef(false)

  useEffect(() => {
    if (!isDirty) {
      pinged.current = false
    }
  }, [isDirty])

  const showPing = isDirty && !pinged.current
  useEffect(() => {
    if (showPing) {
      pinged.current = true
    }
  }, [showPing])

  return (
    <>
      <div className={styles.head}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id='customize-heading' className={styles.heading} tabIndex={-1}>
            Customize
          </h2>
          <button
            type='button'
            className={styles.closeBtn}
            aria-label='Close (cancel)'
            onClick={discard}
          >
            <X size={18} />
          </button>
        </div>
        {isDirty && (
          <div className={styles.dirty}>
            <span className={styles.dot} data-ping={showPing ? 'true' : 'false'} />
            Previewing changes
          </div>
        )}
      </div>

      <Tabs value={sectionId} onValueChange={value => setSectionId(value as typeof sectionId)}>
        <TabsList aria-label='Customize sections' className={`${LIST_RESET} ${styles.tabs}`}>
          {CUSTOMIZE_SECTIONS.map(section => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className={`${TAB_RESET} ${styles.chip}`}
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CUSTOMIZE_SECTIONS.map(section => (
          <TabsContent key={section.id} value={section.id} className='mt-0'>
            <div className={styles.body} key={section.id}>
              <section.Component />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className={styles.foot}>
        <Button type='button' variant='ghost' onClick={resetPreview} disabled={isDefault}>
          Reset to default
        </Button>
        <div className={styles.footRight}>
          <Button type='button' variant='ghost' onClick={discard}>
            Cancel
          </Button>
          <Button type='button' variant='default' onClick={apply} disabled={!isDirty}>
            Apply
          </Button>
        </div>
      </div>
    </>
  )
}
