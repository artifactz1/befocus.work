# Roadmap: beFocus - Dashboard Customization

## Overview

This milestone turns a fixed dashboard into a personal one. It starts by repairing the ground it
has to stand on: the production cookie bug that silently kills server-side settings hydration, the
fake Tailwind dependency, the conflicting CSS tokens, and the broken lint gate. With that solid, a
customization engine writes CSS custom properties and data attributes onto the document root and a
panel exposes every control behind live preview with explicit Apply and Cancel. Persistence lands
next, in its final storage shape, so a look survives a refresh and follows the user across devices
while guests keep theirs in the browser. Saved themes then build on that same storage, adding
naming, switching, curated presets and guest-to-account migration. Finally the two bring-your-own
background sources arrive: R2-backed uploads with quota and server-side validation, then pasted
remote URLs with a safe fallback when a host blocks them.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation Repair** - Production settings hydration, one Tailwind, clean tokens, working lint gate
- [ ] **Phase 2: Customization Engine and Panel** - Every control, live preview, Apply and Cancel, desktop and mobile
- [ ] **Phase 3: Persistence and Sync** - A look survives refresh, follows the account, and sticks for guests
- [ ] **Phase 4: Saved Themes** - Name, switch, rename and delete looks; curated presets; guest migration
- [ ] **Phase 5: Media Uploads** - Upload your own images and videos to R2 behind the timer
- [ ] **Phase 6: URL Backgrounds** - Paste any remote image or video URL, with a safe fallback

## Phase Details

### Phase 1: Foundation Repair

**Goal**: The dashboard receives a signed-in user's saved settings on the server render in
production, from exactly one hydration path, and the styling and lint toolchain is single-sourced
and trustworthy again.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05
**Success Criteria** (what must be TRUE):

  1. A signed-in user loading the dashboard in production sees their own work duration, break
     duration and session count on first paint, with no flash of the built-in 25:00 / 5:00 defaults.

  2. Loading the dashboard triggers exactly one settings read, and the timer values never change
     again after the first paint (no second client-side fetch racing the server-fetched values).

  3. `bun run check` exits clean and `bun run turbo:build` succeeds from a fresh `bun install`.
  4. `apps/next` builds against a single declared Tailwind version, and the dashboard renders with
     no rule the installed version silently ignores and no design token defined twice with
     conflicting values.
**Plans**: 5 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md - Reproduce `__Secure-` cookie bug locally, forward raw Cookie header in getUserSettings (FND-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md - Real Tailwind 3.4 dependency, drop `@theme`, shine in config, single `--border` (FND-02, FND-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md - Per-request seeded timer store + server-seeded query cache: one read, zero flash (FND-05)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-04-PLAN.md - Biome 2 upgrade, churn commit, lint fixes, fresh-install gate (FND-04)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 01-05-PLAN.md - Human deploy + production verification (FND-01, FND-05)

Notes for planning:

- FND-01 is `apps/next/src/lib/server/getUserSettings.ts`, which hardcodes the cookie name
  `better-auth.session_token`; better-auth prefixes it `__Secure-` whenever cookies are secure.
  Fix it at the shared lookup, not at one call site, since every new server-hydrated preference in
  Phases 3-6 rides the same path. Verification is against the live deployment, not localhost, since
  the bug only appears when cookies are secure.

- FND-05 is the `DashboardShell` / `TimerInitializer` duplicate-hydration anti-pattern documented in
  `.planning/codebase/ARCHITECTURE.md`. Pick one hydration owner now, because the customization
  store in Phase 2 must not copy the broken pattern.

- FND-04 fails today because of a split install: `node_modules/@biomejs/biome` is 1.9.4 (matching
  `biome.json`'s v1 schema) but its sibling platform package `@biomejs/cli-darwin-arm64` is 2.4.13,
  and biome's launcher execs the platform binary. Root cause is `bun.lock`, which pins only
  `cli-linux-x64` and `cli-linux-x64-musl` under biome 1.9.4, so on macOS the darwin binary resolved
  unpinned to latest. Either pin `@biomejs/cli-darwin-arm64` to 1.9.4 or upgrade to Biome 2 and run
  `biome migrate`; upgrading also retires `biome.json`'s rejected v1 keys (`files.ignore`,
  top-level `organizeImports`). Do it as its own change, not smuggled into a feature diff.

- FND-03 covers the v4-only `@theme inline` block in `packages/ui/src/globals.css` that v3 ignores,
  and the `--border` token defined twice (layered and unlayered) with different values.

- FND-02 is `apps/next/package.json` depending on `tailwind@^4.0.0`, which is an unrelated streaming
  library, not Tailwind. The app compiles only because `tailwindcss@3.4.17` is hoisted from
  `packages/ui`. Decide deliberately whether the monorepo lands on Tailwind 3 or 4; FND-03's
  `@theme inline` block is v4 syntax, so the two requirements share one decision.

- A wrangler `^3.109.2` -> `^4.113.0` bump is parked in `git stash@{0}`, unverified. It is not part
  of this phase. If Phase 5 needs wrangler 4 for R2 bindings, upgrade it there deliberately and
  verify a deploy; otherwise drop the stash.

### Phase 2: Customization Engine and Panel

**Goal**: A user can open a customize panel from the dashboard and change every one of the ten
customizable surfaces, seeing the dashboard react the instant a control moves, then commit with
Apply or throw it away with Cancel. Nothing survives a refresh yet; Phase 3 adds that.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, CTL-01, CTL-02, CTL-03, CTL-04, CTL-05, CTL-06, CTL-07, CTL-08, CTL-09, CTL-10, CTL-11, CTL-12, CTL-13, UX-01, UX-02, UX-03, UX-04, UX-05, UX-06
**Success Criteria** (what must be TRUE):

  1. User opens the customize panel from the dashboard, finds it organized into Theme, Background,
     Type, Color and Style sections, and every control already shows the value currently in effect.

  2. Moving any control - solid background swatch, overlay tint, overlay opacity, blur,
     font family, accent colour, text contrast, timer progress style, density, grain - changes the dashboard
     immediately, before anything is committed.

  3. Apply keeps the new look; Cancel or closing the panel snaps the dashboard back to exactly how
     it looked before the panel opened.

  4. One Reset action returns every control and the dashboard to the default look.
  5. On a phone every control is reachable and usable in a bottom sheet, the timer stays usable at
     every supported viewport, and the whole panel can be driven from the keyboard with controls
     that announce themselves to a screen reader.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- ENG-01 has a half-built substrate to finish, not a contract to invent: `--bg-image`,
  `--bg-image-size`, `--bg-image-position`, `--bg-overlay-color`, `--bg-overlay-opacity` and
  `--bg-blur` already exist in `packages/ui/src/globals.css` and are consumed by
  `AppBackground.tsx`. The store is the missing writer. `--accent`, `--text-contrast`,
  `--grain-opacity`, `--font-*` and the `data-progress` / `data-density` attributes are new.

- Decisions locked in the prototype review (`.lavish/customization-prototype.html`): Edge progress
  is the default and the circular ring is gone; backgrounds are solid only (no gradients); the
  session grid becomes an accent contribution grid with focus fade; keyboard hints sit under the
  timer with the footer pill kept; menu buttons go bare. The panel itself is a solid surface.

- The Theme section exists structurally here but is only populated in Phase 4. Build the section so
  Phase 4 fills it rather than restructures the panel.

- `apps/next/src/components/settings/SoundSettings.tsx` hardcodes hex colours that bypass the token
  system, so it will not react to an accent or contrast change. Fix it while the accent control is
  being built.

### Phase 3: Persistence and Sync

**Goal**: A look a user applies is still there next time, painted on first render, for signed-in
users on any device and for guests in the same browser.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: ENG-05, SYN-01, SYN-02, SYN-03, SYN-05
**Success Criteria** (what must be TRUE):

  1. A signed-in user applies a look, refreshes, and the dashboard comes back already wearing it,
     with no flash of default styling on the way in.

  2. The same user signs in in a different browser or on a different device and sees the same look.
  3. A guest customizes at `/guest`, refreshes, and the look is still there in that browser.
  4. Clicking Apply repeatedly and quickly settles on exactly what the panel last showed, and a
     refresh confirms the server agrees.
**Plans**: TBD

Notes for planning:

- Land storage in its final shape here: a theme record plus an active-theme pointer on settings, as
  in `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md`. Phase 4 then adds naming
  and multi-theme management on top instead of migrating a throwaway column.

- Hydration goes through the single owner established in FND-05, not a new parallel path.
- Guest persistence is the first use of `localStorage` in `apps/next/src/store/` - there is no
  existing `persist` usage in the repo to copy.

### Phase 4: Saved Themes

**Goal**: A user keeps more than one look, switches between them, starts from a curated preset, and
carries a guest's customizations onto a brand new account.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: THM-01, THM-02, THM-03, THM-04, THM-05, THM-06, SYN-04
**Success Criteria** (what must be TRUE):

  1. User saves the current preview under a name and sees it listed alongside the curated presets.
  2. User switches the active theme by picking a saved one, and can rename or delete the themes
     they own.

  3. Loading a curated preset fills the panel's controls without changing the dashboard until Apply.
  4. Renaming or deleting a curated theme is refused by the server, not merely hidden in the UI.
  5. Deleting the active theme leaves the dashboard on the built-in Default theme, never on a blank
     or broken one, and a guest who creates an account finds their local customizations on that
     account afterwards - exactly once, with no duplicates on later sign-ins.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- SYN-04 migration must be idempotent. The design spec's `befocus.imported` flag is one way; the
  requirement is that a second sign-in does not duplicate themes.

- Curated themes live as a TypeScript constant merged into list responses, so "cannot be edited or
  deleted" needs an explicit server-side rejection path, not just absence of a DB row.

### Phase 5: Media Uploads

**Goal**: A signed-in user puts their own images and videos behind the timer, bounded by a quota and
validated before a single byte is stored.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: MED-01, MED-02, MED-03, MED-04, MED-05, MED-06, MED-07, MED-08, MED-09
**Success Criteria** (what must be TRUE):

  1. A signed-in user drags in or picks a JPEG, PNG or WebP up to 15 MB, or an MP4 or WebM up to
     80 MB, watches progress, and the file appears as a selectable background tile.

  2. Applying an uploaded background keeps it across refreshes; deleting an upload removes both the
     tile and the stored object.

  3. A file of the wrong type or over the size limit is refused before any upload begins, and the
     browser's network panel shows the file going straight to storage rather than through the API.

  4. Once the per-user file limit is reached the upload control is disabled, and the server refuses
     an upload request on its own even when the UI is bypassed.

  5. A second account cannot read or delete the first account's media, and a guest sees a sign-in
     prompt where the upload controls would be.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- All the new infrastructure for this milestone is concentrated here: the R2 bucket, the Wrangler
  binding, presigned PUT URLs and signed read URLs, user-scoped object keys. `packages/api/wrangler.toml`
  currently has every binding block commented out.

- User-uploaded media is untrusted input. Content type and size are validated server-side before a
  presigned URL is issued, keys are scoped per user, and reads go through signed URLs.

- Uploads must not stream through the Worker; that is a runtime constraint, not a preference.

### Phase 6: URL Backgrounds

**Goal**: Any image or video already on the web can be the background, and a link that breaks leaves
the dashboard usable instead of blank.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: URL-01, URL-02, URL-03
**Success Criteria** (what must be TRUE):

  1. User pastes a remote image or video URL and sees it previewed as the background before
     applying it.

  2. The panel warns, next to the input, that URL backgrounds can break due to host restrictions.
  3. A broken or host-blocked URL leaves the dashboard on a safe fallback background with an inline
     warning in the panel, and the timer stays fully usable.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Repair | 2/5 | In Progress|  |
| 2. Customization Engine and Panel | 0/TBD | Not started | - |
| 3. Persistence and Sync | 0/TBD | Not started | - |
| 4. Saved Themes | 0/TBD | Not started | - |
| 5. Media Uploads | 0/TBD | Not started | - |
| 6. URL Backgrounds | 0/TBD | Not started | - |

## Requirement Coverage

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1. Foundation Repair | FND-01..05 | 5 |
| 2. Customization Engine and Panel | ENG-01..04, CTL-01..13, UX-01..06 | 23 |
| 3. Persistence and Sync | ENG-05, SYN-01, SYN-02, SYN-03, SYN-05 | 5 |
| 4. Saved Themes | THM-01..06, SYN-04 | 7 |
| 5. Media Uploads | MED-01..09 | 9 |
| 6. URL Backgrounds | URL-01..03 | 3 |
| **Total** | | **52** |

All 52 v1 requirements are mapped to exactly one phase. No orphans, no duplicates.

## Verification Note

No test runner exists in this repo and none is being introduced. Every success criterion above is
verified by exercising the running app (`bun run web`, `bun run api`, or the live deployment for
FND-01), or by running the repo's own `bun run check` / `bun run turbo:build` scripts.

---
*Roadmap created: 2026-09-23*
