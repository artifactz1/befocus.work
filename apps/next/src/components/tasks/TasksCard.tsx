'use client'

import { Drawer, DrawerPortal } from '@repo/ui/drawer'
import { cn } from '@repo/ui/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { type KeyboardEvent, useRef } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { usePlanBootstrap } from '~/hooks/usePlan'
import { useDeckCard, useDeckStore } from '~/store/useDeckStore'
import records from '../records/records.module.css'
import ListTab from './ListTab'
import PlanTab from './PlanTab'
import styles from './tasks.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const TAB_LIST =
  'flex h-auto w-full justify-stretch gap-1 rounded-xl border border-[color:var(--panel-hair)] bg-[color:var(--panel-soft)] p-1'
const TAB =
  'flex-1 rounded-lg px-0 py-1 text-[13px] font-normal text-[color:var(--panel-muted)] data-[state=active]:bg-[color:var(--panel-lift)] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_0_0_1px_var(--panel-hair)]'

function TasksTabs() {
  const tab = useDeckStore(s => s.tasksTab)
  const setTab = useDeckStore(s => s.setTasksTab)
  return (
    <Tabs value={tab} onValueChange={v => setTab(v === 'plan' ? 'plan' : 'list')}>
      <TabsList className={TAB_LIST}>
        <TabsTrigger className={TAB} value='list'>
          List
        </TabsTrigger>
        <TabsTrigger className={TAB} value='plan'>
          Plan
        </TabsTrigger>
      </TabsList>
      <TabsContent className='mt-4' value='list'>
        <ListTab />
      </TabsContent>
      <TabsContent className='mt-4' value='plan'>
        <PlanTab />
      </TabsContent>
    </Tabs>
  )
}

const TABBABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

function Head() {
  const closeDeck = useDeckStore(s => s.closeDeck)
  return (
    <div className={records.head}>
      <h2 id='tasks-heading' className={records.heading} tabIndex={-1}>
        Tasks
      </h2>
      <button type='button' className={records.close} aria-label='Close tasks' onClick={closeDeck}>
        <X aria-hidden='true' />
      </button>
    </div>
  )
}

export default function TasksCard() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { open: isOpen, setOpen } = useDeckCard({
    card: 'tasks',
    headingId: 'tasks-heading',
    triggerSelector: '[data-tasks-trigger]',
    rerunFocusOn: isDesktop,
  })
  usePlanBootstrap()
  const reducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)

  const onSheetKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !contentRef.current) return
    const tabbable = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
    ).filter(el => el.offsetParent !== null)
    const first = tabbable[0]
    const last = tabbable[tabbable.length - 1]
    if (!first || !last) return
    const active = document.activeElement

    if (event.shiftKey) {
      if (active === first || active?.id === 'tasks-heading') {
        event.preventDefault()
        last.focus()
      }
    } else if (active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (isDesktop) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className={cn(records.surface, records.room, styles.card)}
            role='dialog'
            aria-modal='false'
            aria-labelledby='tasks-heading'
            data-tasks-card
            data-deck-card
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
          >
            <Head />
            <div className={cn(records.body, styles.body)}>
              <TasksTabs />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    )
  }

  return (
    <Drawer
      open={isOpen}
      modal={false}
      shouldScaleBackground={false}
      handleOnly
      onOpenChange={setOpen}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          ref={contentRef}
          className={cn(records.surface, records.sheet, styles.card)}
          aria-labelledby='tasks-heading'
          aria-describedby={undefined}
          data-tasks-card
          data-deck-card
          onCloseAutoFocus={e => e.preventDefault()}
          onKeyDown={onSheetKeyDown}
        >
          <DrawerPrimitive.Title asChild>
            <span aria-hidden className='sr-only' />
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Handle preventCycle aria-hidden className={records.grab} />
          <Head />
          <div className={cn(records.body, styles.body)}>
            <TasksTabs />
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
