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
          className='fixed bottom-28 left-1/2 z-40 hidden w-[min(64vw,720px)] -translate-x-1/2 rounded-2xl border border-border/40 bg-card/90 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:block'
          role='dialog'
          aria-label='Customize'
        >
          <header className='flex items-center justify-between'>
            <nav className='flex flex-wrap gap-1' aria-label='Customize categories'>
              {TABS.map(t => (
                <button
                  key={t.id}
                  type='button'
                  onClick={() => setTab(t.id)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                    tab === t.id
                      ? 'border-border/60 bg-foreground/10 text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground/80'
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
              className='ml-2 grid h-6 w-6 place-items-center rounded-full border border-border/40 text-muted-foreground hover:text-foreground'
            >
              <X className='h-3 w-3' />
            </button>
          </header>

          <div className='mt-3 border-t border-border/40 pt-3'>
            {tab === 'color' && <ColorTab />}
            {tab === 'theme' && <PlaceholderTab name='Theme' />}
            {tab === 'background' && <PlaceholderTab name='Background' />}
            {tab === 'type' && <PlaceholderTab name='Type' />}
            {tab === 'style' && <PlaceholderTab name='Style' />}
          </div>

          <footer className='mt-3 flex items-center justify-end gap-2 border-t border-border/40 pt-3'>
            <button
              type='button'
              onClick={resetToDefault}
              className='mr-auto inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground'
            >
              <RotateCcw className='h-3 w-3' />
              Reset to default
            </button>
            <Button variant='ghost' size='sm' onClick={close}>
              Cancel
            </Button>
            <Button size='sm' onClick={apply}>
              Apply
            </Button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
