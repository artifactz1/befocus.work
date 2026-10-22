'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { create } from 'zustand'

export type Deck = 'records' | 'tasks' | null
type Card = Exclude<Deck, null>
export type TasksTab = 'list' | 'plan'

interface DeckState {
  deck: Deck
  // last-used Tasks tab, for this page load only
  tasksTab: TasksTab
  setTasksTab: (tab: TasksTab) => void
  // element that opened the card; focus returns to it on close while it is connected
  opener: HTMLElement | null
  openDeck: (card: Card, tab?: TasksTab, opener?: HTMLElement) => void
  closeDeck: () => void
  toggleDeck: (card: Card) => void
}

// One open-card value for the Quiet Deck: opening one card replaces the other.
export const useDeckStore = create<DeckState>((set, get) => ({
  deck: null,
  tasksTab: 'list',
  setTasksTab: tasksTab => set({ tasksTab }),
  opener: null,
  openDeck: (card, tab, opener) =>
    set({ deck: card, opener: opener ?? null, ...(tab ? { tasksTab: tab } : {}) }),
  closeDeck: () => set({ deck: null }),
  toggleDeck: card => set({ deck: get().deck === card ? null : card, opener: null }),
}))

// Owns html[data-room] / html[data-deck]. Call once (RecordRoom, mounted by both layouts).
export function useDeckRootAttrs() {
  const deck = useDeckStore(s => s.deck)
  useEffect(() => {
    if (deck === null) return
    const root = document.documentElement
    root.dataset.room = 'open'
    root.dataset.deck = deck
    return () => {
      delete root.dataset.room
      delete root.dataset.deck
    }
  }, [deck])
}

// Effects every deck card shares: heading focus, focus return, Escape and route-change close.
export function useDeckCard({
  card,
  headingId,
  triggerSelector,
  rerunFocusOn,
}: {
  card: Card
  headingId: string
  triggerSelector: string
  // changes when the card's shell swaps (desktop card <-> phone sheet), so focus moves again
  rerunFocusOn?: unknown
}) {
  const deck = useDeckStore(s => s.deck)
  const closeDeck = useDeckStore(s => s.closeDeck)
  const open = deck === card
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun on rerunFocusOn so focus moves to the heading when the shell swaps
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(headingId)
      // A field the card focused on open (the empty List's add input) keeps focus
      if (heading?.closest('[data-deck-card]')?.contains(document.activeElement)) return
      heading?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, headingId, rerunFocusOn])

  // Return focus only on an open -> closed transition, never on mount and never on a swap.
  const prevDeck = useRef(deck)
  useEffect(() => {
    const closed = prevDeck.current === card && deck === null
    prevDeck.current = deck
    if (!closed) return
    const opener = useDeckStore.getState().opener
    useDeckStore.setState({ opener: null })
    if (opener?.isConnected && opener.offsetParent !== null) {
      opener.focus()
      return
    }
    for (const el of document.querySelectorAll<HTMLElement>(triggerSelector)) {
      if (el.offsetParent !== null) {
        el.focus()
        break
      }
    }
  }, [deck, card, triggerSelector])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // Radix dialogs and menus handle their own Escape.
      if (
        document.querySelector(
          '[role="dialog"]:not([data-deck-card]), [role="alertdialog"], [role="menu"]',
        )
      )
        return
      closeDeck()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeDeck])

  useEffect(() => {
    if (open && prevPathname.current !== pathname) closeDeck()
    prevPathname.current = pathname
  }, [pathname, open, closeDeck])

  return {
    open,
    setOpen: (next: boolean) => (next ? useDeckStore.getState().openDeck(card) : closeDeck()),
  }
}
