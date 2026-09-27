# Phase 2: Customization Engine and Panel - Context

**Gathered:** 2026-09-26
**Status:** Ready for planning. Panel direction D (Feathered dock) picked by the owner on 2026-09-27 (D-20).

<domain>
## Phase Boundary

Phase 2 adds a customization engine and a customize panel to the dashboard (`/` and `/guest`).

- **The engine** is a client store. It holds three looks - active, preview and persisted - and writes the look onto the document root as CSS custom properties and data attributes.
- **The panel** opens from the footer menu. It edits every one of the ten customizable surfaces with live preview. Apply commits the change and Cancel reverts it.
- **Dashboard chrome changes locked in the prototype review** also ship here: the accent contribution grid with a fade while running, Edge / Ruler / Ink / None progress replacing the ring, keyboard hints with Space / R, bare menu buttons, and the accent customize button.

Out of this phase:
- Persistence of any kind. Nothing survives a refresh until Phase 3.
- The no-flash first render. ENG-05 is traced to Phase 3.
- Saved and curated themes (Phase 4).
- Uploads (Phase 5) and URL backgrounds (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Engine and state model (ENG-01..04)
- **D-01:** One Zustand vanilla store, `apps/next/src/store/useCustomizeStore.tsx`. It copies the `TimerStoreProvider` shape: `createStore` inside `useState`, a context, and a selector hook.
  - The provider takes an `initialLook` prop that is always `null` in Phase 2.
  - Phase 3 passes the server-fetched or localStorage look through the same prop, so the Phase 1 rule "the server layout is the single hydration owner" (FND-05) still holds.
- **D-02:** The store holds three `Look` values:
  - `active`: what the dashboard shows when the panel is closed.
  - `preview`: a copy of `active` taken when the panel opens, which every control edits.
  - `persisted`: what storage has. In Phase 2 it equals `DEFAULT_LOOK` and is never written.
  - Actions: `openPanel`, `setPreview(key, value)`, `apply`, `cancel`, `resetPreview`.
  - `apply` sets `active = preview`. Phase 3 adds the write to `persisted` inside `apply`, so the call sites do not change.
- **D-03:** The painted look is `panelOpen ? preview : active`. A single effect in the provider writes it onto `document.documentElement`.
  - No component reads the look to style itself. Everything styles off the CSS variables and data attributes, so live preview costs one style write per change.
- **D-04:** Token names on the root. ENG-01 writes `--accent`, but `--accent` is already the ShadCN hover/surface token (`packages/ui/src/globals.css:83`). `button`, `dropdown-menu`, `select`, `command`, `toggle` and `dialog` all use it, so repainting it with a user color would tint every hover state. The user accent therefore uses a new token, and ENG-01 is satisfied in intent. The full set:
  - `--bg-solid`
  - the existing `--bg-overlay-color`, `--bg-overlay-opacity` and `--bg-blur`
  - `--user-accent` (hex, exposed to Tailwind as `colors.user-accent`)
  - `--text-contrast` (0.55-1, applied as foreground alpha)
  - `--grain-opacity`
  - `--font-display`
  - `data-progress` (`edge | ruler | ink | none`) and `data-density` (`compact | comfortable | roomy`)
  - The planner should confirm this rename in REQUIREMENTS.md wording and not reintroduce `--accent`.
- **D-05:** The `Look` shape follows the prototype's `DEFAULT_LOOK`: `{ version: 1, bg: { kind: 'solid', color }, overlayColor, overlayOpacity, blur, font, accent, contrast, progress, density, grain }`.
  - Validate it with a Zod schema in `packages/types` so Phase 3 can reuse it for the API and localStorage.
  - `bg.kind` is a discriminated union. Phase 2 implements only `solid`, and Phase 5 / 6 add `image`, `video` and `url`.
  - The default solid is the current dashboard background `hsl(0 0% 6.3%)`, so a default look renders exactly as today.
- **D-06:** Catalog constants live next to the store (`apps/next/src/lib/customize/catalog.ts`), taken from the prototype:
  - 8 solids: Ink, Stone, Slate, Moss, Plum, Umber, Night, Paper dark.
  - 12 accents.
  - 4 fonts: Inter Tight (current), Fraunces (editorial serif), JetBrains Mono, Space Grotesk (display sans).
  - Progress options Edge / Ruler / Ink / None, and density options.

### Panel behaviour (UX-01..06, ENG-04)
- **D-07:** The entry point is a customize button in the footer menu. It uses a lucide `Palette` icon in the user accent.
  - Desktop: it sits before Sign In / account.
  - Mobile: it replaces the `DarkModeToggle` sun button. The app is dark only (PROJECT.md), so that toggle is dead weight.
  - The `DarkModeToggle` component is deleted if nothing else uses it.
- **D-08:** Closing always means Cancel. The close button, `Esc`, Cancel, the trigger button (while open) and route change all revert the preview silently. There is no "discard changes?" confirm. A "Previewing changes" label with an accent dot in the panel header is the only dirty signal.
- **D-09:** Apply commits and closes. Apply is disabled while `preview` deep-equals `active`.
- **D-10:** Reset to default fills `preview` with `DEFAULT_LOOK`. It is a preview like any other change and still needs Apply (CTL-10: "one action" to get the dashboard back to default, then confirm). Reset is disabled when the preview already equals the default.
- **D-11:** No scrim and a non-modal panel. Dimming the dashboard would falsify the preview.
  - Focus moves to the panel heading on open and returns to the trigger on close.
  - Tab order stays inside the panel only on mobile, where the sheet covers the chrome.
  - The panel has `role="dialog"`, `aria-modal="false"` and a labelled heading. Sections use ARIA tabs, and every swatch is a labelled radio.
- **D-12:** The dashboard stays live while the panel is open. `Space` and `R` still work unless focus is in a text or color input or on a radio or range control, because Space toggles a radio and arrow keys move a range.
- **D-13:** The sections are exactly Theme, Background, Type, Color and Style (UX-03). Each is a separate component rendered from one section registry, so Phase 4 fills Theme and Phase 5 / 6 extend Background without restructuring the panel. Contents:
  - **Theme:** a "Current look" row showing a mini swatch of the preview. It reads "Default", or "Custom look (unsaved)" once the preview differs from the default. Below it, an empty state explaining that presets and saved themes arrive later. It gets no Phase-4 placeholder controls.
  - **Background:** 8 solid swatches, a custom color, overlay tint color, overlay opacity and blur. Blur carries a hint that it only shows on image and video backgrounds, which arrive in Phase 5.
  - **Type:** 4 font cards, each rendering "17:42" in its own face.
  - **Color:** 12 accent swatches, a custom color, and a text-contrast slider.
  - **Style:** segmented controls for progress (Edge, Ruler, Ink, None) and density (Compact, Comfortable, Roomy), plus a grain slider.
- **D-14:** The panel surface is solid `hsl(var(--popover))` with a 1px white/8% border. The panel UI always uses Inter Tight and the neutral foreground, never the user font or accent, so the controls stay readable whatever the look.
- **D-15:** A small toast confirms Apply and Cancel-with-changes. It uses the existing `sonner` component in `packages/ui` and the copy "Look applied" and "Changes discarded".

### Dashboard chrome (CTL-07, CTL-11, CTL-12, CTL-13)
- **D-16:** `TimerProgressRing.tsx` is deleted. The progress style comes from `data-progress` on the root:
  - **Edge:** a 4px bar on the viewport's bottom edge in the user accent, over an 8% foreground track.
  - **Ruler:** 25 ticks under the digits, every fifth one taller. Elapsed ticks take the accent and the current tick is full height.
  - **Ink:** the digits fill left to right with a dimmed accent via `background-clip: text`.
  - **None:** nothing.
  - All four are CSS-driven from one `--progress` custom property (0-1) that the timer sets.
- **D-17:** The session tracker becomes a contribution grid.
  - Completed cells are filled with the accent and the current cell with the accent at 45%. Upcoming cells use foreground at 8%. There are no outlines.
  - While a session runs, the header, grid and footer chrome fade to 0 opacity after about 2s. They return on pointer move, key press or focus-within, and stay visible while the panel is open.
- **D-18:** Keyboard hints `Space pause/start` and `R reset` sit under the digits in mono at 42% foreground, on desktop only. The footer transport pill stays. The key handlers are global (`keydown` on `window`), respect D-12, and ignore events that carry modifiers.
- **D-19:** Menu buttons go bare. They lose their outlines, icons use muted foreground and go full foreground on hover, and the customize icon uses the user accent. Transport buttons keep their outlines. `SoundSettings.tsx`'s hardcoded `bg-[#d0d1d0] dark:bg-[#2A2523]` moves to tokens.

### Panel form - DECIDED: D. Feathered dock
- **D-20:** The owner picked **Direction D, Feathered dock** on the Lavish board `.lavish/customize-panel-directions.html` (2026-09-27). It is A's geometry restyled after the owner's reference (the "AI Companion" sidebar from bestdesignsonx).
  - **Desktop shell:** a borderless 520px right `aside`, full viewport height, no radius, no shadow. The first 120px are a feather: the background is `linear-gradient(90deg, transparent, var(--panel-surface) 120px)` and a `::before` layer 150px wide carries `backdrop-filter: blur(10px)` under a `mask: linear-gradient(90deg, transparent, #000 80%, transparent)` so the dashboard fades and blurs into the panel. The controls sit on the opaque 372px column after the feather (right padding 28px).
  - **Panel surface:** `--panel-surface: color-mix(in srgb, var(--bg-solid), #fff 3.5%)`, so it follows the previewed background. This refines D-14 for D: the panel font stays Inter Tight and the neutral foreground, never the user font or accent, but its surface tracks `--bg-solid` instead of `--popover`. Local tokens: `--panel-soft` white 4.5% (group fills), `--panel-lift` white 8.5% (selected / lifted element), `--panel-hair` white 7% (hairlines).
  - **Groups and controls:** each control group is a soft-filled block (radius 18px, no outline). Sections are pill chips (radius 10px, the selected chip lifted), not an underlined tab strip. One element per view is lifted: the selected segment, the selected font card, the current-look row. Segmented controls sit on a `rgb(0 0 0 / .22)` track.
  - **Motion:** the aside slides in from `translateX(40px)` with opacity over 450ms `cubic-bezier(.2,.7,.2,1)`. Section content blurs in with a top-down stagger (500ms, 60ms steps, capped at the 5th child) on open and on section switch. The "Previewing changes" dot pings once when the preview first becomes dirty. Both the stagger and the ping are off under `prefers-reduced-motion`, and the slide and timer scale become instant.
  - **Timer:** it always stays centered in the viewport and only scales. `scale = min(.72, (panelFeatherStart - viewportCenterX - gutter) * 2 / timerWidth)`, where `panelFeatherStart = viewportWidth - 520`. That is about .42 at 1440x900 and hits the .72 cap at 1920x1080 (the timer is sized by viewport height). The key hints (D-18) fade out while the panel is open, since at that scale they would render at about 5px. The wordmark and menu fade under the feather and are not covered by an opaque card.
  - **Apply / Cancel:** a footer at the bottom of the controls column. Reset to default on the left, Cancel and Apply on the right. There is no divider line: the footer background is `linear-gradient(0deg, var(--panel-surface) 70%, transparent)` so scrolling content fades out under it. The header carries the close button and the "Previewing changes" dot (D-08).
  - **Mobile:** a bottom sheet at 60% of the viewport height, no scrim. Its top 34px feathers the same way (vertical gradient to the surface by 64px, a 48px blur band). The header, progress edge and footer chrome fade out while it is open, and the timer rises and scales into the 40% above the sheet: `scale = min(.72, (viewportHeight - sheetHeight - 40) / timerHeight)`. The shell is the existing vaul `drawer` in `packages/ui` with `modal={false}` and no overlay, so the preview is not dimmed (D-11).
  - Rejected: A (docked 400px card, timer shifted left), B (bottom tray, fixed 330px, columns) and C (floating card, per-section resize, 3 snap points). The comparison table on the board is the record.

### Claude's Discretion
- Font loading: all four families come through `next/font/google` in the root layout as CSS variables. Only Inter Tight is preloaded, and the other three use `preload: false`.
- Whether the desktop aside and the mobile vaul drawer share one content component or two thin shells around one body. The body (header, section chips, sections, footer) must be one component either way.
- Transition timing: the prototype uses 450ms `cubic-bezier(.2,.7,.2,1)` for the timer, and it is honored with `prefers-reduced-motion`.
- The narrow-desktop timer fallback: when the centered scale would fall below 0.4, just under the reviewed .42 (the feather would reach the timer), the timer centers in the free area left of the feather instead. Specified in 02-UI-SPEC.md, flagged to the owner in the PR.
- The exact chrome-fade delay and density scale factors. The prototype's scale factors are 1.07, 1 and 0.86.
- The file split of the panel components.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` §Phase 2 - goal, success criteria, and the four planning notes (ENG-01 substrate, locked prototype decisions, Theme section structural, SoundSettings hex fix)
- `.planning/REQUIREMENTS.md` - ENG-01..04, CTL-01..13, UX-01..06 (ENG-05 is Phase 3)
- `.planning/PROJECT.md` §Key Decisions - solid-only backgrounds, Edge progress, footer entry plus Apply / Cancel, dark only

### Design references
- `.lavish/customization-prototype.html` - the accepted prototype, with catalog values (`FONTS`, `SOLIDS`, `ACCENTS`, `PROGRESS`, `DEFAULT_LOOK`), progress styles, the contribution grid and hints
- `.lavish/customize-panel-directions.html` - the panel direction board (D-20). Direction D's CSS (`.stage[data-dir="D"]` and `.m[data-dir="D"]` rules) is the visual reference for the shell, surface, groups, motion and mobile sheet. Frames of the owner's reference are in `.lavish/assets/ref-*.jpg`.

### Prior phase
- `.planning/phases/BFC-01-foundation-repair/01-CONTEXT.md` - Tailwind 3.4 stays, `--border` value kept, single hydration owner
- `.planning/phases/BFC-01-foundation-repair/01-03-SUMMARY.md` - `TimerStoreProvider` hydration pattern that D-01 copies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/ui/src/globals.css`: `--bg-image*`, `--bg-overlay-color`, `--bg-overlay-opacity` and `--bg-blur` already exist. The store becomes their writer.
- `apps/next/src/components/dashboard/AppBackground.tsx`: consumes the bg vars. It needs a solid layer reading `--bg-solid`, and its grain `opacity-[0.05]` changes to `var(--grain-opacity)`. Its radial atmosphere reads the ShadCN `--accent` and should read the user accent.
- `packages/ui/src/components/ui/`: `drawer` (vaul), `tabs`, `slider`, `toggle`, `sonner`, `button` and `tooltip` exist. There is no `sheet`.
- `apps/next/src/store/useTimerStore.tsx`: the provider and context pattern to copy.

### Established Patterns
- Server layout `app/(app)/layout.tsx` is the single hydration owner, wrapping children in `TimerStoreProvider`. `CustomizeStoreProvider` nests there.
- Root `layout.tsx` sets `--font-app` via `next/font` Inter_Tight, and the Tailwind `sans` / `display` / `mono` families read CSS vars.
- Biome 2, single quotes, no semicolons, JSX single quotes. There is no test runner (CLAUDE.md), so verification is a dev server plus a browser.

### Integration Points
- `components/Footer.tsx`, `components/settings/MenuSettings.tsx` and `MenuSettingsMobile.tsx` host the customize trigger, and `DarkModeToggle.tsx` is replaced.
- `components/timer/Timer.tsx` and `TimeUI.tsx` host the progress, hints and density scale. `components/dashboard/TimerProgressRing.tsx` is removed.
- `components/sessions/SessionsUI.tsx` becomes the contribution grid.
- `app/guest/page.tsx` renders the same dashboard, so it needs the provider too.

</code_context>

<specifics>
## Specific Ideas

- The board replicas were measured from the running app at 1440x900 and 390x844 (`.lavish/assets/guest-*.png`). Reuse those numbers when judging UX-05.
- A tweaked look shows as "Custom look (unsaved)" in Theme. That wording is the Phase 4 hand-off point.

</specifics>

<deferred>
## Deferred Ideas

- Persisting the look across refresh and devices, and the no-flash first paint: Phase 3.
- Named saved themes and curated presets filling the Theme section: Phase 4.
- Image and video upload tiles in Background, where blur gets visible: Phase 5.
- URL background input and warning: Phase 6.
- Light theme: out of scope (dark only).

</deferred>

---

*Phase: 02-customization-engine-and-panel*
*Context gathered: 2026-09-26*
