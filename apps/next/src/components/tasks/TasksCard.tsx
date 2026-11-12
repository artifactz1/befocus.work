'use client'

import { Drawer, DrawerPortal } from '@repo/ui/drawer'
import { cn } from '@repo/ui/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { usePlanBootstrap, usePlanSync } from '~/hooks/usePlan'
import { type TasksTab, useDeckCard, useDeckStore } from '~/store/useDeckStore'
import { useTasksStore } from '~/store/useToDoStore'
import { BreakLogModal } from '../logs/BreakLogModal'
import { LogView } from '../logs/LogView'
import records from '../records/records.module.css'
import ListTab from './ListTab'
import PlanTab from './PlanTab'
import { PANEL_NAME } from './TasksButton'
import styles from './tasks.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const TAB_LIST =
  'flex h-auto w-full justify-stretch gap-1 rounded-xl border border-[color:var(--panel-hair)] bg-[color:var(--panel-soft)] p-1'
const TAB =
  'flex-1 rounded-lg px-0 py-1 text-[13px] font-normal text-[color:var(--panel-muted)] data-[state=active]:bg-[color:var(--panel-lift)] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_0_0_1px_var(--panel-hair)]'

const isTab = (v: string): v is TasksTab => v === 'list' || v === 'plan' || v === 'log'

function TasksTabs() {
  const tab = useDeckStore(s => s.tasksTab)
  const setTab = useDeckStore(s => s.setTasksTab)
  return (
    <Tabs
      className={cn('flex flex-col', tab === 'log' && 'h-full')}
      value={tab}
      onValueChange={v => isTab(v) && setTab(v)}
    >
      <TabsList className={TAB_LIST}>
        <TabsTrigger className={TAB} value='list'>
          List
        </TabsTrigger>
        <TabsTrigger className={TAB} value='plan'>
          Plan
        </TabsTrigger>
        <TabsTrigger className={TAB} value='log'>
          Log
        </TabsTrigger>
      </TabsList>
      <TabsContent className='mt-4' value='list'>
        <ListTab />
      </TabsContent>
      <TabsContent className='mt-4' value='plan'>
        <PlanTab />
      </TabsContent>
      <TabsContent className={cn('mt-4 min-h-0 flex-1', styles.logTab)} value='log'>
        <LogView />
      </TabsContent>
    </Tabs>
  )
}

// Old /log links land on the timer with ?panel=log (middleware): open the Log tab, drop the param.
function useLogDeepLink() {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('panel') !== 'log') return
    url.searchParams.delete('panel')
    window.history.replaceState(window.history.state, '', url)
    useDeckStore.getState().openDeck('tasks', 'log')
  }, [])
}

// Outside the card: a now pick from the timer or a block start is announced with the card closed.
function Announcer() {
  const announcement = useTasksStore(s => s.announcement)
  return (
    <div className='sr-only' role='status' aria-live='polite'>
      {announcement}
    </div>
  )
}

const TABBABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

// full/onFull: desktop Log tab only, toggles the card between widened and full screen.
function Head({ full, onFull }: { full?: boolean; onFull?: () => void }) {
  const closeDeck = useDeckStore(s => s.closeDeck)
  const FullIcon = full ? Minimize2 : Maximize2
  return (
    <div className={records.head}>
      <h2 id='tasks-heading' className={records.heading} tabIndex={-1}>
        {PANEL_NAME}
      </h2>
      <div className={styles.headActions}>
        {onFull && (
          <button
            type='button'
            className={records.close}
            aria-label={full ? 'Exit full screen' : 'Full screen'}
            title={full ? 'Exit full screen' : 'Full screen'}
            onClick={onFull}
          >
            <FullIcon aria-hidden='true' />
          </button>
        )}
        <button
          type='button'
          className={records.close}
          aria-label={`Close ${PANEL_NAME}`}
          onClick={closeDeck}
        >
          <X aria-hidden='true' />
        </button>
      </div>
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
  usePlanSync()
  useLogDeepLink()
  const tab = useDeckStore(s => s.tasksTab)
  const reducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const [fullPref, setFullPref] = useState(false)
  const full = fullPref && tab === 'log'
  useEffect(() => {
    if (!isOpen) setFullPref(false)
  }, [isOpen])

  // Escape leaves full screen first; the deck's window listener skips prevented events.
  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !full) return
    event.preventDefault()
    setFullPref(false)
  }

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
      <>
        <Announcer />
        <BreakLogModal />
        <AnimatePresence>
          {isOpen && (
            <motion.section
              className={cn(records.surface, records.room, styles.card)}
              role='dialog'
              aria-modal='false'
              aria-labelledby='tasks-heading'
              data-tasks-card
              data-deck-card
              data-tab={tab}
              data-full={full || undefined}
              onKeyDown={onCardKeyDown}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
            >
              <Head full={full} onFull={tab === 'log' ? () => setFullPref(!full) : undefined} />
              <div className={cn(records.body, styles.body)} data-tab={tab}>
                <TasksTabs />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <>
      <Announcer />
      <BreakLogModal />
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
            <div className={cn(records.body, styles.body)} data-tab={tab}>
              <TasksTabs />
            </div>
          </DrawerPrimitive.Content>
        </DrawerPortal>
      </Drawer>
    </>
  )
}
