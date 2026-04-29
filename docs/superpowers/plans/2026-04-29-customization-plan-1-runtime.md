# Customization Plan 1 — Runtime, Layout, Color Tab

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working dashboard customization runtime end-to-end — left vertical rail, mobile gear-to-drawer, inline floating customize panel with Apply/Cancel, and a working Color tab (accent + contrast). localStorage persistence only; no DB or uploads yet. Proves the full preview-to-applied data flow before building remaining tabs.

**Architecture:** Customization values live on `<html>` as CSS variables (`--accent`, `--text-contrast`, etc.) and data attributes (`data-density`, `data-ring-style`). A Zustand `useCustomizeStore` holds two states: `active` (committed values) and `preview` (live during panel-open). A `<CustomizeStyleApplier />` client component subscribes to the store and writes the active+preview values to `document.documentElement` on every change. Tabs only mutate `preview`; clicking Apply copies `preview → active` and persists. Closing the panel = Cancel = `preview ← active`.

**Tech Stack:** Next.js 15 App Router (`apps/next`), Zustand 4, TanStack Query (existing), ShadCN UI (`drawer`, `slider`, `tabs`), Tailwind, Framer Motion, lucide-react icons. No new dependencies.

---

## File Structure

**Create:**
- `packages/types/customize.ts` — `Theme`, `Customizations` types + `DEFAULT_CUSTOMIZATIONS`.
- `apps/next/src/store/useCustomizeStore.tsx` — Zustand store (`active`, `preview`, `isOpen`, `currentTab`, plus actions).
- `apps/next/src/components/customize/CustomizeStyleApplier.tsx` — client component that writes preview/active values to `<html>`.
- `apps/next/src/components/customize/CustomizeRailButton.tsx` — gear icon trigger for desktop rail.
- `apps/next/src/components/customize/CustomizePanel.tsx` — inline floating panel (tabs, body, Apply/Cancel/Reset footer).
- `apps/next/src/components/customize/tabs/ColorTab.tsx` — accent swatches + contrast slider.
- `apps/next/src/components/customize/tabs/PlaceholderTab.tsx` — stub for Background/Type/Style (Plan 2).
- `apps/next/src/components/dashboard/LeftRail.tsx` — desktop vertical pill containing existing tools + customize gear.
- `apps/next/src/components/dashboard/MobileToolsTrigger.tsx` — mobile bottom-left gear that opens a Drawer with all tools.
- `apps/next/src/lib/customize-persistence.ts` — localStorage read/write with a versioned shape.

**Modify:**
- `apps/next/src/components/Footer.tsx` — remove `MenuSettings` + `MenuSettingsMobile`, keep only `<TimerButtons />` centered.
- `apps/next/src/app/(app)/page.tsx` — mount `<LeftRail />`, `<MobileToolsTrigger />`, `<CustomizePanel />`, `<CustomizeStyleApplier />`.
- `apps/next/src/app/guest/page.tsx` — same as above.
- `packages/ui/src/globals.css` — set defaults for `--text-contrast: 1`.

**Delete:** none in Plan 1 (`MenuSettings.tsx` + `MenuSettingsMobile.tsx` left in place but no longer rendered; we delete in Plan 2 once we're sure nothing imports them).

---

## Phase 0 — Working tree check

### Task 0.1: Verify branch + clean tree

- [ ] **Step 1: Check branch**

Run: `git branch --show-current`
Expected output: `feat/customize`

- [ ] **Step 2: Check tree clean**

Run: `git status`
Expected: `nothing to commit, working tree clean`

If anything else, stop and resolve before proceeding.

---

## Phase 1 — Types + runtime store

### Task 1.1: Customization types + defaults

**Files:**
- Create: `packages/types/customize.ts`

- [ ] **Step 1: Write the file**

```ts
// packages/types/customize.ts

export type BackgroundCustomization =
  | { kind: 'curated'; assetId: string }
  | { kind: 'upload'; mediaId: string; mediaType: 'image' | 'video' }
  | { kind: 'url'; url: string; mediaType: 'image' | 'video' }
  | { kind: 'solid'; color: string }

export type TypographyFamily =
  | 'inter-tight'
  | 'editorial-serif'
  | 'mono'
  | 'display-sans'

export type RingStyle = 'dashed' | 'solid' | 'off'
export type Density = 'compact' | 'comfortable' | 'roomy'

export type Customizations = {
  background: BackgroundCustomization
  overlay: { color: string; opacity: number } // hsl, 0..1
  blur: number // 0..40
  grain: number // 0..1
  typography: { family: TypographyFamily }
  color: { accent: string; contrast: number } // hsl, 0..1
  timer: { ringStyle: RingStyle }
  density: Density
}

export type Theme = {
  id: string
  userId: string | null
  name: string
  isCurated: boolean
  version: 1
  customizations: Customizations
  createdAt: string
  updatedAt: string
}

// Default theme — what the app looks like with no customization applied.
// Mirrors the existing globals.css :root defaults.
export const DEFAULT_CUSTOMIZATIONS: Customizations = {
  background: { kind: 'solid', color: 'hsl(0 0% 6%)' },
  overlay: { color: 'hsl(0 0% 0%)', opacity: 0 },
  blur: 0,
  grain: 0.05,
  typography: { family: 'inter-tight' },
  color: { accent: 'hsl(12 6.5% 15.1%)', contrast: 1 },
  timer: { ringStyle: 'dashed' },
  density: 'comfortable',
}

export const DEFAULT_THEME: Theme = {
  id: 'default',
  userId: null,
  name: 'Default',
  isCurated: true,
  version: 1,
  customizations: DEFAULT_CUSTOMIZATIONS,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd packages/types && bun x tsc --noEmit`
Expected: no output, exit code 0

- [ ] **Step 3: Commit**

```bash
git add packages/types/customize.ts
git commit -m "feat(types): add Theme and Customizations types"
```

---

### Task 1.2: Customize Zustand store

**Files:**
- Create: `apps/next/src/store/useCustomizeStore.tsx`

- [ ] **Step 1: Write the store**

```tsx
// apps/next/src/store/useCustomizeStore.tsx
'use client'

import type { Customizations, Theme } from '@repo/types/customize'
import { DEFAULT_CUSTOMIZATIONS, DEFAULT_THEME } from '@repo/types/customize'
import { create } from 'zustand'

type CustomizeTab = 'theme' | 'background' | 'type' | 'color' | 'style'

type CustomizeStore = {
  // Committed state
  activeTheme: Theme
  // Live state (only meaningful while panel is open)
  preview: Customizations
  // Panel UI
  isOpen: boolean
  currentTab: CustomizeTab

  // Actions
  open: (tab?: CustomizeTab) => void
  close: () => void // = Cancel
  setTab: (tab: CustomizeTab) => void
  setPreview: (patch: Partial<Customizations>) => void
  apply: () => void
  resetToDefault: () => void
  hydrate: (theme: Theme) => void
}

export const useCustomizeStore = create<CustomizeStore>((set, get) => ({
  activeTheme: DEFAULT_THEME,
  preview: DEFAULT_CUSTOMIZATIONS,
  isOpen: false,
  currentTab: 'theme',

  open: (tab) =>
    set((s) => ({
      isOpen: true,
      currentTab: tab ?? s.currentTab,
      // initialize preview from active each time panel opens
      preview: s.activeTheme.customizations,
    })),

  close: () =>
    set((s) => ({
      isOpen: false,
      preview: s.activeTheme.customizations, // revert
    })),

  setTab: (tab) => set({ currentTab: tab }),

  setPreview: (patch) => set((s) => ({ preview: { ...s.preview, ...patch } })),

  apply: () =>
    set((s) => ({
      activeTheme: {
        ...s.activeTheme,
        customizations: s.preview,
        updatedAt: new Date().toISOString(),
      },
      isOpen: false,
    })),

  resetToDefault: () =>
    set(() => ({
      activeTheme: DEFAULT_THEME,
      preview: DEFAULT_CUSTOMIZATIONS,
    })),

  hydrate: (theme) =>
    set({ activeTheme: theme, preview: theme.customizations }),
}))
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no output, exit code 0

- [ ] **Step 3: Commit**

```bash
git add apps/next/src/store/useCustomizeStore.tsx
git commit -m "feat(customize): add useCustomizeStore"
```

---

### Task 1.3: Style applier — write CSS vars + data attrs to `<html>`

**Files:**
- Create: `apps/next/src/components/customize/CustomizeStyleApplier.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/next/src/components/customize/CustomizeStyleApplier.tsx
'use client'

import { useEffect } from 'react'
import { useCustomizeStore } from '~/store/useCustomizeStore'

/**
 * Subscribes to active+preview state. While panel is open, applies preview;
 * otherwise applies active. Writes to <html> as CSS vars + data attrs.
 *
 * Mount once near the dashboard root.
 */
export default function CustomizeStyleApplier() {
  const isOpen = useCustomizeStore((s) => s.isOpen)
  const preview = useCustomizeStore((s) => s.preview)
  const active = useCustomizeStore((s) => s.activeTheme.customizations)
  const c = isOpen ? preview : active

  useEffect(() => {
    const root = document.documentElement

    // Continuous values — CSS variables
    root.style.setProperty('--accent', stripHsl(c.color.accent))
    root.style.setProperty('--text-contrast', String(c.color.contrast))
    root.style.setProperty('--grain-opacity', String(c.grain))
    root.style.setProperty('--bg-overlay-color', stripHsl(c.overlay.color))
    root.style.setProperty('--bg-overlay-opacity', String(c.overlay.opacity))
    root.style.setProperty('--bg-blur', `${c.blur}px`)

    // Background image: only image/url kinds set --bg-image; others clear it
    if (c.background.kind === 'curated') {
      root.style.setProperty('--bg-image', `url('/backgrounds/${c.background.assetId}.jpg')`)
    } else if (c.background.kind === 'url') {
      root.style.setProperty('--bg-image', `url('${c.background.url}')`)
    } else {
      root.style.setProperty('--bg-image', 'none')
    }

    // Discrete values — data attributes
    root.dataset.ringStyle = c.timer.ringStyle
    root.dataset.density = c.density
    root.dataset.fontFamily = c.typography.family
  }, [c])

  return null
}

// Strip "hsl(...)" wrapper if present so the value matches Tailwind's
// existing pattern of `hsl(var(--accent))` consumers.
function stripHsl(v: string) {
  const m = v.match(/^hsl\(([^)]+)\)$/i)
  return m ? m[1].trim() : v
}
```

- [ ] **Step 2: Add `--text-contrast` default to globals.css**

Modify `packages/ui/src/globals.css` — add to the existing `:root` block right after `--bg-blur`:

```css
  --text-contrast: 1;
  --grain-opacity: 0.05;
```

- [ ] **Step 3: Verify TS compiles**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/next/src/components/customize/CustomizeStyleApplier.tsx packages/ui/src/globals.css
git commit -m "feat(customize): style applier writes CSS vars to html"
```

---

## Phase 2 — Layout refactor (F + M1)

### Task 2.1: Desktop vertical rail (LeftRail)

**Files:**
- Create: `apps/next/src/components/dashboard/LeftRail.tsx`

- [ ] **Step 1: Write the rail**

```tsx
// apps/next/src/components/dashboard/LeftRail.tsx
'use client'

import AccountButton from '~/components/AccountButton'
import { SessionSettings } from '~/components/settings/SessionSettings'
import SoundSettings from '~/components/settings/SoundSettings'
import ToDoList from '~/components/to-do-list/ToDoList'
import CustomizeRailButton from '~/components/customize/CustomizeRailButton'

/**
 * Desktop-only vertical glass rail at the left edge of the viewport.
 * Hosts all peripheral tools (todo, sounds, sessions, account, customize).
 */
export default function LeftRail() {
  return (
    <aside
      className='fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-border/40 bg-card/50 px-1.5 py-2.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:flex md:left-6'
      aria-label='Tools'
    >
      <ToDoList />
      <SoundSettings />
      <SessionSettings />
      <CustomizeRailButton />
      <AccountButton />
    </aside>
  )
}
```

- [ ] **Step 2: Stub `CustomizeRailButton` so the import resolves**

Create `apps/next/src/components/customize/CustomizeRailButton.tsx`:

```tsx
// apps/next/src/components/customize/CustomizeRailButton.tsx
'use client'

import { Button } from '@repo/ui/button'
import { Settings2 } from 'lucide-react'
import { useCustomizeStore } from '~/store/useCustomizeStore'

export default function CustomizeRailButton() {
  const open = useCustomizeStore((s) => s.open)
  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Customize'
      onClick={() => open()}
    >
      <Settings2 className='h-5 w-5' />
    </Button>
  )
}
```

- [ ] **Step 3: Verify TS compiles**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/next/src/components/dashboard/LeftRail.tsx apps/next/src/components/customize/CustomizeRailButton.tsx
git commit -m "feat(customize): desktop left rail with customize gear"
```

---

### Task 2.2: Mobile gear → drawer

**Files:**
- Create: `apps/next/src/components/dashboard/MobileToolsTrigger.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/next/src/components/dashboard/MobileToolsTrigger.tsx
'use client'

import { Button } from '@repo/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/drawer'
import { ListTodo, Music, Settings2, User, Volume2 } from 'lucide-react'
import { useState } from 'react'
import AccountButton from '~/components/AccountButton'
import SessionSettingsMobile from '~/components/settings/SessionSettingsMobile'
import SoundSettingsMobile from '~/components/settings/SoundSettingsMobile'
import ToDoListMobile from '~/components/to-do-list/ToDoListMobile'
import { useCustomizeStore } from '~/store/useCustomizeStore'

export default function MobileToolsTrigger() {
  const [open, setOpen] = useState(false)
  const openCustomize = useCustomizeStore((s) => s.open)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Tools'
          className='fixed bottom-6 left-6 z-30 h-12 w-12 rounded-full border border-border/40 bg-card/50 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:hidden'
        >
          <Settings2 className='h-5 w-5' />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tools</DrawerTitle>
        </DrawerHeader>
        <div className='flex flex-col gap-1 p-4 pb-8'>
          <ToolRow icon={<ListTodo className='h-5 w-5' />} label='To-do'>
            <ToDoListMobile />
          </ToolRow>
          <ToolRow icon={<Volume2 className='h-5 w-5' />} label='Sounds'>
            <SoundSettingsMobile />
          </ToolRow>
          <ToolRow icon={<Music className='h-5 w-5' />} label='Sessions'>
            <SessionSettingsMobile />
          </ToolRow>
          <button
            type='button'
            onClick={() => {
              setOpen(false)
              openCustomize()
            }}
            className='flex items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent/40'
          >
            <Settings2 className='h-5 w-5' />
            <span>Customize</span>
          </button>
          <ToolRow icon={<User className='h-5 w-5' />} label='Account'>
            <AccountButton />
          </ToolRow>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ToolRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between rounded-md px-3 py-3'>
      <div className='flex items-center gap-3'>
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors. If `@repo/ui/drawer` import fails, the next step adds the export.

- [ ] **Step 3: Verify drawer is exported from `@repo/ui`**

Run: `grep -E '"./drawer"|drawer' /Users/artifactz1/Documents/projects/befocus.work/packages/ui/package.json`
Expected: drawer is in the exports map.

If not exported, add to `packages/ui/package.json` exports field — same pattern as the existing `tooltip` or `dialog` exports.

- [ ] **Step 4: Commit**

```bash
git add apps/next/src/components/dashboard/MobileToolsTrigger.tsx
git commit -m "feat(customize): mobile gear trigger opens tools drawer"
```

---

### Task 2.3: Strip footer of menu settings

**Files:**
- Modify: `apps/next/src/components/Footer.tsx`

- [ ] **Step 1: Replace file**

```tsx
// apps/next/src/components/Footer.tsx
import TimerButtons from './timer/TimerButtons'

export default function Footer() {
  return (
    <div className='z-10 mb-10 flex h-[15vh] w-full items-center justify-center px-[5vw] md:mb-0'>
      <TimerButtons />
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/next/src/components/Footer.tsx
git commit -m "feat(customize): footer keeps only centered transport"
```

---

### Task 2.4: Mount rail + mobile trigger on dashboard

**Files:**
- Modify: `apps/next/src/app/(app)/page.tsx`

- [ ] **Step 1: Update page**

```tsx
// apps/next/src/app/(app)/page.tsx
'use client'
import { motion } from 'framer-motion'
import CommandMenu from '~/components/CommandMenu'
import CustomizePanel from '~/components/customize/CustomizePanel'
import CustomizeStyleApplier from '~/components/customize/CustomizeStyleApplier'
import AppBackground from '~/components/dashboard/AppBackground'
import LeftRail from '~/components/dashboard/LeftRail'
import MobileToolsTrigger from '~/components/dashboard/MobileToolsTrigger'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { SessionCompleteModal } from '~/components/SessionCompleteModal'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import PrefetchUserTasks from '~/components/helper/PrefetchUserTasks'
import Timer from '~/components/timer/Timer'
import { TimerInitializer } from '~/components/timer/TimerInitializer'

export default function Dashboard() {
  return (
    <div>
      <GlobalSoundsPlayer />
      <TimerInitializer />
      <PrefetchUserTasks />
      <SessionCompleteModal />
      <CommandMenu />
      <AppBackground />
      <CustomizeStyleApplier />
      <LeftRail />
      <MobileToolsTrigger />
      <CustomizePanel />
      <motion.main
        className='continer px-auto relative z-10 flex h-screen w-screen flex-col items-center justify-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.25 }}
      >
        <Header />
        <Timer />
        <Footer />
      </motion.main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TS**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: errors for `~/components/customize/CustomizePanel` (not yet created — fine for now).

If TS fails on missing `CustomizePanel`, temporarily comment that import + the `<CustomizePanel />` line. We add it in Phase 3 then uncomment.

- [ ] **Step 3: Commit (with CustomizePanel commented out if needed)**

```bash
git add apps/next/src/app/(app)/page.tsx
git commit -m "feat(customize): mount rail + mobile trigger on dashboard"
```

---

### Task 2.5: Mount on guest page

**Files:**
- Modify: `apps/next/src/app/guest/page.tsx`

- [ ] **Step 1: Apply same import + render pattern**

```tsx
// apps/next/src/app/guest/page.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import CustomizePanel from '~/components/customize/CustomizePanel'
import CustomizeStyleApplier from '~/components/customize/CustomizeStyleApplier'
import AppBackground from '~/components/dashboard/AppBackground'
import LeftRail from '~/components/dashboard/LeftRail'
import MobileToolsTrigger from '~/components/dashboard/MobileToolsTrigger'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { SessionCompleteModal } from '~/components/SessionCompleteModal'
import GlobalSoundsPlayer from '~/components/helper/GlobalSoundsPlayer'
import Timer from '~/components/timer/Timer'

const INTRO_FLAG = 'befocus.guestIntroShown'

export default function App() {
  const CommandMenu = dynamic(() => import('~/components/CommandMenu'), { ssr: false })

  const [showIntro, setShowIntro] = useState(false)
  const [introDone, setIntroDone] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const alreadyShown = localStorage.getItem(INTRO_FLAG) === '1'
    if (!alreadyShown) {
      setShowIntro(true)
      setIntroDone(false)
      const t = setTimeout(() => {
        setShowIntro(false)
        localStorage.setItem(INTRO_FLAG, '1')
      }, 1600)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div>
      <GlobalSoundsPlayer />
      <SessionCompleteModal />
      <CommandMenu />
      <AppBackground />
      <CustomizeStyleApplier />
      {introDone && <LeftRail />}
      {introDone && <MobileToolsTrigger />}
      {introDone && <CustomizePanel />}

      <AnimatePresence onExitComplete={() => setIntroDone(true)}>
        {showIntro && (
          <motion.div
            key='intro'
            className='fixed inset-0 z-50 flex items-center justify-center bg-background'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.h1
              className='text-7xl font-semibold tracking-tight sm:text-9xl'
              initial={{ opacity: 0, filter: 'blur(16px)', scale: 1.15 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              Be Focus
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {introDone && (
        <motion.main
          className='continer px-auto relative z-10 flex h-screen w-screen flex-col items-center justify-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.25 }}
        >
          <Header />
          <Timer />
          <Footer />
        </motion.main>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/next/src/app/guest/page.tsx
git commit -m "feat(customize): mount rail + mobile trigger on guest page"
```

---

## Phase 3 — Customize panel shell

### Task 3.1: PlaceholderTab stub

**Files:**
- Create: `apps/next/src/components/customize/tabs/PlaceholderTab.tsx`

- [ ] **Step 1: Write stub**

```tsx
// apps/next/src/components/customize/tabs/PlaceholderTab.tsx
'use client'

export default function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className='flex items-center justify-center py-6 text-xs text-muted-foreground'>
      {name} controls — coming in Plan 2
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/next/src/components/customize/tabs/PlaceholderTab.tsx
git commit -m "feat(customize): placeholder tab for not-yet-implemented categories"
```

---

### Task 3.2: CustomizePanel component

**Files:**
- Create: `apps/next/src/components/customize/CustomizePanel.tsx`

- [ ] **Step 1: Write the panel**

```tsx
// apps/next/src/components/customize/CustomizePanel.tsx
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
  const isOpen = useCustomizeStore((s) => s.isOpen)
  const tab = useCustomizeStore((s) => s.currentTab)
  const setTab = useCustomizeStore((s) => s.setTab)
  const close = useCustomizeStore((s) => s.close)
  const apply = useCustomizeStore((s) => s.apply)
  const resetToDefault = useCustomizeStore((s) => s.resetToDefault)

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
              {TABS.map((t) => (
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
```

- [ ] **Step 2: Stub ColorTab to satisfy import**

Create `apps/next/src/components/customize/tabs/ColorTab.tsx`:

```tsx
// apps/next/src/components/customize/tabs/ColorTab.tsx
'use client'

export default function ColorTab() {
  return <div className='py-6 text-xs text-muted-foreground'>Color (next task)</div>
}
```

- [ ] **Step 3: Verify TS**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors. If `(app)/page.tsx` had `<CustomizePanel />` commented out, uncomment now.

- [ ] **Step 4: Commit**

```bash
git add apps/next/src/components/customize/CustomizePanel.tsx apps/next/src/components/customize/tabs/ColorTab.tsx apps/next/src/app/\(app\)/page.tsx apps/next/src/app/guest/page.tsx
git commit -m "feat(customize): panel shell with tabs, apply/cancel/reset footer"
```

---

### Task 3.3: Verify panel opens & closes end-to-end

- [ ] **Step 1: Start dev**

Run: `bun run web`

- [ ] **Step 2: Smoke test**

Open `http://localhost:3000/guest` (no auth needed). Verify:
- Vertical rail visible at left edge with 5 icons.
- Click the gear icon → panel appears centered above the bottom transport.
- Tab row shows 5 tabs, "Theme" selected by default.
- Click each tab — content swaps to placeholder (or "Color (next task)" for the color tab).
- Click Cancel → panel closes.
- Click gear again → panel reopens.
- Press Esc → panel closes.

If any step fails, fix and re-test before continuing.

- [ ] **Step 3: Stop dev** (Ctrl+C)

---

## Phase 4 — Color tab (full implementation)

### Task 4.1: Color tab UI

**Files:**
- Modify: `apps/next/src/components/customize/tabs/ColorTab.tsx`

- [ ] **Step 1: Replace file with full implementation**

```tsx
// apps/next/src/components/customize/tabs/ColorTab.tsx
'use client'

import { Slider } from '@repo/ui/slider'
import { useCustomizeStore } from '~/store/useCustomizeStore'

const SWATCHES: Array<{ id: string; hsl: string }> = [
  { id: 'stone', hsl: 'hsl(30 5% 60%)' },
  { id: 'sage', hsl: 'hsl(120 12% 55%)' },
  { id: 'rose', hsl: 'hsl(355 55% 65%)' },
  { id: 'sand', hsl: 'hsl(35 35% 70%)' },
  { id: 'sky', hsl: 'hsl(210 50% 65%)' },
  { id: 'lavender', hsl: 'hsl(265 30% 65%)' },
  { id: 'amber', hsl: 'hsl(30 70% 55%)' },
  { id: 'pine', hsl: 'hsl(155 30% 40%)' },
  { id: 'crimson', hsl: 'hsl(355 70% 50%)' },
  { id: 'ink', hsl: 'hsl(220 15% 25%)' },
  { id: 'cream', hsl: 'hsl(45 60% 88%)' },
  { id: 'coal', hsl: 'hsl(0 0% 12%)' },
]

export default function ColorTab() {
  const accent = useCustomizeStore((s) => s.preview.color.accent)
  const contrast = useCustomizeStore((s) => s.preview.color.contrast)
  const setPreview = useCustomizeStore((s) => s.setPreview)

  const setAccent = (hsl: string) =>
    setPreview({ color: { accent: hsl, contrast } })

  const setContrast = (val: number) =>
    setPreview({ color: { accent, contrast: val } })

  return (
    <div className='flex flex-col gap-4 py-1'>
      <section className='flex items-center gap-3'>
        <span className='shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground'>
          Accent
        </span>
        <div className='flex flex-wrap gap-2'>
          {SWATCHES.map((s) => {
            const selected = s.hsl === accent
            return (
              <button
                key={s.id}
                type='button'
                aria-label={`Accent ${s.id}`}
                aria-pressed={selected}
                onClick={() => setAccent(s.hsl)}
                style={{ background: s.hsl }}
                className={`h-7 w-7 rounded-full border transition-all ${
                  selected
                    ? 'scale-110 border-foreground/80 ring-2 ring-foreground/30 ring-offset-2 ring-offset-background'
                    : 'border-border/40 hover:scale-105'
                }`}
              />
            )
          })}
        </div>
      </section>

      <section className='flex items-center gap-3'>
        <span className='shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground'>
          Contrast
        </span>
        <Slider
          value={[contrast]}
          min={0.6}
          max={1}
          step={0.02}
          onValueChange={([v]) => setContrast(v)}
          className='w-full'
        />
        <span className='w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground'>
          {Math.round(contrast * 100)}%
        </span>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify Slider exported from @repo/ui**

Run: `grep -E '"\./slider"' /Users/artifactz1/Documents/projects/befocus.work/packages/ui/package.json`
Expected: slider is in exports map. If not, add it.

- [ ] **Step 3: Verify TS**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/next/src/components/customize/tabs/ColorTab.tsx
git commit -m "feat(customize): color tab — accent swatches and contrast slider"
```

---

### Task 4.2: Apply contrast to body text via CSS

**Files:**
- Modify: `packages/ui/src/globals.css`

- [ ] **Step 1: Add a global rule that consumes `--text-contrast`**

Append (or insert near the `body { ... }` block):

```css
@layer base {
  body {
    /* Text intensity slider — fades foreground evenly. */
    color: hsl(var(--foreground) / var(--text-contrast, 1));
  }
}
```

This relies on Tailwind's `text-foreground` resolving to `hsl(var(--foreground))` — the slot-based pattern means descendant components that explicitly set their own color won't be affected, but inherited body color will fade.

- [ ] **Step 2: Verify Tailwind / Biome happy**

Run: `bun run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/globals.css
git commit -m "feat(customize): wire --text-contrast into body color"
```

---

### Task 4.3: End-to-end Color tab test

- [ ] **Step 1: Start dev**

Run: `bun run web`

- [ ] **Step 2: Manual checklist**

Open `http://localhost:3000/guest`:
- Click gear → panel opens.
- Switch to Color tab.
- Click a non-default accent swatch (e.g. rose) → see the accent affect any UI element using `text-accent` or `bg-accent` (the panel's border highlight if visible, the rail's hover state).
- Move the contrast slider — body text dims in real time.
- Click Cancel → both revert.
- Re-open panel, click another swatch, click Apply → values persist (panel closes; reopen shows the same swatch selected).
- Reload page (Ctrl+R) → values reset to default (no localStorage yet — expected).

- [ ] **Step 3: Stop dev**

---

## Phase 5 — localStorage persistence

### Task 5.1: Persistence helper

**Files:**
- Create: `apps/next/src/lib/customize-persistence.ts`

- [ ] **Step 1: Write helper**

```ts
// apps/next/src/lib/customize-persistence.ts
import type { Theme } from '@repo/types/customize'
import { DEFAULT_THEME } from '@repo/types/customize'

const ACTIVE_KEY = 'befocus.activeTheme'

export function loadActiveTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return DEFAULT_THEME
    const parsed = JSON.parse(raw)
    // Reject incompatible versions silently
    if (parsed?.version !== 1) return DEFAULT_THEME
    return parsed as Theme
  } catch {
    return DEFAULT_THEME
  }
}

export function saveActiveTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(theme))
  } catch {
    // Quota or disabled storage — silently ignore in v1.
  }
}

export function clearActiveTheme() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_KEY)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/next/src/lib/customize-persistence.ts
git commit -m "feat(customize): localStorage helper for active theme"
```

---

### Task 5.2: Wire persistence into store

**Files:**
- Modify: `apps/next/src/store/useCustomizeStore.tsx`

- [ ] **Step 1: Add persistence calls inside `apply` and `resetToDefault`, and a `hydrateFromStorage` action**

Replace the file:

```tsx
// apps/next/src/store/useCustomizeStore.tsx
'use client'

import type { Customizations, Theme } from '@repo/types/customize'
import { DEFAULT_CUSTOMIZATIONS, DEFAULT_THEME } from '@repo/types/customize'
import { create } from 'zustand'
import {
  clearActiveTheme,
  loadActiveTheme,
  saveActiveTheme,
} from '~/lib/customize-persistence'

type CustomizeTab = 'theme' | 'background' | 'type' | 'color' | 'style'

type CustomizeStore = {
  activeTheme: Theme
  preview: Customizations
  isOpen: boolean
  currentTab: CustomizeTab
  isHydrated: boolean

  open: (tab?: CustomizeTab) => void
  close: () => void
  setTab: (tab: CustomizeTab) => void
  setPreview: (patch: Partial<Customizations>) => void
  apply: () => void
  resetToDefault: () => void
  hydrate: (theme: Theme) => void
  hydrateFromStorage: () => void
}

export const useCustomizeStore = create<CustomizeStore>((set, get) => ({
  activeTheme: DEFAULT_THEME,
  preview: DEFAULT_CUSTOMIZATIONS,
  isOpen: false,
  currentTab: 'theme',
  isHydrated: false,

  open: (tab) =>
    set((s) => ({
      isOpen: true,
      currentTab: tab ?? s.currentTab,
      preview: s.activeTheme.customizations,
    })),

  close: () =>
    set((s) => ({
      isOpen: false,
      preview: s.activeTheme.customizations,
    })),

  setTab: (tab) => set({ currentTab: tab }),

  setPreview: (patch) =>
    set((s) => ({ preview: { ...s.preview, ...patch } })),

  apply: () => {
    const next: Theme = {
      ...get().activeTheme,
      customizations: get().preview,
      updatedAt: new Date().toISOString(),
    }
    saveActiveTheme(next)
    set({ activeTheme: next, isOpen: false })
  },

  resetToDefault: () => {
    clearActiveTheme()
    set({ activeTheme: DEFAULT_THEME, preview: DEFAULT_CUSTOMIZATIONS })
  },

  hydrate: (theme) => set({ activeTheme: theme, preview: theme.customizations, isHydrated: true }),

  hydrateFromStorage: () => {
    if (get().isHydrated) return
    const theme = loadActiveTheme()
    set({ activeTheme: theme, preview: theme.customizations, isHydrated: true })
  },
}))
```

- [ ] **Step 2: Verify TS**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/next/src/store/useCustomizeStore.tsx
git commit -m "feat(customize): persist active theme to localStorage on apply"
```

---

### Task 5.3: Hydrate store on mount (SSR-safe)

**Files:**
- Modify: `apps/next/src/components/customize/CustomizeStyleApplier.tsx`

- [ ] **Step 1: Trigger hydration on first mount**

```tsx
// apps/next/src/components/customize/CustomizeStyleApplier.tsx
'use client'

import { useEffect } from 'react'
import { useCustomizeStore } from '~/store/useCustomizeStore'

export default function CustomizeStyleApplier() {
  const isOpen = useCustomizeStore((s) => s.isOpen)
  const preview = useCustomizeStore((s) => s.preview)
  const active = useCustomizeStore((s) => s.activeTheme.customizations)
  const isHydrated = useCustomizeStore((s) => s.isHydrated)
  const hydrateFromStorage = useCustomizeStore((s) => s.hydrateFromStorage)

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    if (!isHydrated) hydrateFromStorage()
  }, [isHydrated, hydrateFromStorage])

  const c = isOpen ? preview : active

  useEffect(() => {
    // Don't write defaults to <html> until hydration completes — prevents
    // a flash of default values before the user's saved theme loads.
    if (!isHydrated) return

    const root = document.documentElement
    root.style.setProperty('--accent', stripHsl(c.color.accent))
    root.style.setProperty('--text-contrast', String(c.color.contrast))
    root.style.setProperty('--grain-opacity', String(c.grain))
    root.style.setProperty('--bg-overlay-color', stripHsl(c.overlay.color))
    root.style.setProperty('--bg-overlay-opacity', String(c.overlay.opacity))
    root.style.setProperty('--bg-blur', `${c.blur}px`)

    if (c.background.kind === 'curated') {
      root.style.setProperty('--bg-image', `url('/backgrounds/${c.background.assetId}.jpg')`)
    } else if (c.background.kind === 'url') {
      root.style.setProperty('--bg-image', `url('${c.background.url}')`)
    } else {
      root.style.setProperty('--bg-image', 'none')
    }

    root.dataset.ringStyle = c.timer.ringStyle
    root.dataset.density = c.density
    root.dataset.fontFamily = c.typography.family
  }, [c, isHydrated])

  return null
}

function stripHsl(v: string) {
  const m = v.match(/^hsl\(([^)]+)\)$/i)
  return m ? m[1].trim() : v
}
```

- [ ] **Step 2: Verify TS**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/next/src/components/customize/CustomizeStyleApplier.tsx
git commit -m "feat(customize): hydrate active theme from localStorage on mount"
```

---

## Phase 6 — Verification + polish

### Task 6.1: End-to-end persistence test

- [ ] **Step 1: Start dev**

Run: `bun run web`

- [ ] **Step 2: Run the full happy-path checklist**

Open `http://localhost:3000/guest`:
1. Click gear → panel opens, Theme tab default.
2. Click Color tab.
3. Click a swatch (rose), drag contrast to ~80%.
4. Verify dashboard reflects both changes live.
5. Click Apply → panel closes, changes persist visually.
6. Reload page (Ctrl+R) → swatch and contrast are still applied (this proves localStorage hydration).
7. Click gear again → Color tab shows the same swatch selected, slider at the saved value.
8. Click another swatch, click Cancel → panel closes, dashboard reverts.
9. Click gear again → original Apply'd swatch still active.
10. Open panel, click Reset to default → dashboard resets, panel closes.
11. Reload → still default.

If any step fails, fix and rerun.

- [ ] **Step 3: Mobile smoke test (resize browser to <640px)**

Resize browser window to phone width:
- Left rail hidden, bottom-left gear visible.
- Tap gear → drawer slides up showing tool list including Customize.
- Tap Customize row → drawer closes, customize panel attempts to open (note: the panel is `hidden` on mobile in v1; this is a known limitation Plan 1 ships). Verify gracefully — no errors in console.

The mobile customize sheet itself comes in Plan 2 once Theme/Background tabs land. Plan 1 ships desktop-only customization.

- [ ] **Step 4: Stop dev**

- [ ] **Step 5: Commit nothing (verification only)**

---

### Task 6.2: Lint + format check

- [ ] **Step 1: Run check**

Run: `bun run check`
Expected: no errors.

If errors:
- `bun run turbo:format` to autofix.
- Commit format fixes:

```bash
git add -A
git commit -m "chore: lint/format pass for plan 1"
```

- [ ] **Step 2: Final TS check**

Run: `cd apps/next && bun x tsc --noEmit`
Expected: no errors.

---

### Task 6.3: Push branch + open PR (optional)

- [ ] **Step 1: Push**

Run: `git push -u origin feat/customize`

- [ ] **Step 2: Open PR if ready**

Run:
```bash
gh pr create --title "feat(customize): plan 1 — runtime + layout + Color tab" --body "$(cat <<'EOF'
## Summary
- New `useCustomizeStore` (Zustand) with `active` / `preview` / `isOpen` / `currentTab` state.
- `<CustomizeStyleApplier />` writes preview/active values to `<html>` as CSS vars + data attributes.
- Layout refactored to F + M1: desktop left vertical rail (containing existing tools + new customize gear), mobile bottom-left gear opens drawer.
- Inline floating customize panel above transport with 5 tabs, Apply/Cancel/Reset footer; closing the panel is treated as Cancel.
- Color tab implemented end-to-end: 12 accent swatches + contrast slider.
- localStorage persistence: Apply persists to `befocus.activeTheme`; hydrates on next page load.

## Test plan
- [ ] Open `/guest`, click rail gear, pick an accent, click Apply, refresh — accent persists.
- [ ] Pick an accent + slide contrast, click Cancel — both revert.
- [ ] Press Esc with panel open — closes (treated as Cancel).
- [ ] Click Reset to default — clears localStorage and reverts to baseline.
- [ ] Resize to mobile — left rail hides, bottom-left gear opens drawer with all tools.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review — spec coverage

Plan 1 covers:

- [x] CSS-var contract for accent + contrast (other vars wired but driven by defaults).
- [x] F + M1 layout (desktop left rail, mobile bottom-sheet trigger).
- [x] P3 inline floating panel above transport.
- [x] Apply / Cancel / Reset semantics (panel close = Cancel).
- [x] Tab routing skeleton (Theme / Background / Type / Color / Style).
- [x] Color tab fully functional.
- [x] Live preview pattern (preview vs active state in Zustand).
- [x] localStorage persistence for guests.

Deferred to **Plan 2**:
- DB-backed themes + API endpoints.
- Theme tab (curated + saved themes).
- Background, Type, Style tabs (currently placeholders).
- localStorage → DB sync on signup.
- Mobile customize sheet (mobile triggers panel today, but panel is desktop-only).

Deferred to **Plan 3**:
- R2 setup + media uploads.
- URL paste hardening.

## Open follow-ups (not blocking Plan 1)

- The `--accent` CSS var ends up consumed via `hsl(var(--accent))` (existing tailwind tokens) — confirm the existing dark-mode `--accent` doesn't override. If it does, scope the override to `[data-theme-active] :root` or strip the dark-mode override.
- The mobile bottom-left gear and the bottom-center transport pill may visually collide on very narrow viewports (<360px). Add a `bottom: 88px` shift on the transport for screens below `sm`. Defer to Plan 2 polish.
- Existing `useTimerStore.hydrateFromSettings` runs in `DashboardShell` after server fetch; the new `useCustomizeStore` runs purely client-side. When DB persistence lands in Plan 2, route customize hydration through `DashboardShell` the same way to avoid a client-only flash.
