'use client'

import { Button } from '@repo/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import { useEffect } from 'react'
import { useCustomizeStore } from '~/store/useCustomizeStore'
import ColorTab from './tabs/ColorTab'
import PlaceholderTab from './tabs/PlaceholderTab'

const TABS = [
  { id: 'theme', label: 'Theme' },
  { id: 'background', label: 'Background' },
  { id: 'type', label: 'Type' },
  { id: 'color', label: 'Color' },
  { id: 'style', label: 'Style' },
] as const

export default function CustomizePanel() {
  const isOpen = useCustomizeStore(s => s.isOpen)
  const tab = useCustomizeStore(s => s.currentTab)
  const setTab = useCustomizeStore(s => s.setTab)
  const close = useCustomizeStore(s => s.close)
  const apply = useCustomizeStore(s => s.apply)
  const resetToDefault = useCustomizeStore(s => s.resetToDefault)

  // Esc to close (= Cancel)
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key='customize-panel'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className='fixed left-1/2 top-1/2 z-40 hidden w-[min(72vw,820px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/40 bg-card/90 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:block'
          role='region'
          aria-label='Customize'
        >
          <header className='flex items-center justify-between gap-3 border-b border-border/30 px-5 py-3'>
            <span className='shrink-0 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground/70'>
              Customize
            </span>
            <nav className='flex flex-1 flex-wrap items-center gap-1' aria-label='Customize categories'>
              {TABS.map(t => (
                <button
                  key={t.id}
                  type='button'
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] transition-colors ${
                    tab === t.id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              type='button'
              onClick={close}
              aria-label='Close'
              className='grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          </header>

          <div className='min-h-[180px] px-5 py-5'>
            {tab === 'color' && <ColorTab />}
            {tab === 'theme' && <PlaceholderTab name='Theme' />}
            {tab === 'background' && <PlaceholderTab name='Background' />}
            {tab === 'type' && <PlaceholderTab name='Type' />}
            {tab === 'style' && <PlaceholderTab name='Style' />}
          </div>

          <footer className='flex items-center justify-end gap-2 border-t border-border/30 bg-foreground/[0.02] px-5 py-3'>
            <button
              type='button'
              onClick={resetToDefault}
              className='mr-auto inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground'
            >
              <RotateCcw className='h-3 w-3' />
              Restore defaults
            </button>
            <Button variant='ghost' size='sm' onClick={close} className='h-8 rounded-full px-4'>
              Cancel
            </Button>
            <Button size='sm' onClick={apply} className='h-8 rounded-full px-5'>
              Apply
            </Button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
