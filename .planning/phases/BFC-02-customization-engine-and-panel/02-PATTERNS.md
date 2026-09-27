# Phase 2: Customization Engine and Panel - Pattern Map

**Mapped:** 2026-09-27
**Files analyzed:** 20 (5 new, 15 modify/delete)
**Analogs found:** 20 / 20 (several are role-match, not exact - this phase introduces two genuinely new mechanisms: a React-context Zustand store with three parallel values, and a non-modal aside/drawer shell)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/next/src/store/useCustomizeStore.tsx` (new) | store/provider | event-driven | `apps/next/src/store/useTimerStore.tsx` | exact (D-01 explicitly copies this shape) |
| `packages/types/look.ts` (new) | model (Zod schema) | transform | `packages/api/src/db/tables/tasks.ts` (Zod schema shape) + `packages/types/tasks.ts` (bare-interface sibling in the same package) | role-match / first Zod-in-packages/types |
| `apps/next/src/lib/customize/catalog.ts` (new) | config (constants) | transform | `.lavish/customization-prototype.html`'s `FONTS`/`SOLIDS`/`ACCENTS`/`PROGRESS`/`DEFAULT_LOOK` (design reference, not code) - no repo analog | no in-repo analog |
| `packages/ui/src/globals.css` | config (styles) | transform | itself (already has `--bg-image*`/`--bg-overlay-*`/`--bg-blur` tokens to extend) | self / sole-instance |
| `packages/ui/tailwind.config.ts` | config | transform | itself (`colors` block, existing `hsl(var(--x))` entries) | self / sole-instance |
| `apps/next/src/app/layout.tsx` (root) | route (server layout) | request-response | itself (already loads one `next/font/google` family as a CSS var) | self / sole-instance |
| `apps/next/src/components/dashboard/AppBackground.tsx` | component | transform (paint CSS vars) | itself | self / sole-instance |
| `apps/next/src/app/(app)/layout.tsx` | route (server layout) | request-response | `apps/next/src/app/guest/layout.tsx` (sibling provider-nesting layout) | exact (same nesting shape, one is `'use client'`) |
| `apps/next/src/app/guest/layout.tsx` | route (client layout) | request-response | `apps/next/src/app/(app)/layout.tsx` | exact |
| `apps/next/src/components/Footer.tsx` | component | request-response | itself (three-slot flex row) | self / sole-instance |
| `apps/next/src/components/settings/MenuSettings.tsx` | component | request-response | `apps/next/src/components/settings/MenuSettingsMobile.tsx` | exact (desktop/mobile twin) |
| `apps/next/src/components/settings/MenuSettingsMobile.tsx` | component | request-response | `apps/next/src/components/settings/MenuSettings.tsx` | exact |
| `apps/next/src/components/DarkModeToggle.tsx` (delete) | component (delete target) | event-driven | n/a - deletion | n/a |
| `apps/next/src/components/timer/Timer.tsx` | component | event-driven (worker tick) | itself | self / sole-instance |
| `apps/next/src/components/timer/TimeUI.tsx` | component | transform (spring digits) | itself | self / sole-instance |
| `apps/next/src/components/dashboard/TimerProgressRing.tsx` (delete) | component (delete target) | transform | n/a - deletion, replaced by CSS `data-progress` | n/a |
| `apps/next/src/components/sessions/SessionsUI.tsx` | component | transform (grid of divs) | itself (already a grid-of-divs session tracker, D-17 is a paint change not a structural one) | self / sole-instance |
| `apps/next/src/components/settings/SoundSettings.tsx` | component | request-response | itself (hardcoded hex token fix only) | self / sole-instance |
| `apps/next/src/components/customize/CustomizePanel*.tsx` (new, desktop aside + body) | component (panel shell) | event-driven | `packages/ui/src/components/ui/drawer.tsx` (vaul primitives) + `apps/next/src/components/settings/SoundSettings.tsx` (existing "trigger + floating content with Tabs" composition) | role-match (no non-modal aside/drawer precedent exists - new ground) |
| `apps/next/src/hooks/useKeyboardShortcuts.ts` or similar (new/extended) | hook | event-driven | `apps/next/src/hooks/useCommandMenuHooks.tsx`'s `useCommandMenuKeyboard` | role-match |

## Pattern Assignments

### `apps/next/src/store/useCustomizeStore.tsx` (store/provider, event-driven) - D-01, D-02, D-03

**Analog (exact, explicitly named in CONTEXT.md D-01):** `apps/next/src/store/useTimerStore.tsx` - full file already read (175 lines). This is the per-request Zustand pattern established in phase 1 (`01-03-SUMMARY.md`).

**Imports pattern** (lines 1-6):
```typescript
'use client'

import type { Settings } from '@repo/api/db/schemas'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { useStore } from 'zustand/react'
import { createStore } from 'zustand/vanilla'
```
For the new store, swap `Settings` for the new `Look` Zod-inferred type from `packages/types/look.ts`.

**Factory + context + hook pattern to copy verbatim** (lines 29-36, 137-175):
```typescript
function createTimerStore(
  initial: { sessions: number; workDuration: number; breakDuration: number } | null,
) {
  const sessions = initial?.sessions ?? 6
  ...
  return createStore<TimerState>()((set, get) => ({ ... }))
}

type TimerStoreApi = ReturnType<typeof createTimerStore>
const TimerStoreContext = createContext<TimerStoreApi | undefined>(undefined)

function identity(state: TimerState): TimerState {
  return state
}

export function TimerStoreProvider({ initialSettings, children }: { ... }) {
  const [store] = useState(() => createTimerStore(...))
  return <TimerStoreContext.Provider value={store}>{children}</TimerStoreContext.Provider>
}

export function useTimerStore(): TimerState
export function useTimerStore<T>(selector: (state: TimerState) => T): T
export function useTimerStore<T = TimerState>(selector?: (state: TimerState) => T): T {
  const store = useContext(TimerStoreContext)
  if (!store) throw new Error('useTimerStore must be used within a TimerStoreProvider')
  return useStore(store, selector ?? (identity as unknown as (state: TimerState) => T))
}
```
`useCustomizeStore.tsx` follows this shape 1:1: `createCustomizeStore(initialLook)` (D-01 says `initialLook` is always `null` in Phase 2), `CustomizeStoreContext`, `CustomizeStoreProvider`, `useCustomizeStore`. The three-value state (`active`/`preview`/`persisted`) and actions (`openPanel`, `setPreview`, `apply`, `cancel`, `resetPreview`) all live inside the single `createStore<CustomizeState>()((set, get) => ({...}))` call, same as `TimerState`'s actions (`reset`, `toggleTimer`, `updateSettings`, etc. at lines 45-133).

**Where to mount it - copy the exact nesting from `(app)/layout.tsx` and `guest/layout.tsx`:**
```typescript
// apps/next/src/app/(app)/layout.tsx (server, full file, 16 lines)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getUserSettings } from '~/lib/server/getUserSettings'
import { TimerStoreProvider } from '~/store/useTimerStore'

export default async function DashboardLayout({ children }) {
  const settings = await getUserSettings()
  const queryClient = new QueryClient()
  queryClient.setQueryData(['userSettings'], settings)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TimerStoreProvider initialSettings={settings}>{children}</TimerStoreProvider>
    </HydrationBoundary>
  )
}

// apps/next/src/app/guest/layout.tsx (client, full file, 11 lines)
'use client'
import { TimerStoreProvider } from '~/store/useTimerStore'
export default function AppLayout({ children }) {
  return (
    <TimerStoreProvider initialSettings={null}>
      <div>{children}</div>
    </TimerStoreProvider>
  )
}
```
`CustomizeStoreProvider initialLook={null}` nests inside `TimerStoreProvider` in both files (order does not matter since neither reads the other, but nest inside so both dashboard and guest get it - CONTEXT.md's Integration Points explicitly calls out `app/guest/page.tsx` needing the provider too; the provider actually belongs in `guest/layout.tsx`, not `page.tsx`, matching where `TimerStoreProvider` already sits).

**No `persist` middleware precedent** - `useSoundsStore.tsx` and `useToDoStore.tsx` are flat `create<T>()` singletons with no persistence; not relevant here since Phase 2 explicitly defers persistence (out of scope, D-01 note "Phase 3 passes the server-fetched or localStorage look through the same prop").

---

### `packages/types/look.ts` (new) (model, transform) - D-05

**No Zod schema exists anywhere in `packages/types` today** - `packages/types/tasks.ts` (full file, 9 lines) is a hand-written `interface Task`, not a Zod schema, and the package has no `package.json` (it is a raw path-alias target: `apps/next/tsconfig.json:13` → `"@repo/types/*": ["../../packages/types/*"]`). `zod` is not an explicit dependency of `apps/next` or `packages/types` - it resolves only because Bun hoists it to root `node_modules` as a transitive dependency of `packages/api` (`packages/api/package.json:38`, `"zod": "^3.24.1"`). **Flag for the planner:** add `zod` to `apps/next/package.json` dependencies explicitly (matching the version in `packages/api/package.json`) so `bun run check-deps` stays honest even though the hoisted resolution currently works.

**Closest schema-shape analog (different package, same drizzle-zod idiom), `packages/api/src/db/tables/tasks.ts` (full file, 37 lines):**
```typescript
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
...
export type Task = InferSelectModel<typeof tasks>
export const getTaskSchema = createSelectSchema(tasks)
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, ... })
```
This is a table-derived schema, not usable directly (D-05's `Look` has no DB table in Phase 2) - but its **naming convention** (`get*Schema` / `insert*Schema`, and always exporting both a `type` and a `Schema` const from the same file) is the pattern to copy: export `export const lookSchema = z.object({...})` and `export type Look = z.infer<typeof lookSchema>` side by side from `look.ts`, matching how `tasks.ts` colocates `Task`/schemas.

**Discriminated union for `bg.kind`** - no existing Zod discriminated union in the repo to copy from (`packages/api`'s schemas are all flat drizzle-derived tables); this is new ground. Use `z.discriminatedUnion('kind', [z.object({ kind: z.literal('solid'), color: z.string() })])` - plain Zod idiom, no local precedent needed since Zod itself supplies it.

---

### `apps/next/src/lib/customize/catalog.ts` (new) (config, transform) - D-06

**No in-repo analog** - this is a plain constants file (8 solids, 12 accents, 4 fonts, progress/density enums). The only reference is the design prototype `.lavish/customization-prototype.html`'s `FONTS`/`SOLIDS`/`ACCENTS`/`PROGRESS`/`DEFAULT_LOOK` objects (HTML/JS, not TypeScript - transcribe values, do not import). Shape it as flat exported `const` arrays/objects, matching the flat-export style already used in `apps/next/src/lib/*` (no barrel-export convention exists in `~/lib`).

---

### `packages/ui/src/globals.css` (config, transform) - D-04

**Existing tokens to extend (lines 5-16, `:root` block outside any `@layer`):**
```css
:root {
  --font-display: var(--font-app), ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-app), ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Background customization contract - settings page writes to these */
  --bg-image: none;
  --bg-image-size: cover;
  --bg-image-position: center;
  --bg-overlay-color: 0 0% 0%;
  --bg-overlay-opacity: 0;
  --bg-blur: 0px;
}
```
Add the new tokens here, same unlayered `:root` block, same comment-header convention (`/* ... contract - writer... */`): `--bg-solid`, `--user-accent`, `--text-contrast`, `--grain-opacity`, and default `data-progress="edge"` / `data-density="comfortable"` attribute selectors on `html` or `:root` (attribute selectors go as separate rules, e.g. `[data-progress="ruler"] .progress-ruler-tick { ... }`, not custom properties). **D-04 explicitly forbids reusing `--accent`** - do not touch the ShadCN `--accent`/`--accent-foreground` pair at lines 51-52/83-84 inside `@layer base`; those stay wired to `button`/`dropdown-menu`/etc. hover states.

**Do not add a `sans`/`display` font-family for the four new customize fonts here** - `--font-display` already exists and is wired through `tailwind.config.ts`'s `fontFamily.display`; the store just needs to overwrite `--font-display`'s value (or a new `--font-look` var feeding it) rather than declaring new `@font-face`/Tailwind keys.

---

### `packages/ui/tailwind.config.ts` (config, transform) - D-04

**Existing `hsl(var(--x))` color-token pattern to copy exactly (lines 28-61):**
```typescript
colors: {
  border: 'hsl(var(--border))',
  ...
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  ...
}
```
`--user-accent` is stored as a **raw hex** per D-04 ("`--user-accent` (hex...)"), not an HSL triplet like the ShadCN tokens - so its Tailwind entry must NOT wrap in `hsl(var(...))`. Add it as a sibling key using the var directly: `'user-accent': 'var(--user-accent)'`. This deliberately breaks from the surrounding `hsl(var(--x))` convention because the value format differs - flag this for the planner so they don't copy-paste the `hsl()` wrapper by habit.

---

### `apps/next/src/app/layout.tsx` (root layout, request-response) - D-06, Claude's Discretion (font loading)

**Full current file (26 lines) already read above.** Existing single-font pattern to extend to four fonts:
```typescript
import { Inter_Tight } from 'next/font/google'

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-app',
  display: 'swap',
})
...
<html lang='en' className={`dark ${interTight.variable}`} suppressHydrationWarning>
```
Add three more `next/font/google` calls (Fraunces, JetBrains_Mono, Space_Grotesk) each with its own `variable` (e.g. `--font-fraunces`), `preload: false` per CONTEXT.md's Claude's Discretion note (only Inter Tight stays preloaded), and append each `.variable` to the `className` template string alongside `interTight.variable`. This is a Cloudflare-Workers-via-OpenNext app (`apps/next/wrangler.jsonc`, `apps/next/open-next.config.ts`) - `next/font/google` is fully supported by OpenNext/Cloudflare (fonts are fetched/self-hosted at build time, no runtime Node API needed), so no constraint here beyond the existing `keep_names: false` note in `wrangler.jsonc:12` (unrelated, about `next-themes`' inline script, not fonts).

---

### `apps/next/src/components/dashboard/AppBackground.tsx` (component, transform) - D-04 code_context note

**Full current file (56 lines) already read above.** Two concrete edits:
1. Add a solid-color layer reading `--bg-solid` (currently only `bg-background` at line 5 - a new sibling `<div>` with `style={{ backgroundColor: 'var(--bg-solid)' }}` or similar, since D-05's `bg.kind === 'solid'` writes `--bg-solid` directly rather than through the Tailwind `background` utility).
2. Grain opacity: line 41's hardcoded `opacity-[0.05]` className becomes `style={{ opacity: 'var(--grain-opacity)' }}` (move out of the Tailwind class into inline style, following the same inline-style convention already used for `backgroundImage`/`filter`/`backgroundColor` on lines 12-16, 24).
3. Radial atmosphere (lines 33-35) currently reads ShadCN `hsl(var(--accent) / 0.10)` - change to `hsl(var(--user-accent) ...)` - wait, `--user-accent` is a raw hex per D-04, not HSL, so this becomes `color-mix(in srgb, var(--user-accent) 10%, transparent)` or similar hex-aware syntax, not the `hsl(var(--x) / alpha)` idiom used elsewhere in this file.

---

### `apps/next/src/components/Footer.tsx` / `MenuSettings.tsx` / `MenuSettingsMobile.tsx` / `DarkModeToggle.tsx` (component, request-response) - D-07

**Full files already read above.** `Footer.tsx` (14 lines) just renders the three menu components - no change needed there unless the customize trigger needs a fourth slot (it doesn't; it nests inside `MenuSettings`/`MenuSettingsMobile`).

**`MenuSettings.tsx` (desktop, full file, 17 lines):**
```typescript
export default function MenuSettings() {
  return (
    <main className='hidden sm:flex sm:items-center sm:justify-center sm:space-x-1'>
      <ToDoList />
      <SoundSettings />
      <SessionSettings />
      <AccountButton />
      {/* <DarkModeToggle /> */}
    </main>
  )
}
```
Add `<CustomizeButton />` before `<AccountButton />` per D-07 ("before Sign In / account"). The already-commented-out `<DarkModeToggle />` on line 14 confirms desktop never rendered it - safe to delete the comment too.

**`MenuSettingsMobile.tsx` (mobile, full file, 17 lines):** replace line 3's import and line 14's `<DarkModeToggle />` with `<CustomizeButton />` (D-07: "replaces the DarkModeToggle sun button").

**`DarkModeToggle.tsx` (component, delete target)** - lives at `apps/next/src/components/DarkModeToggle.tsx` (not under `settings/`, note the path). Full grep of all references:
```
apps/next/src/components/settings/MenuSettingsMobile.tsx:3,14   <- delete this usage
apps/next/src/components/settings/MenuSettings.tsx:14            <- already dead (commented out)
apps/next/src/components/AccountButton.tsx:17,88                <- commented out (import and JSX), dead
apps/next/src/components/DarkModeToggle.tsx:9                    <- definition
```
**Correction (verified by the plan checker against source):** the `AccountButton.tsx` import (line 17) and `<DarkModeToggle />` render (lines 86-89) are both inside comments, so the only live call site is `MenuSettingsMobile.tsx`. D-07 holds: once 02-06 replaces that usage with `<CustomizeButton />`, `DarkModeToggle.tsx` can be deleted, along with the dead commented references.

**Analog for the new `CustomizeButton` component itself:** `MenuButton` (`apps/next/src/components/helper/MenuButtons.tsx`, full file, 18 lines) is the shared button wrapper every menu icon button uses:
```typescript
import { Button, type ButtonProps } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'

type MenuButtonProps = ButtonProps & { children: React.ReactNode }

export default function MenuButton({ children, className, ...props }: MenuButtonProps) {
  return (
    <Button className={cn('md:w-20 lg:w-24 lg:h-12 xl:h-12 xl:w-32 ', className)} {...props} variant='outline'>
      {children}
    </Button>
  )
}
```
D-19 requires menu buttons to go "bare" (lose outlines) except transport buttons - so the new `CustomizeButton` should NOT use `MenuButton`'s hardcoded `variant='outline'` as-is; copy `DarkModeToggle.tsx`'s Tooltip-wrapping shape (lines 32-49, `TooltipProvider > Tooltip > TooltipTrigger asChild > MenuButton` with a lucide icon child) but override the variant/className per D-19's bare styling, and set the icon color to `var(--user-accent)` per D-07 ("uses a lucide `Palette` icon in the user accent").

---

### `apps/next/src/components/timer/Timer.tsx` / `TimeUI.tsx` (component, event-driven) - D-16, D-18, D-20 (timer scale/hints)

**`Timer.tsx` full file (129 lines) already read above.** It currently renders `<TimerProgressRing />` (line 6, 117) as a sibling absolutely-positioned SVG behind the digits. D-16 deletes `TimerProgressRing.tsx` entirely and replaces it with a `data-progress` attribute-driven CSS treatment - so `Timer.tsx` loses the `<TimerProgressRing />` import/render (lines 6, 117) with nothing replacing it in JSX; the visual now comes purely from `globals.css` rules keyed on `[data-progress="edge|ruler|ink|none"]` set on `document.documentElement` by the store (D-16: "All four are CSS-driven from one `--progress` custom property (0-1) that the timer sets"). `Timer.tsx` must additionally write `--progress` as an inline style or via a `useEffect` similar to how the customize store paints its own vars (D-03) - `elapsed` is already computed in `TimerProgressRing.tsx` (deleted file) at lines 32-33 (`const elapsed = total > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / total)) : 0`) - move this computation into `Timer.tsx` and write it as `document.documentElement.style.setProperty('--progress', String(elapsed))` in a `useEffect` keyed on `timeLeft`/`workDuration`/`breakDuration`/`isWorking`.

**Existing resize-driven responsive sizing pattern to copy for the D-20 timer-scale transform** (lines 102-113):
```typescript
const [widthSize, setWidthSize] = useState('25vw')
const [textSize, setTextSize] = useState('text-[25vw]')

useEffect(() => {
  const handleResize = () => {
    setWidthSize(window.innerWidth < 640 ? '50vw' : '25vw')
    setTextSize(window.innerWidth < 640 ? 'text-[50vw]' : 'text-[25vw]')
  }
  handleResize()
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```
This is the closest existing "compute a CSS value from viewport + a resize listener" shape - the D-20 timer scale formula (`scale = min(.72, (panelFeatherStart - viewportCenterX - gutter) * 2 / timerWidth)`) should be computed the same way: a `useState` + `resize` listener effect, but also re-run when `panelOpen` changes (the customize store's `panelOpen` boolean), applying the result as a `transform: scale(...)` style rather than a Tailwind class swap (scale is continuous, not a breakpoint toggle).

**`TimeUI.tsx` (full file, 58 lines)** - the spring-digit component itself does not need structural changes for this phase; it is the thing being scaled/wrapped by the new transform, not modified internally.

**Keyboard hints (D-18) - no existing hint-text component to copy; closest sibling is `TimerButtons.tsx`'s icon-button row** (see below) for the "under the digits, desktop-only" placement convention (`hidden sm:flex`/`hidden sm:block` responsive classes used throughout this codebase, e.g. `SessionsUI.tsx:42` `className='hidden h-[15vh] sm:block'`).

---

### `apps/next/src/components/dashboard/TimerProgressRing.tsx` (delete target) - D-16

**Full file (91 lines) already read above.** Deleted outright. Its only import site is `Timer.tsx:6,117` (see above). Its `elapsed`/`CIRCUMFERENCE` math (lines 8, 32-33) is the only reusable logic - reuse the `elapsed` formula (not the SVG rendering) inside `Timer.tsx`'s new `--progress` writer, per the note above.

---

### `apps/next/src/components/sessions/SessionsUI.tsx` (component, transform) - D-17

**Full file (194 lines) already read above.** This is already structurally a "grid of divs with border/fill classes driven by index vs `currentSession`" component - D-17 is a **paint-only change**, not a restructure. Current fill logic to repaint (lines 55-64, desktop; nearly identical mobile block at 101-110):
```typescript
className={cn(
  `${isLandscape ? 'h-6 w-6' : 'h-12 w-12'} flex-1 rounded-lg border-2 transition-all duration-300 lg:h-14 lg:w-14`,
  'border-foreground/15 dark:border-foreground/25',
  index <= currentSession - 1
    ? isWorking && currentSession - 1 === index
      ? 'bg-foreground border-foreground shadow-[0_0_0_4px_hsl(var(--foreground)/0.12)]'
      : 'bg-foreground/55 border-foreground/55'
    : '',
)}
```
D-17 asks for: filled cells at `--user-accent` (not `bg-foreground`), current cell at `--user-accent` 45% (not the shadow-ring treatment), upcoming cells at `foreground/8%` (currently borderless-but-empty `''`), and **no outlines** (currently every cell has `border-2 border-foreground/15`). Since `--user-accent` is a raw hex custom property (not an HSL triplet), the fill/current/upcoming states must move from Tailwind's `bg-foreground/NN` opacity-suffix utilities to inline `style={{ backgroundColor: ... }}` using `var(--user-accent)` (and `color-mix()` for the 45%/8% alpha blends), since Tailwind's `bg-color/opacity` syntax only works with HSL-space custom properties already wired through `tailwind.config.ts`'s `colors` block. **Note the pre-existing inconsistent import** at line 5 - `import { cn } from '~/lib/utils'` (app-local re-export) rather than `@repo/ui/lib/utils` used everywhere else (`MenuButtons.tsx:2`, `drawer.tsx:5`, `slider.tsx:4`, `tabs.tsx:4`) - not in scope to fix, just don't copy this file's import style into new files; copy `@repo/ui/lib/utils` instead.

---

### `apps/next/src/components/settings/SoundSettings.tsx` (component, request-response) - D-19 (hex token fix)

**Full file (79 lines) already read above.** The one required fix, line 49:
```typescript
<TabsList className='flex w-full bg-[#d0d1d0] dark:bg-[#2A2523]'>
```
D-19: "moves to tokens" - replace with an existing semantic token, e.g. `bg-muted` or `bg-secondary` (both already theme-aware via `tailwind.config.ts`'s `hsl(var(--muted))`/`hsl(var(--secondary))`), matching how every other surface in this file (`PopoverContent` at line 43: `bg-gradient-to-b from-muted/50 to-muted`) already uses semantic tokens instead of hex. This `Tabs`/`TabsList`/`TabsTrigger` composition (`@repo/ui/tabs`, lines 4, 45-59) is also the direct analog for the new panel's "Sections are pill chips" requirement (D-20) if the planner chooses Radix Tabs under the hood rather than a hand-rolled chip row - see the panel shell note below.

---

### New panel shell: desktop aside + mobile vaul drawer (component, event-driven) - D-11, D-20

**No non-modal aside/drawer precedent exists in this repo.** The closest available primitives:

**`packages/ui/src/components/ui/drawer.tsx` (full file, 121 lines)** - wraps `vaul`'s `Drawer`. Current defaults that MUST be overridden per D-11/D-20 ("no scrim", "not dimmed"):
```typescript
const Drawer = ({
  shouldScaleBackground = true,   // <- D-20 mobile note doesn't ask for background scaling; verify against the board, override if needed
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
...
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/80', className)}   // <- this is the scrim D-11/D-20 forbid
    {...props}
  />
))
```
D-20 explicitly says: "The shell is the existing vaul `drawer` in `packages/ui` with `modal={false}` and no overlay" - so the new panel's mobile shell renders `<Drawer modal={false}>` directly (bypassing `<DrawerOverlay />`/the default `DrawerContent` wrapper, which always renders `<DrawerOverlay />` at line 51) - either add a `withOverlay?: boolean` prop to a **new** `DrawerContent`-like wrapper local to the customize panel (do not change the shared `packages/ui` component's default, since other future consumers may want the scrim), or compose `DrawerPortal > DrawerPrimitive.Content` directly inside the panel's own file, skipping `DrawerOverlay`.

**Closest "trigger opens floating content with internal Tabs" composition for the desktop shell's internal structure** (not the shell itself - the shell is a plain `aside`, not a Radix primitive): `apps/next/src/components/settings/SoundSettings.tsx` (see above) - its `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` nesting (lines 45-73) is the pattern to copy for the panel body's five sections (Theme/Background/Type/Color/Style) if implemented as Radix Tabs styled as pill chips, satisfying D-20's "Sections are pill chips ... not an underlined tab strip" by overriding `TabsList`/`TabsTrigger`'s default classNames (`packages/ui/src/components/ui/tabs.tsx` lines 13-21, 27-36) rather than writing a new tab primitive.

**`packages/ui/src/components/ui/slider.tsx` (full file, 58 lines)** - already the control for any range input (opacity, blur, contrast, grain per D-13's Background/Color/Style sections):
```typescript
<SliderPrimitive.Root className={cn('relative flex w-full touch-none select-none items-center', className)} {...props}>
  <SliderPrimitive.Track className={cn('relative h-2 w-full grow overflow-hidden rounded-full bg-secondary')}>
    <SliderPrimitive.Range className={cn('absolute h-full bg-primary', rangeClassName)} />
  </SliderPrimitive.Track>
  <SliderPrimitive.Thumb className={cn('block h-5 w-5 rounded-full border-2 border-primary ...', thumbClassName)} />
</SliderPrimitive.Root>
```
Already exposes `trackClassName`/`rangeClassName`/`thumbClassName` override props (lines 26-30) - use these to restyle the track to D-20's `rgb(0 0 0 / .22)` segmented-control track look without forking the component.

**`packages/ui/src/components/ui/toggle.tsx` and `tooltip.tsx` exist** (not read in full - straightforward Radix wrappers matching the `tabs.tsx`/`slider.tsx` forwardRef + `cn()` shape above) - use for the Style section's segmented Edge/Ruler/Ink/None and Compact/Comfortable/Roomy controls.

**`packages/ui/src/components/ui/popover.tsx`, `button.tsx` exist and are used throughout** - `button.tsx` (full file, 49 lines, `cva`-based variants) is the base every custom button in this codebase wraps (`MenuButton`, `AlertDialogAction`, etc.) - the panel's Apply/Cancel/Reset footer buttons should use `<Button variant='...'>` directly or through a thin wrapper, not a new button primitive.

---

### Sonner toaster wiring (D-15) - **gap found, not yet wired anywhere**

**Confirmed by exhaustive grep:** `<Toaster` (JSX usage) has **zero** matches anywhere in `apps/next/src`. `packages/ui/src/components/ui/sonner.tsx` (full file, 29 lines) defines and exports a themed `Toaster` wrapper around `sonner`'s `Toaster as Sonner`, but nothing in `apps/next/src/app/layout.tsx` or `apps/next/src/provider/AppProviders.tsx` renders it. Existing `toast(...)`/`toast.error(...)` calls (`useSession.ts`, `useSounds.ts`, `SessionSettingsMobile.tsx`) currently have no mounted `<Toaster />` to render into - **this is a pre-existing gap, not something introduced by this phase, but D-15 ("A small toast confirms Apply and Cancel-with-changes") cannot work until a `<Toaster />` is mounted somewhere in the tree.**

**Fix pattern - mount once, at the root, next to where `AppProviders`/`ThemeProvider` already compose:**
```typescript
// packages/ui/src/components/ui/sonner.tsx (already exists, full file)
import { Toaster as Sonner } from 'sonner'
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  return <Sonner theme={theme as ToasterProps['theme']} className='toaster group' toastOptions={{...}} {...props} />
}
export { Toaster }
```
Add `<Toaster />` inside `apps/next/src/app/layout.tsx`'s existing `<ThemeProvider>`/`<AppProviders>` nest (it needs `next-themes`' `useTheme()`, so it must render under `ThemeProvider`, which already wraps everything) - one line, sibling to `{children}`, not a new provider component.

---

### Keyboard handlers (D-12, D-18) - global `keydown`, ignore inputs/modifiers

**Only existing global-keydown precedent:** `apps/next/src/hooks/useCommandMenuHooks.tsx`'s `useCommandMenuKeyboard` (lines 8-20):
```typescript
export function useCommandMenuKeyboard(setOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open: boolean) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpen])
}
```
This is the shape to copy for `Space`/`R` (D-18) and Esc-closes-panel (D-08): a `useEffect` with a `document.addEventListener('keydown', ...)`/cleanup pair. **This existing handler does not check `e.target`/focus context at all** (it fires globally regardless of what's focused) - D-12 requires the new handler to add a guard the existing one lacks: ignore when `document.activeElement` is a text/color/range/radio input, and ignore any event carrying a modifier key (`e.metaKey || e.ctrlKey || e.altKey || e.shiftKey`) for the Space/R case specifically (note `useCommandMenuKeyboard` itself relies on a modifier for its own shortcut, so the new hook is checking for the *absence* of modifiers, an inverted condition from this analog - do not copy the modifier check verbatim, invert it).

**No `useMediaQuery`/`matchMedia`/`prefers-reduced-motion` precedent exists anywhere in this repo** (confirmed by grep across `apps/next/src`) - the D-20 motion requirements ("Both the stagger and the ping are off under `prefers-reduced-motion`") are new ground; use a small local hook (`window.matchMedia('(prefers-reduced-motion: reduce)')` + a `change` listener, same `useEffect`-with-listener shape as `useIsMobileLandscape.tsx` below) rather than reaching for a new dependency.

**Responsive-hook shape to copy for any new `useIsPanelOpen`/`usePrefersReducedMotion`-style hook:** `apps/next/src/components/helper/useIsMobileLandscape.tsx` (full file, 29 lines):
```typescript
export default function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(false)
  useEffect(() => {
    const updateOrientation = () => {
      requestAnimationFrame(() => { setIsLandscape(...) })
    }
    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
    return () => { window.removeEventListener(...); window.removeEventListener(...) }
  }, [])
  return isLandscape
}
```

## Shared Patterns

### `'use client'` context-store provider (createStore + Context + selector hook)
**Source:** `apps/next/src/store/useTimerStore.tsx` (full file, established in `01-03-SUMMARY.md`).
**Apply to:** `apps/next/src/store/useCustomizeStore.tsx` - identical factory/context/hook shape, three state values instead of one flat state, same "no persist, no module singleton" rule.

### `@repo/ui/lib/utils`'s `cn()` for all className composition
**Source:** used consistently in every `packages/ui/src/components/ui/*.tsx` file (`drawer.tsx:5`, `slider.tsx:4`, `tabs.tsx:4`, `button.tsx:2`) and most `apps/next` components (`MenuButtons.tsx:2`).
**Apply to:** all new panel components. **Do not** copy `SessionsUI.tsx`'s stray `~/lib/utils` import - that is a pre-existing inconsistency, not the convention to propagate.

### Tooltip-wrapped icon button (`TooltipProvider > Tooltip > TooltipTrigger asChild > MenuButton`)
**Source:** `DarkModeToggle.tsx` (lines 32-49), `SoundSettings.tsx` (lines 26-39), `SessionSettings.tsx` (lines 64-77), `TimerButtons.tsx` (lines 32-45 x4).
**Apply to:** the new `CustomizeButton` trigger in the footer menu - same composition, bare/D-19 styling override.

### Semantic color tokens via `hsl(var(--x))`, never hardcoded hex
**Source:** `tailwind.config.ts`'s entire `colors` block (lines 28-61); the one violation being fixed this phase is `SoundSettings.tsx:49`.
**Apply to:** every new/modified component. **Exception:** `--user-accent` is deliberately a raw hex custom property per D-04 - components consuming it use `var(--user-accent)` directly or `color-mix()`, not the `hsl(var(--x))` wrapper.

### Global `keydown` listener via `useEffect` + `document.addEventListener`/cleanup
**Source:** `useCommandMenuHooks.tsx`'s `useCommandMenuKeyboard` (lines 8-20).
**Apply to:** the new Space/R/Esc handler (D-08, D-12, D-18) - copy the effect/cleanup shape, invert the modifier check, add an active-element/input-type guard this analog lacks.

### sonner `toast(...)` calls assume a mounted `<Toaster />` that does not yet exist
**Source:** `packages/ui/src/components/ui/sonner.tsx` (defined, unused); consumers: `useSession.ts`, `useSounds.ts`, `SessionSettingsMobile.tsx`.
**Apply to:** mount `<Toaster />` once in `apps/next/src/app/layout.tsx` inside `ThemeProvider` - this fixes D-15's toast requirement AND retroactively fixes the pre-existing silent-toast gap for every other `toast()` call site in the app (a welcome side effect, not scope creep, since it is a one-line addition to a file already being touched for font loading).

## No Analog Found

| File/Concern | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/next/src/lib/customize/catalog.ts` | config | transform | No constants-catalog file exists under `~/lib` today; only design reference is the non-TS prototype HTML. Transcribe values fresh. |
| Non-modal `aside`/drawer shell (`modal={false}`, no overlay, feathered blur mask) | component | event-driven | No non-modal panel exists in this repo - every existing `Popover`/`Drawer` usage (`SoundSettings.tsx`, `SessionSettings.tsx`, mobile drawers) is modal-by-default. This is genuinely new UI territory; only the sub-primitives (`Tabs`, `Slider`, `Toggle`, `Drawer` internals) have analogs, not the composed shell. |
| `prefers-reduced-motion` / `matchMedia` handling | hook | event-driven | Zero existing usage anywhere in `apps/next/src` - confirmed by grep. Build fresh, following the `useIsMobileLandscape.tsx` resize-listener shape. |
| Zod discriminated union (`bg.kind`) | model | transform | No discriminated union exists in any `packages/api` schema (all flat drizzle-derived tables) or `packages/types`. Plain Zod idiom, no local precedent needed. |
| CSS `color-mix()` / hex-based custom-property alpha blending | config | transform | Every existing color token in `globals.css`/`tailwind.config.ts` is HSL-triplet based (`hsl(var(--x) / alpha)`); `--user-accent`/`--panel-surface`/etc. being raw hex per D-04/D-20 means `color-mix(in srgb, ...)` is a new CSS idiom for this codebase, not a copy-paste from an existing rule. |

## Metadata

**Analog search scope:** `apps/next/src` (store, app/(app), app/guest, components/{dashboard,settings,timer,sessions,customize,helper}, hooks), `packages/ui/src` (globals.css, tailwind.config.ts, components/ui/{drawer,slider,tabs,button,sonner}), `packages/api/src/db/tables/tasks.ts` (Zod-schema-shape reference), `packages/types/tasks.ts`, `apps/next/wrangler.jsonc` + `open-next.config.ts` (Cloudflare/OpenNext constraints), `.lavish/customization-prototype.html` + `.lavish/customize-panel-directions.html` (design references, read via CONTEXT.md quotes, not re-read here).
**Files scanned:** 24 read in full; grep sweeps for `sonner`/`Toaster`, `DarkModeToggle`, `@repo/types`, `keydown`/`matchMedia`, `zod` dependency location.
**Key gaps found during verification (not assumed from CONTEXT.md):**
- `sonner`'s `<Toaster />` is defined but never mounted anywhere - D-15 needs this fixed as part of this phase.
- `DarkModeToggle` references in `AccountButton.tsx` are commented out; `MenuSettingsMobile.tsx` is the only live call site (D-07 holds).
- `zod` is not a declared dependency of `apps/next` or `packages/types` (only reachable via Bun's hoisting from `packages/api`) - the new `look.ts` schema file depends on this transitive resolution continuing to work.
- `next/font/google` is fully compatible with the Cloudflare-Workers-via-OpenNext deploy target already in place (`apps/next/wrangler.jsonc`, `open-next.config.ts`) - no blocker for the four-font loading requirement.
**Pattern extraction date:** 2026-09-27
