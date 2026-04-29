# Dashboard Customization — Design Spec

**Status:** Draft (ready for implementation planning)
**Date:** 2026-04-29
**Author:** Brainstormed with Claude

## Goal

Let users personalize the focus dashboard — backgrounds (curated, uploaded, or linked URL), typography, color, timer style, layout density, and atmospheric grain — and save multiple named themes they can switch between. Guests can customize using curated and solid options; signed-in users get persistent storage, sync across devices, and the ability to upload their own media.

## Non-goals (v1)

- Public theme sharing or theme marketplace.
- Per-session theme overrides (themes are user-wide; one active at a time).
- Server-side video transcoding or downscaling on read.
- Video poster (still-frame) generation.
- Total-MB storage cap (only file-count quota in v1).
- Light theme variants (dark only — `<html class='dark'>` is hardcoded).

## Scope (v1)

10 customizable surfaces plus theme management and uploads:

1. **Background image** — pick from curated, uploaded, or pasted URL.
2. **Background video** — pick from curated, uploaded, or pasted URL.
3. **Typography** — choose from 4 curated families.
4. **Accent color** — swatches + custom HSL.
5. **Text color / contrast** — foreground intensity slider.
6. **Timer style** — ring style (dashed / solid / off).
7. **Layout density** — compact / comfortable / roomy.
8. **Grain / atmosphere intensity** — slider.
9. **Theme presets** — curated themes as starting points.
10. **Reset to default** — single button restoring defaults.

Plus:

- **Saved themes** — users can save current customizations as a named theme and switch between them.
- **Media uploads** — users can upload their own background images/videos to R2.
- **URL-paste backgrounds** — paste a remote image/video URL with a "may break" warning.

## User flow

1. User clicks the **Customize** gear in the left vertical rail (or the bottom-left gear on mobile).
2. The **inline floating panel** opens above the transport pill, defaulting to the **Theme tab**.
3. User picks a curated preset → its values load into the editor (panel state preview).
4. User tweaks controls in any tab → dashboard reflects changes live as preview state.
5. User clicks **Apply** to commit, or **Cancel** / closes panel to revert to the active theme's saved state.
6. User clicks **+ Save current** to capture the current preview as a new named theme (auto-named "My theme N", renamable later).
7. User clicks any saved theme to load it into the editor (Apply still required to commit as active).

## Layout

### Desktop / Tablet (≥ 768px)

- Left edge: **floating vertical glass pill** containing tool icons (To-do, Sounds, Account, Customize gear). Vertically centered, ≥ 24px from the edge to avoid iOS edge-swipe.
- Bottom-center: existing transport pill (skip-prev, play/pause, reset, skip-next).
- Top-left: session pip indicators (existing).
- Top-right: italic session label (existing).

### Mobile (< 768px)

- Bottom-left: single **gear icon** in a glass pill.
- Bottom-center: transport pill (existing).
- Tap the gear → **bottom sheet** slides up containing the customize panel (same tabs, same content as desktop, full-width).

### Customize panel (P3 inline floating panel)

- Anchored bottom-center, above the transport pill.
- Three height modes:
  - **Slim** — single-row controls (Color tab). Width ~56% of viewport.
  - **Medium** — multi-row controls or 2x2 grids (Type tab). Width ~60%.
  - **Tall** — image grids + sliders (Background tab). Width ~64%, may overlap timer with translucent background.
- Tab row at the top: **Theme · Background · Type · Color · Style**.
- Footer always visible: **↻ Reset to default** (left), **Cancel** + **Apply** (right).
- Closing the panel without clicking Apply or Cancel is treated as Cancel (preview reverts to active theme).

## Behavior

### Apply / Cancel semantics

- Three customization states exist:
  - **Active theme** — the currently-saved set of values applied to the dashboard.
  - **Preview state** — what's shown live while the panel is open, may differ from active.
  - **Persisted state** — what's stored in DB / localStorage.
- Opening the panel: preview state is initialized from active theme.
- Tweaking controls: preview state updates immediately; dashboard reflects it via CSS variables.
- **Apply**: preview → active theme → persisted state.
- **Cancel** (or close panel): preview reverts to active theme; nothing is persisted.
- **+ Save current**: preview is captured as a *new* theme record (does not become active until user clicks the new theme + Apply).

### Live preview implementation

- Continuous values map to CSS custom properties on `<html>`:
  - `--bg-image`, `--bg-image-size`, `--bg-overlay-color`, `--bg-overlay-opacity`, `--bg-blur` (already exist in `globals.css`).
  - `--font-app`, `--font-display` (already wired via `next/font`).
  - `--accent` (existing token).
  - New: `--text-contrast` (0..1), `--grain-opacity` (0..1).
- Discrete values (enums) apply as data attributes / class names on `<html>`:
  - `data-ring-style="dashed | solid | off"` — components style off the attribute.
  - `data-density="compact | comfortable | roomy"` — root padding / spacing scales react via Tailwind.
- The customize panel writes preview values via a Zustand `useCustomizeStore`, which sets the CSS variables and data attributes on `document.documentElement`.
- This is the same pattern `AppBackground.tsx` already uses for the background contract.

## Theme tab UX (multi-theme management)

- Two sections in the body:
  - **Curated** — read-only row: Quiet, Sunlit, Midnight, Forest. Click to load values into preview.
  - **Your themes** — user-saved themes with thumbnail previews, active checkmark, hover-revealed delete. Final tile is "+" to save current preview as a new theme.
- Header of "Your themes" row has a **+ Save current** button.
- Auto-named on creation: "My theme N" where N is the next available integer. Renamable via long-press / right-click → contextual rename action.

## Background tab UX

- **Source pills** at top of body: Curated · Your uploads · Solid color.
- **Curated**: 6-tile grid of curated images/videos with type badges (`img`/`video`).
- **Your uploads**: same grid, populated from the user's R2 uploads. Includes:
  - **+ Upload tile** at the end.
  - Hover-revealed × delete per tile.
  - Drag-and-drop on the entire panel triggers upload.
  - Quota counter in the source row: "N / 10 used".
  - Upload progress shown inline as a new tile with an indeterminate-then-determinate progress bar.
  - Guest users see a "Sign in to add your own backgrounds" CTA in this tab.
- **Solid color**: HSL picker.
- **URL paste**: small text input below the grid, accepts URL, shows preview thumbnail on blur. Warning text: *"URL backgrounds may break or fail to load due to host restrictions."*
- **Below grid**: Overlay tint slider, Overlay opacity slider, Blur slider (already wired to existing CSS vars).

## Customization control specs

| Tab | Control | Type | Range / Options |
|---|---|---|---|
| Theme | Curated presets | Cards | Quiet, Sunlit, Midnight, Forest |
| Theme | User themes | Cards | dynamic |
| Background | Source | Tabs | Curated, Uploads, Solid, URL |
| Background | Tiles | Grid | 6 curated, up to 10 uploads |
| Background | Overlay color | Color picker | HSL |
| Background | Overlay opacity | Slider | 0..1 |
| Background | Blur | Slider | 0..40px |
| Type | Family | Card grid | inter-tight, editorial-serif, mono, display-sans |
| Color | Accent | Swatches + picker | curated palette of 12 + custom HSL |
| Color | Contrast | Slider | 0.6..1 |
| Style | Ring style | Segmented | dashed, solid, off |
| Style | Density | Segmented | compact, comfortable, roomy |
| Style | Grain | Slider | 0..1 |

## Data model

### Theme JSON shape

```ts
type Theme = {
  id: string                       // uuid
  userId: string | null            // null = curated (only via API merge, not in DB)
  name: string
  isCurated: boolean
  version: 1
  customizations: {
    background:
      | { kind: 'curated'; assetId: string }
      | { kind: 'upload'; mediaId: string; mediaType: 'image' | 'video' }
      | { kind: 'url'; url: string; mediaType: 'image' | 'video' }
      | { kind: 'solid'; color: string }
    overlay: { color: string; opacity: number }
    blur: number
    grain: number
    typography: { family: 'inter-tight' | 'editorial-serif' | 'mono' | 'display-sans' }
    color: { accent: string; contrast: number }
    timer: { ringStyle: 'dashed' | 'solid' | 'off' }
    density: 'compact' | 'comfortable' | 'roomy'
  }
  createdAt: Date
  updatedAt: Date
}
```

### Drizzle tables

Add to `packages/api/src/db/tables/`:

```ts
// themes.ts
themes = pgTable('themes', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => user.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  customizations: jsonb().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})

// userMedia.ts
userMedia = pgTable('user_media', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => user.id, { onDelete: 'cascade' }),
  kind: text({ enum: ['image', 'video'] }).notNull(),
  r2Key: text().notNull(),
  filename: text().notNull(),
  sizeBytes: integer().notNull(),
  width: integer(),
  height: integer(),
  createdAt: timestamp().notNull().defaultNow(),
})
```

Modify existing `settings` table:

```ts
settings = pgTable('settings', {
  // ...existing columns
  activeThemeId: uuid().references(() => themes.id, { onDelete: 'set null' }),
})
```

### Curated themes

Stored as a TypeScript constant in `packages/types/curated-themes.ts` (an array of `Theme` objects with stable string IDs like `curated.quiet`, `curated.sunlit`, `curated.midnight`, `curated.forest`, plus the always-present `curated.default`). The API merges them with user themes in `GET /user/themes` responses; client treats them uniformly with `isCurated: true`. DELETE/PATCH on a curated theme returns 403.

Curated themes' `customizations.background` uses `kind: 'curated'` with an `assetId` referencing a fixed entry in `packages/types/curated-backgrounds.ts` (a parallel TS constant mapping each `assetId` to a static URL hosted in `apps/next/public/backgrounds/`).

### Guest localStorage keys

```ts
localStorage['befocus.themes']         // Array<Omit<Theme, 'userId' | 'createdAt' | 'updatedAt'>>
localStorage['befocus.activeThemeId']  // string
```

No media keys — guests cannot upload.

## API surface

New routes under `packages/api/src/routes/`:

```
GET    /user/themes                 list user themes + merged curated
POST   /user/themes                 create from current customizations
PATCH  /user/themes/:id             rename or update customizations
DELETE /user/themes/:id             (curated returns 403)
POST   /user/themes/import          bulk import from localStorage on signup
PATCH  /user/settings/active-theme  set active theme

POST   /user/media/upload-url       returns presigned R2 PUT URL + final asset URL
POST   /user/media                  create DB record after client-side upload
GET    /user/media                  list user's uploads
DELETE /user/media/:id              also deletes the R2 object
```

All follow the existing OpenAPI three-file split (`*.route.ts`, `*.handler.ts`, `*.index.ts`) and are wired into `packages/api/src/app.ts`.

## R2 setup

- New R2 bucket: `befocus-user-media` (production) and `befocus-user-media-dev` (dev).
- Wrangler binding: `MEDIA_BUCKET = R2Bucket` in `wrangler.toml`, exposed on `c.env.MEDIA_BUCKET`.
- Object keys: `{userId}/{mediaId}.{ext}` so user-scoped deletion is a prefix list + delete.
- Upload flow: client calls `POST /user/media/upload-url` → server returns presigned URL → client PUTs file directly to R2 → client calls `POST /user/media` to register the record. This avoids streaming uploads through the Worker.
- Validation: server validates content-type and size before issuing the presigned URL (rejects oversized requests). Filename sanitized and replaced with the generated mediaId.
- Read access: signed URLs with 1-hour expiry, regenerated on each `GET /user/media`. Or: configure the bucket with public read on the user-media path and rely on the unguessable mediaId for privacy. **Decision: signed URLs** (more secure, no incremental cost).

## File format / size limits

| Type | Formats | Max size | Max resolution | Max duration |
|---|---|---|---|---|
| Image | JPEG, PNG, WebP | 15 MB | 4K | n/a |
| Video | MP4, WebM | 80 MB | 4K | 30s |

Minimum recommended: 1080p (UI hint, not enforced).

## Sync strategy

- **Signed-in users**: themes and active-theme persist server-side. localStorage used only for instant-paint hydration on next page load. Server is source of truth.
- **Guest users**: themes and active-theme persist in localStorage only. No API calls.
- **On sign-up / first-time sign-in**:
  - If localStorage has themes that are not yet imported (tracked via `befocus.imported: '1'` flag): client calls `POST /user/themes/import` with the array.
  - Server creates theme records with the new user's ID.
  - Server returns the imported themes' new IDs; client updates the active-theme reference.
  - localStorage themes are cleared; `befocus.imported = '1'` set.

## Mobile breakpoint plan (Tailwind)

- `< 640px` (default): mobile pattern — single gear bottom-left → bottom-sheet panel.
- `≥ 768px` (`md:`): tablet/desktop pattern — vertical left rail with tools, inline floating panel above transport.
- `≥ 1024px` (`lg:`): same as md but with more breathing room (rail more centered).

## Edge cases / open questions

These were settled during brainstorm but worth re-stating for the implementation plan:

- **Click curated preset** = load into editor (not instant-apply). User must click Apply.
- **Close panel without Apply/Cancel** = revert to active theme (treat as Cancel).
- **Save current with no changes from active** = creates a duplicate theme, named "My theme N". (Acceptable.)
- **Delete the active theme** = revert active to "Default" (a built-in, always-present curated theme that can never be deleted). Plan the curated set to always include a "Default" entry.
- **Quota at 10/10 and user tries to upload** = upload button disabled with tooltip "Delete an upload to add more." `POST /user/media/upload-url` returns 409 when the user is already at quota (defense in depth).
- **URL-paste with broken URL** = applied background fails silently to a fallback (solid background color), with an inline warning surfacing in the panel.
- **Race conditions on Apply** (rapid Apply clicks) = idempotent server PATCH, last-write-wins. Acceptable.

## Component structure (target)

New files under `apps/next/src/components/customize/`:

- `CustomizePanel.tsx` — inline floating panel container with tab routing and footer.
- `CustomizeRailButton.tsx` — gear icon in the left rail; opens the panel.
- `tabs/ThemeTab.tsx` — curated + user themes grid, save-current button.
- `tabs/BackgroundTab.tsx` — source pills, image grid, URL paste, sliders.
- `tabs/TypeTab.tsx` — font family selector with previews.
- `tabs/ColorTab.tsx` — accent swatches + contrast slider.
- `tabs/StyleTab.tsx` — ring style, density, grain.
- `MediaUploader.tsx` — drag-drop + click-to-upload, progress, presigned URL flow.
- `MediaTile.tsx` — generic tile used in Curated and Uploads grids.

State:

- `useCustomizeStore` (Zustand) — preview state, active theme, all themes list, panel open/closed, current tab. Hydrates from server (signed-in) or localStorage (guest) on first paint.
- `useUploads` (TanStack Query) — list user media, mutations for upload-url + register + delete.
- `useThemes` (TanStack Query) — list themes, create/rename/delete/import mutations, set-active.

Mobile bottom sheet uses the same tab components inside a `<Sheet>` (ShadCN) wrapper.

## Acceptance criteria

- A signed-in user can open the customize panel from the left rail, change accent color, click Apply, and see the dashboard reflect the new accent. Refreshing the page preserves the change.
- A guest user can do the same, with the change persisted in localStorage.
- A signed-in user can upload an image (≤ 15 MB JPG/PNG/WebP) by clicking + or drag-dropping, see upload progress, see the new tile appear, set it as background, click Apply, and see it persist across refreshes.
- A signed-in user can save the current preview as a named theme, see it appear in "Your themes," click another saved theme to switch, and round-trip without data loss.
- A guest user with custom themes in localStorage who signs up has those themes migrated to their account on first sign-in.
- Mobile: the same workflow happens via a bottom sheet, not the inline panel.
- Apply/Cancel: clicking Cancel or closing the panel reverts the preview without persisting.
- All controls show their current value when the panel opens (the panel reflects the active theme).

## Out of scope (explicit)

- Light theme support (dark stays hardcoded).
- Custom CSS injection by users.
- Theme sharing / public marketplace.
- Server-side video transcoding or downscaling.
- Video poster (still-frame) generation.
- Subscription tiers / paid customization features.
- Theme version migrations (the `version: 1` field exists for the future, but no migrations are in v1).

## References

- Existing `--bg-*` CSS-var contract: `packages/ui/src/globals.css:5-16`, consumed by `apps/next/src/components/dashboard/AppBackground.tsx`.
- Existing settings hydration pattern (server-fetched-then-hydrate): `apps/next/src/app/(app)/layout.tsx`, `apps/next/src/hooks/DashboardShell.tsx`.
- Existing route pattern (OpenAPI three-file split): `packages/api/src/routes/user/`.
- Existing better-auth integration for user-scoped routes: `packages/api/src/lib/middlewares/auth/`.
