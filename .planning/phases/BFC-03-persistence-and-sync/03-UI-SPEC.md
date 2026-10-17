---
phase: 03
slug: persistence-and-sync
status: draft
shadcn_initialized: true
preset: not applicable (packages/ui/components.json, style default, baseColor zinc, cssVariables)
created: 2026-10-16
---

# Phase 03 - UI Design Contract: Persistence and Sync

> Sources: 03-CONTEXT.md "Captain Picks" (locked), ROADMAP Phase 3 (ENG-05, SYN-01..03, SYN-05),
> Phase 3 picks board (Lavish session http://127.0.0.1:4387/session/a7eb694b47d9fd36, file in the
> planner's scratchpad, not committed). Picked: UI-1 **A error toast**, UI-2 **A nothing**,
> UI-3 **B one line above Revert / Done**, UI-4 **A toast once per visit**.
> Values marked **(discretion)** are planner picks inside Claude's Discretion.
> Dark only: root `<html>` is always dark.

Rejected on the board (do not build): UI-1 B amber dot on the Customize button, UI-1 C silent
failure, UI-2 B "Look saved." toast, UI-3 A no note, UI-3 C header label swap, UI-4 B warning line
in the panel, UI-4 C silent.

Phase 3 is mostly invisible. The visible surface is four things: the first frame already wears the
saved look, one guest-only note in the Customize panel, and two toasts.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (existing, vendored in `packages/ui`) |
| Toasts | `sonner` via `@repo/ui/sonner` `<Toaster />`, already mounted once in `apps/next/src/app/layout.tsx` (theme dark, default position bottom right). Call `toast.error(...)` / `toast(...)` from `sonner`, as `useSounds.ts` and `RecordRoomBody.tsx` do. No new Toaster, no custom toast component. |
| Link | `next/link` `Link` |
| Icon library | none added |
| Font | `var(--font-app)` (panel already sets it) |
| Styling | Existing `apps/next/src/components/customize/customize-panel.module.css`: one new class `.note`, one new phone row. No new global tokens. |
| Motion | none |

---

## 1. First frame (ENG-05)

| Property | Value |
|----------|-------|
| Signed-in dashboard `/` and guest `/guest` | The first painted frame uses the saved look's background colour, overlay, blur, accent, contrast, grain, display font, timer progress style and density. No frame of the default look before it. |
| Fonts | The saved display font family is set on the first frame. The `next/font` files may still swap in (that is font loading, not a look flash). |
| Customize panel | Opens showing the saved look as the starting preview, and Revert goes back to it. |
| No saved look | Exactly today's default look. |

There is no loading state, spinner or placeholder for the look. If the guest cache cannot be read
the page shows the default look.

---

## 2. Guest note (UI-3 B)

Shown only when the panel is in guest mode (`/guest`). Signed-in users never see it.

### Copy

`Saved in this browser.` followed by a space and `Sign in to keep it on every device.` where the
words **Sign in** are a `Link` to `/sign-in`. One sentence pair, no icon.

### Desktop (inspector, >= 1024px)

```
| ... body (scrolls) ...                       |
|----------------------------------------------|  border-top 1px var(--panel-hair) (existing .foot)
| Saved in this browser. Sign in to keep it    |  .note
| on every device.                             |
| [<- Revert]                          [Done]  |  existing .foot row
+----------------------------------------------+
```

| Property | Value |
|----------|-------|
| Placement | Inside the existing `.foot`, above the Revert / Done row. `.foot` becomes `flex-wrap: wrap` with the note as a full-width first item (`flex-basis: 100%`) (discretion: wrap instead of a new grid row keeps one foot element). |
| Text | 12.5px, line-height 1.45, weight 400, `color: var(--panel-muted)` |
| Spacing | `padding: 0 2px 10px` on the note, so it lines up with the Revert label and sits 10px above the buttons |
| Link | `color: hsl(var(--foreground))`, weight 500, `text-decoration: underline`, `text-underline-offset: 2px`, `text-decoration-color: var(--panel-hair)`; hover `text-decoration-color: currentColor`; focus-visible `box-shadow: var(--panel-ring)`, `border-radius: 4px`, `outline: none` |
| Wrap | Wraps to two lines inside the 360px card (as drawn). Never truncates. |

### Phone (sheet, < 1024px)

Revert and Done live in the sheet head, so the phone has no foot today.

| Property | Value |
|----------|-------|
| Placement | New last grid row of `.sheet` (`grid-template-rows: auto auto auto minmax(0, 1fr) auto` in guest mode only; signed-in keeps today's four rows) holding the same `.note` element |
| Spacing | `padding: 10px 20px 12px`, `border-top: 1px solid var(--panel-hair)` |
| Text, link | Same as desktop |
| Height budget | At 390px wide the note is two lines (about 46px with padding). The body row keeps `minmax(0, 1fr)`, so the list scrolls a little sooner and nothing clips. |

### Accessibility

- The note is plain text in the panel's DOM order: after the controls on desktop (before Revert),
  after the list on phone. No live region; it never changes while open.
- The link is reachable by Tab inside the panel's focus trap; Enter follows it. Its click handler
  calls the panel's `close()` (apply) before navigating, so the look is saved first. The route-leave
  effect in `CustomizePanel` cannot do this here: `/sign-in` is outside the guest layout, so the
  panel unmounts instead of seeing a new pathname.

---

## 3. Signed-in save failed (UI-1 A)

| Property | Value |
|----------|-------|
| Trigger | A signed-in save request fails (network error, non-2xx). One toast per failed save attempt that the queue gives up on, not per retry inside one attempt (there are no retries inside one attempt). |
| Call | `toast.error("Couldn't save your look. It stays on this screen. We'll try again next time you change it.")` |
| Dedupe | `id: 'look-save-failed'`, so a second failure while the first toast is still visible replaces it instead of stacking |
| Screen state | The look stays painted. The panel stays closed (the save goes out after Done). `persisted` does not move, so the next Done that differs from it saves again. |
| Success after a failure | No toast (UI-2 A). The failure toast is not dismissed early; it times out normally. |

## 4. Save succeeded (UI-2 A)

Nothing on screen. No toast, no badge, no text change.

## 5. Guest storage blocked (UI-4 A)

| Property | Value |
|----------|-------|
| Trigger | The first guest save in this page load where the browser-storage write returns false (storage missing or throwing: Safari private mode, blocked site data, quota). |
| Call | `toast("This browser isn't saving your look. Private browsing can block storage.")` (neutral toast, not error: nothing the user did is wrong) |
| Frequency | Once per page load (module-level flag). Later failing saves in the same visit are silent. A reload can show it again. |
| Screen state | The look stays painted for this visit. The guest note (section 2) still shows. |

---

## Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| note bottom gap (desktop) | 10px | note to Revert / Done row |
| note side inset (desktop) | 2px inside the 12px / 14px foot padding | aligns with the Revert label |
| note padding (phone) | 10px 20px 12px | matches `.body` side padding 20px |

## Typography

| Role | Size | Weight | Line height | Colour |
|------|------|--------|-------------|--------|
| Note text | 12.5px | 400 | 1.45 | `var(--panel-muted)` |
| Note link | 12.5px | 500 | 1.45 | `hsl(var(--foreground))` |
| Toasts | sonner defaults from `@repo/ui/sonner` | - | - | - |

## Color

No new colours. The note uses the panel's existing `--panel-muted`, `--panel-hair` and
`--panel-ring`; toasts use the shared Toaster classes.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Guest note | Saved in this browser. Sign in to keep it on every device. |
| Guest note link text | Sign in |
| Save failed toast | Couldn't save your look. It stays on this screen. We'll try again next time you change it. |
| Storage blocked toast | This browser isn't saving your look. Private browsing can block storage. |

Straight apostrophes in source are fine; the rendered text uses the copy above verbatim. No em
dashes.

---

## Component Inventory (for the planner)

| File | Change |
|------|--------|
| `apps/next/src/components/customize/CustomizePanelBody.tsx` | Render `<p className={styles.note}>` with the Link when `mode === 'guest'` (from `useCustomizeStore`): inside `.foot` on desktop, as the last child on phone |
| `apps/next/src/components/customize/customize-panel.module.css` | `.note`, `.note a`, `.foot { flex-wrap: wrap }`, `.sheet[data-guest]` five-row template and `.sheet .note` padding and border |
| `apps/next/src/components/customize/CustomizePanelMobile.tsx` | `data-guest` on the sheet when in guest mode (discretion: attribute, so the CSS owns the row template) |
| `apps/next/src/store/useCustomizeStore.tsx` | The two toasts are raised from the save path (03-04 exposes the error hooks; 03-05 wires the copy) |

## Registry Safety

No new shadcn components, no third-party registry, no new dependency.

## Checker Sign-Off

- [x] Every visible change traces to a captain pick or to ENG-05
- [x] Rejected options listed and excluded
- [x] Copy matches the board verbatim
- [x] Phone and desktop placements both specified
- [x] Keyboard path and focus style specified for the only interactive element (the link)
